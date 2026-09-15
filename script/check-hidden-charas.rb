# frozen_string_literal: true

require 'csv'
require 'English'
require 'json'
require 'optparse'
require 'pathname'
require 'set'
require 'zlib'

# Elin's map blueprints (.z / .s) embed a lz4net-compressed JSON export. This
# is the format lz4net's LZ4Codec.Wrap produces: 1MB chunks, each a 1-byte
# flag (1 = LZ4-compressed, 0 = stored) followed by two 7-bit varints
# (uncompressed length, compressed length) and the payload.
module Lz4Net
  module_function

  def read_varint(data, pos)
    result = 0
    shift = 0
    loop do
      byte = data.getbyte(pos) or raise "truncated varint at byte #{pos}"

      pos += 1
      result |= (byte & 0x7f) << shift
      break if (byte & 0x80).zero?

      shift += 7
    end
    [result, pos]
  end

  def decode_block(src)
    out = String.new(encoding: Encoding::ASCII_8BIT)
    i = 0
    n = src.bytesize
    while i < n
      token = src.getbyte(i)
      i += 1

      lit = token >> 4
      if lit == 15
        loop do
          b = src.getbyte(i) or raise 'truncated lz4 literal length'

          i += 1
          lit += b
          break if b != 255
        end
      end
      out << src.byteslice(i, lit)
      i += lit
      break if i >= n

      offset_hi = src.getbyte(i + 1) or raise 'truncated lz4 match offset'
      offset = src.getbyte(i) | (offset_hi << 8)
      i += 2
      raise "invalid lz4 match offset #{offset}" if offset.zero? || offset > out.bytesize

      match_length = token & 0xf
      if match_length == 15
        loop do
          b = src.getbyte(i) or raise 'truncated lz4 match length'

          i += 1
          match_length += b
          break if b != 255
        end
      end
      match_length += 4

      # Matches can overlap the bytes just written, so copy one byte at a time.
      start = out.bytesize - offset
      match_length.times { |k| out << out.getbyte(start + k) }
    end
    out
  end

  def decompress(data)
    pos = 0
    n = data.bytesize
    out = String.new(encoding: Encoding::ASCII_8BIT)
    while pos < n
      flag = data.getbyte(pos)
      pos += 1
      uncompressed_len, pos = read_varint(data, pos)
      compressed_len, pos = read_varint(data, pos)
      payload = data.byteslice(pos, compressed_len)
      pos += compressed_len
      chunk = flag == 1 ? decode_block(payload) : payload
      if chunk.bytesize != uncompressed_len
        raise "lz4net chunk size mismatch: expected #{uncompressed_len}, got #{chunk.bytesize}"
      end

      out << chunk
    end
    out
  end
end

def inflate_raw_deflate(data)
  zstream = Zlib::Inflate.new(-Zlib::MAX_WBITS)
  zstream.inflate(data) + zstream.finish
ensure
  zstream&.close
end

# Minimal ZIP reader: blueprints are stored as a flat sequence of local file
# header + data, with no data descriptors, so a linear scan is enough and
# avoids adding a zip gem.
def extract_zip_entry(data, entry_name)
  pos = 0
  n = data.bytesize
  while pos + 30 <= n
    return nil unless data.byteslice(pos, 4) == "PK\x03\x04".b

    _version, _flag, method, _mtime, _mdate, _crc32, compressed_size, _uncompressed_size, name_len, extra_len =
      data.byteslice(pos + 4, 26).unpack('vvvvvVVVvv')
    name = data.byteslice(pos + 30, name_len)
    data_start = pos + 30 + name_len + extra_len
    compressed = data.byteslice(data_start, compressed_size)

    return method.zero? ? compressed : inflate_raw_deflate(compressed) if name == entry_name

    pos = data_start + compressed_size
  end
  nil
end

# Basenames of UI/debug files that reference chara ids for reasons unrelated
# to appearing on a map (e.g. StickyMenu's drama menu, UIRecipeInfo's tooltip
# text). Filtering these out is what keeps nerun (a drama-only chara) from
# being misread as reachable.
EXCLUDED_SOURCE_BASENAME_PREFIXES = %w[UI Layer Content Widget Sticky Menu CoreDebug CoreConfig].freeze

