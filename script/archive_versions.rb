# frozen_string_literal: true

# Rebuilds the version archive (csv/ + index.json) from this repository's git
# history. Usage: ruby script/archive_versions.rb <output-dir> [--ref origin/master]

require 'English'
require 'csv'
require 'digest'
require 'fileutils'
require 'json'
require 'optparse'

# Abandoned topic branches contain exports made with a buggy mod build
# (EA_23_306_Nightly holds a jobs.csv whose columns are shifted), so the walk is
# restricted to a single ref instead of --all.
DEFAULT_REF = 'origin/master'

CHANNEL_FILES = { 'stable' => 'versions/EA', 'nightly' => 'versions/nightly' }.freeze

def git(*args, allow_failure: false)
  out = IO.popen(['git', *args], 'rb', **(allow_failure ? { err: File::NULL } : {}), &:read)
  raise "git #{args.join(' ')} failed" unless allow_failure || $CHILD_STATUS.success?

  out
end

def version_key(version)
  m = version.match(/(\d+)\.(\d+)/) or raise "no version number in #{version.inspect}"
  [m[1].to_i, m[2].to_i, version[/Patch (\d+)/, 1].to_i]
end

def slugify(version)
  version.sub(/\AEA /, '').downcase.gsub(/[^a-z0-9.]+/, '-').gsub(/\A-|-\z/, '')
end

def commits(ref)
  git('rev-list', '--reverse', ref).split
end

# version -> { table -> blob sha }. Later commits win: the early versions had
# their tables committed one by one, and EA 23.173 Patch 1 was first committed
# with a BOM that a later commit stripped.
def collect_snapshots(commits)
  snapshots = {}
  first_seen = {}

  commits.each do |commit|
    tables = Hash.new { |h, k| h[k] = {} }
    git('ls-tree', '-r', '-z', commit, 'db/').split("\0").each do |entry|
      meta, path = entry.split("\t", 2)
      next unless path

      sha = meta.split[2]
      _, version, file = path.split('/', 3)
      next unless file&.end_with?('.csv')

      tables[version][File.basename(file, '.csv')] = sha
    end

    tables.each do |version, files|
      first_seen[version] ||= git('log', '-1', '--format=%ad', '--date=short', commit).strip
      snapshots[version] = files
    end
  end

  [snapshots, first_seen]
end

# A version that shipped on nightly and was later promoted to stable appears in
# both files with identical CSVs, so stable wins when both match.
def collect_channels(commits)
  channels = Hash.new { |h, k| h[k] = [] }

  commits.each do |commit|
    CHANNEL_FILES.each do |channel, path|
      version = git('show', "#{commit}:#{path}", allow_failure: true).strip
      channels[version] << channel unless version.empty?
    end
  end

  channels.transform_values { |list| list.include?('stable') ? 'stable' : 'nightly' }
end

def write_version(dir, files, blobs)
  FileUtils.mkdir_p(dir)
  files.each do |table, sha|
    blobs[sha] ||= git('cat-file', 'blob', sha)
    File.binwrite(File.join(dir, "#{table}.csv"), blobs[sha])
  end
end

# The identifiers the detail pages accept, so that the server can answer 404
# for anything else instead of rendering an empty page for every URL it is
# asked for.
def write_ids(dir, version_dir)
  ids = {
    # csvLoader strips the space out of "fish_ piranha" before it reaches a URL.
    'charas' => csv_column(File.join(version_dir, 'charas.csv'), 'id').map { |id| id.sub(' ', '') },
    'elements' => csv_column(File.join(version_dir, 'elements.csv'), 'alias')
  }

  FileUtils.mkdir_p(dir)
  File.write(File.join(dir, "#{File.basename(version_dir)}.json"), "#{JSON.generate(ids)}\n")
end

def csv_column(path, column)
  CSV.read(path, headers: true, encoding: 'bom|utf-8').filter_map { |row| row[column] }.uniq
end

def build_index(snapshots, first_seen, channels)
  snapshots.map { |version, files|
    {
      'version' => version,
      'slug' => slugify(version),
      'channel' => channels.fetch(version, nil),
      'date' => first_seen.fetch(version),
      'tables' => files.keys.sort,
      'contentHash' => Digest::SHA256.hexdigest(files.sort.map { |t, sha| "#{t}:#{sha}" }.join("\n")),
      'source' => 'git',
      'featModifier' => false,
      'featModifierSource' => nil
    }
  }.sort_by { |entry| [version_key(entry['version']), entry['date']] }
end

def main
  ref = DEFAULT_REF
  parser = OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/archive_versions.rb <output-dir> [--ref REF]'
    opts.on('--ref REF', 'git ref to walk (default: origin/master)') { |v| ref = v }
  end
  parser.parse!
  out_dir = ARGV.shift or abort parser.banner

  history = commits(ref)
  snapshots, first_seen = collect_snapshots(history)
  channels = collect_channels(history)
  index = build_index(snapshots, first_seen, channels)

  slugs = index.map { |entry| entry['slug'] }
  duplicated = slugs.tally.select { |_, count| count > 1 }.keys
  raise "duplicated slugs: #{duplicated.join(', ')}" unless duplicated.empty?

  FileUtils.rm_rf(File.join(out_dir, 'csv'))
  FileUtils.rm_rf(File.join(out_dir, 'ids'))
  FileUtils.rm_rf(File.join(out_dir, 'featModifier'))
  blobs = {}
  index.each do |entry|
    version_dir = File.join(out_dir, 'csv', entry['slug'])
    write_version(version_dir, snapshots.fetch(entry['version']), blobs)
    write_ids(File.join(out_dir, 'ids'), version_dir)
  end

  FileUtils.mkdir_p(out_dir)
  File.write(File.join(out_dir, 'index.json'), "#{JSON.pretty_generate(index)}\n")

  puts "Archived #{index.size} versions to #{out_dir}"
  puts "Tables per version: #{index.map { |e| e['tables'].size }.tally.sort.to_h}"
end

main if $PROGRAM_NAME == __FILE__
