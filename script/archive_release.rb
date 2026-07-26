# frozen_string_literal: true

# Copies one version out of db/ into the archive repository and regenerates
# index.json. Runs from CI after a release is merged, and by hand after a
# version has been exported from a Steam download.
#
# Usage: ruby script/archive_release.rb <archive-dir> <version> [options]
#
#   --channel stable|nightly   defaults to whichever versions/ file names it
#   --release-date YYYY-MM-DD  defaults to today
#   --db DIR                   directory holding <version>/, defaults to db

require 'date'
require 'optparse'
require 'pathname'
require_relative 'archive_repo'

ROOT = Pathname(__dir__).join('..')
CHANNEL_FILES = { 'stable' => 'versions/EA', 'nightly' => 'versions/nightly' }.freeze

def channel_of(version)
  CHANNEL_FILES.find { |_channel, path|
    full = ROOT.join(path)
    full.exist? && full.read.strip == version
  }&.first
end

def main
  options = { db: ROOT.join('db').to_s }
  parser = OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/archive_release.rb <archive-dir> <version> [options]'
    opts.on('--channel CHANNEL', 'stable or nightly') { |v| options[:channel] = v }
    opts.on('--release-date DATE', 'YYYY-MM-DD') { |v| options[:release_date] = v }
    opts.on('--db DIR', 'directory holding <version>/') { |v| options[:db] = v }
  end
  parser.parse!
  root = ARGV.shift or abort parser.banner
  version = ARGV.shift or abort parser.banner

  source_dir = File.join(options[:db], version)
  csv_paths = Dir.glob(File.join(source_dir, '*.csv'))
  abort "no CSV files in #{source_dir}" if csv_paths.empty?

  csv_files = csv_paths.to_h { |path| [File.basename(path, '.csv'), File.binread(path)] }

  slug = ArchiveRepo.slugify(version)
  known = ArchiveRepo.slugs(root).include?(slug) ? ArchiveRepo.read_meta(root, slug) : {}
  channel = options[:channel] || channel_of(version) || known['channel']
  abort "cannot tell which channel #{version} shipped on; pass --channel" unless channel

  dir = ArchiveRepo.write_version(
    root,
    {
      'version' => version,
      'channel' => channel,
      # A nightly that is promoted to stable is archived twice; the date it
      # first shipped is the one worth keeping.
      'releaseDate' => options[:release_date] || known['releaseDate'] || Date.today.to_s
    },
    csv_files
  )
  ArchiveRepo.build_index(root)

  puts "Archived #{version} (#{csv_files.size} tables) into #{dir}"
end

main if $PROGRAM_NAME == __FILE__