def source_literal_chara_ids(source_dir, chara_ids)
  elin_dir = File.join(source_dir, 'Elin')
  raise "decompiled source not found at #{elin_dir}" unless Dir.exist?(elin_dir)

  found = Set.new
  # Glob's single '*' does not recurse, so files under Elin/Plugins.*/ etc. are
  # excluded along with the UI/debug files. `base:` keeps `[`/`{` etc. in
  # elin_dir itself from being interpreted as glob syntax.
  Dir.glob('*.cs', base: elin_dir).sort.each do |name|
    basename = File.basename(name, '.cs')
    next if EXCLUDED_SOURCE_BASENAME_PREFIXES.any? { |prefix| basename.start_with?(prefix) }

    File.read(File.join(elin_dir, name), encoding: 'UTF-8').scan(/"([A-Za-z_][A-Za-z0-9_]*)"/) do |literal,|
      found << literal if chara_ids.include?(literal)
    end
  end
  found
end

def version_pair(str)
  m = str.match(/(\d+)\.(\d+)/)
  m && [m[1].to_i, m[2].to_i]
end

def warn_on_source_version_mismatch(source_dir, db_dir)
  return unless Dir.exist?(File.join(source_dir, '.git'))

  subject = IO.popen(['git', '-C', source_dir, 'log', '-1', '--format=%s'], &:read).strip
  raise "git -C #{source_dir} log failed" unless $CHILD_STATUS.success?

  source_version = version_pair(subject)
  db_version = version_pair(File.basename(db_dir))
  return if source_version.nil? || db_version.nil? || source_version == db_version

  warn "check-hidden-charas: decompiled source is at #{subject.inspect}, " \
       "which does not match db directory #{File.basename(db_dir).inspect}"
end

# Columns that name-drop a chara id for a reason other than "this chara
# appears on a map":
# - charas.csv's idActor/faith borrow another chara's look or a god's name
# - collectibles.csv/religions.csv's id, and persons.csv's id/idActor, are
#   the same chara registered as a figure/collectible, an object of
#   worship, or a drama-only person (nerun's own row there) - not as a
#   map appearance
# - things.csv's name/name_JP can spell out a chara's id as an item's
#   display name (e.g. the caught fish "shark"/"turtle")
# - langGeneral.csv's filter can group UI text as lines a chara speaks in
#   a menu (e.g. nerun's lines in the playlist-editor screen), which is
#   still not a map appearance
# - charaText.csv gets a row (calm/fov/aggro/dead/kill lines) once a chara
#   has any dialogue at all, including Oneblock-only recruits (e.g.
#   strangeScientist) who never appear otherwise
EXCLUDED_CSV_COLUMNS = {
  'charas.csv' => %w[idActor faith],
  'charaText.csv' => %w[id],
  'collectibles.csv' => %w[id],
  'religions.csv' => %w[id],
  'things.csv' => %w[name name_JP],
  'langGeneral.csv' => %w[filter],
  'persons.csv' => %w[id idActor],
}.freeze

def csv_reference_chara_ids(db_dir, chara_ids)
  found = Set.new
  # `base:` keeps `[`/`{` etc. in db_dir itself from being interpreted as
  # glob syntax.
  Dir.glob('*.csv', base: db_dir).sort.each do |name|
    path = File.join(db_dir, name)
    excluded_columns = EXCLUDED_CSV_COLUMNS[name] || []

    CSV.read(path, headers: true, encoding: 'bom|utf-8').each do |row|
      # Only charas.csv is self-referential (e.g. its own `name` column
      # spelling out its own id); other tables' ids are real primary keys.
      own_id = name == 'charas.csv' ? row['id'] : nil

      row.each do |column, value|
        next if excluded_columns.include?(column)
        next if value.nil?

        value.split(%r{[,/|]+}).each do |token|
          next if token.empty? || token == own_id
          next unless chara_ids.include?(token)

          found << token
        end
      end
    end
  end
  found
end

