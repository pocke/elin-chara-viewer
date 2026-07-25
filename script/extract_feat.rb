require 'English'
require 'fileutils'
require 'optparse'
require 'strscan'
require 'json'

GITHUB_REPO_URL = "https://github.com/Elin-Modding-Resources/Elin-Decompiled"

def prepare
  if Dir.exist?("tmp/Elin-Decompiled")
    sh! "git", "-C", "tmp/Elin-Decompiled", "fetch", "--filter=blob:none"
  else
    sh! "git", "clone", "--filter=blob:none", GITHUB_REPO_URL, "tmp/Elin-Decompiled"
  end
end

VERSION_FILES = { 'EA' => 'versions/EA', 'Nightly' => 'versions/nightly' }.freeze

def feat_source(commit)
  out = IO.popen(
    ['git', '-C', 'tmp/Elin-Decompiled', 'show', "#{commit}:Elin/FEAT.cs"],
    'rb',
    &:read
  )
  raise "git show #{commit}:Elin/FEAT.cs failed" unless $CHILD_STATUS.success?

  out
end

def version_value(str)
  m = str.match(/(\d+)\.(\d+)/) or raise "no version in #{str.inspect}"
  major, minor = m.captures
  patch = str[/Patch (\d+)/, 1] || 0
  [major.to_i, minor.to_i, patch.to_i]
end

def candidates
  # The log is newest-first, so `find` picks the newest commit for a version.
  @candidates ||= `git -C tmp/Elin-Decompiled log --format=%H%x09%s origin/main`
                  .each_line
                  .filter_map { |line|
                    hash, subject = line.chomp.split("\t", 2)
                    next unless subject&.match?(/\d+\.\d+/)
                    [hash, subject, version_value(subject)]
                  }
end

# Returns [commit, the decompiled build it came from]. The build is reported so
# that a version whose exact build is missing upstream is distinguishable from
# one that matched.
def closest_commit(spec)
  target = version_value(spec)

  exact = candidates.find { |_hash, _subject, value| value == target }
  return exact.first(2) if exact

  warn "extract_feat: no decompiled build for #{spec.inspect}; falling back to the closest older version"
  older = candidates.map { |_hash, _subject, value| value }.select { |value| (value <=> target).negative? }
  best = older.max or raise "no decompiled build at or before #{spec.inspect}"
  candidates.find { |_hash, _subject, value| value == best }.first(2)
end

def sh!(*cmd)
  system(*cmd, exception: true)
end

def make_json(spec)
  commit, build = closest_commit(spec)
  sc = StringScanner.new(feat_source(commit))

  # `virtual` was added to the signature partway through the game's history.
  sc.skip_until(/^\tpublic (?:virtual )?List<string> Apply\(/) or raise "no Apply method for #{spec.inspect}"

  feat_ids = []
  sub_feats = {}
  result = {}

  loop do
    if sc.scan(/^\s*case (?=\d+:)/)
      feat_ids << sc.scan(/\d+/) or raise
      sc.skip(/:\n/)
      next
    end

    if sc.scan(/^\s*break;\n/)
      flush result, feat_ids, sub_feats
      feat_ids = []
      sub_feats = {}
      next
    end

    # ModBase(423, a, hide: false);
    if sc.scan(/^\s*ModBase\((?=\d+,\s*-?a,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*/)
      sub_feats[target_id] = sc.scan(/-/) ? -1 : 1
      sc.skip(/.+\n/)
      next
    end

    # ModBase(956, a * 5, hide: false);
    if sc.scan(/^\s*ModBase\((?=\d+,\s*-?a\s*\*\s*-?\d+,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*/)
      sign = sc.scan(/-/) ? -1 : 1
      sc.skip(/a\s*\*\s*/)
      power = sc.scan(/-?\d+/) or raise
      sub_feats[target_id] = power.to_i * sign
      sc.skip(/.+\n/)
      next
    end

    # ModBase(956, a / 40, hide: false);
    if sc.scan(/^\s*ModBase\((?=\d+,\s*a\s*\/\s*-?\d+,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*a\s*\/\s*/)
      power = sc.scan(/-?\d+/) or raise
      sub_feats[target_id] = 1 / power.to_f
      sc.skip(/.+\n/)
      next
    end

    # ModBase(60, A * 2 * invert, hide: false);
    # A == a.abs and invert == a's sign, so A * N * invert == a * N.
    if sc.scan(/^\s*ModBase\((?=\d+,\s*-?A\s*\*\s*-?\d+\s*\*\s*invert,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*/)
      sign = sc.scan(/-/) ? -1 : 1
      sc.skip(/A\s*\*\s*/)
      power = sc.scan(/-?\d+/) or raise
      sub_feats[target_id] = power.to_i * sign
      sc.skip(/.+\n/)
      next
    end

    if sc.scan(/^\t}/)
      flush result, feat_ids, sub_feats
      break
    end

    sc.skip(/^.+\n/)
  end

  [result, build]
end

def write_json(path, result)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, JSON.pretty_generate(result))
end

def generate_current
  VERSION_FILES.each do |version, path|
    result, = make_json(File.read(path).strip)
    write_json("src/generated/featModifier.#{version.downcase}.json", result)
  end
end

def generate_archive(dir)
  index = JSON.parse(File.read(File.join(dir, 'index.json')))

  index.each do |entry|
    begin
      result, build = make_json(entry['version'])
      write_json(File.join(dir, 'featModifier', "#{entry['slug']}.json"), result)
      entry['featModifier'] = true
      entry['featModifierSource'] = build
    rescue StandardError => e
      warn "extract_feat: #{entry['version']} failed: #{e.message}"
      entry['featModifier'] = false
      entry['featModifierSource'] = nil
    end
  end

  File.write(File.join(dir, 'index.json'), "#{JSON.pretty_generate(index)}\n")
end

def main
  archive_dir = nil
  parser = OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/extract_feat.rb [--archive DIR]'
    opts.on('--archive DIR', 'generate one file per version listed in DIR/index.json') { |v| archive_dir = v }
  end
  parser.parse!

  prepare

  if archive_dir
    generate_archive(archive_dir)
  else
    generate_current
  end
end

def flush(result, feat_ids, sub_feats)
  return if sub_feats.empty?

  feat_ids.each do |feat_id|
    result[feat_id] = sub_feats
  end
end

main