def blueprint_chara_ids(game_dir, chara_ids)
  map_dir = File.join(game_dir, 'Package', '_Elona', 'Map')
  # `_festival.s` and the other *.s files are the fireworks/lamp/festival
  # merchants' blueprints; skipping them hides those merchants by mistake.
  # `base:` keeps `[`/`{` etc. in map_dir itself from being interpreted as
  # glob syntax.
  names = Dir.glob('*.z', base: map_dir) + Dir.glob('*.s', base: map_dir)
  raise "no blueprint files found under #{map_dir}" if names.empty?

  found = Set.new
  names.sort.each do |name|
    path = File.join(map_dir, name)
    data = File.binread(path)
    json_bytes = data.start_with?('PK') ? extract_zip_entry(data, 'export') : data
    raise 'no `export` entry' if json_bytes.nil?

    json_bytes = Lz4Net.decompress(json_bytes) unless json_bytes.start_with?('{')
    doc = JSON.parse(json_bytes)
    cards = doc.dig('serializedCards', 'cards') || []
    cards.each do |card|
      id = card['strs']&.first
      found << id if id && chara_ids.include?(id)
    end
  rescue StandardError => e
    raise "failed to decode blueprint #{path}: #{e.message}"
  end
  found
end

def party_tag_chara_ids(charas_rows)
  charas_rows.select { |row| (row['tag'] || '').split(',').include?('party') }
             .map { |row| row['id'] }
end

def hidden_chara_ids_in_source(root)
  path = root.join('src/lib/models/chara.ts')
  content = path.read
  match = content.match(/const hiddenCharaIds = \[(.*?)\n\s*\];/m)
  raise "hiddenCharaIds array not found in #{path}" unless match

  match[1].scan(/'([^']+)'/).flatten
end

def parse_options(argv, root)
  options = {
    game: '/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin',
    source: 'tmp/Elin-Decompiled',
    db: nil,
  }
  OptionParser.new do |opts|
    opts.banner = 'usage: check-hidden-charas.rb [--game DIR] [--source DIR] [--db DIR]'
    opts.on('--game DIR', 'Elin installation directory') { |v| options[:game] = v }
    opts.on('--source DIR', 'Decompiled source checkout') { |v| options[:source] = v }
    opts.on('--db DIR', 'CSV directory') { |v| options[:db] = v }
  end.parse!(argv)

  options[:db] ||= "db/#{root.join('versions/EA').read.strip}"
  options
end

def main
  root = Pathname(__dir__).join('..')
  options = parse_options(ARGV, root)
  db_dir = options[:db]
  source_dir = options[:source]
  game_dir = options[:game]

  charas_path = File.join(db_dir, 'charas.csv')
  raise "charas.csv not found at #{charas_path}" unless File.exist?(charas_path)

  charas_rows = CSV.read(charas_path, headers: true, encoding: 'bom|utf-8')
  chara_ids = charas_rows.map { |row| row['id'] }.to_set

  warn_on_source_version_mismatch(source_dir, db_dir)

  evidence_ids =
    blueprint_chara_ids(game_dir, chara_ids) |
    source_literal_chara_ids(source_dir, chara_ids) |
    csv_reference_chara_ids(db_dir, chara_ids) |
    party_tag_chara_ids(charas_rows)

  should_list_ids = Set.new
  charas_rows.each do |row|
    id = row['id']
    tags = (row['tag'] || '').split(',')
    has_no_random_product = tags.include?('noRandomProduct')
    is_god_no_boss = row['race'] == 'god' && !tags.include?('boss')
    chance = (row['chance'] || '0').to_i
    is_hidden_candidate = chance.zero? && !evidence_ids.include?(id)

    hidden = has_no_random_product || is_god_no_boss || is_hidden_candidate
    # noRandomProduct already hides the chara on its own, so the enumeration
    # in chara.ts deliberately omits ids that would be redundant with it.
    should_list_ids << id if hidden && !has_no_random_product
  end

  listed_ids = hidden_chara_ids_in_source(root).to_set

  missing = (should_list_ids - listed_ids).to_a.sort
  extra = (listed_ids - should_list_ids).to_a.sort

  if missing.empty? && extra.empty?
    puts "check-hidden-charas: OK (#{listed_ids.size} ids listed, #{evidence_ids.size} ids found with evidence)"
    exit 0
  end

  unless missing.empty?
    puts 'Not listed in hiddenCharaIds, but no evidence of appearing was found (add these):'
    missing.each { |id| puts "  #{id}" }
  end
  unless extra.empty?
    puts 'Listed in hiddenCharaIds, but evidence of appearing was found (remove these, or investigate):'
    extra.each { |id| puts "  #{id}" }
  end
  exit 1
end

main if $PROGRAM_NAME == __FILE__
