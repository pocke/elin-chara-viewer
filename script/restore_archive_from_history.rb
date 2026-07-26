# frozen_string_literal: true

# One-shot import of the versions that only exist in this repository's git
# history into the archive repository. Later versions are added by
# archive_release.rb as they are released, and versions older than the history
# are added from Steam downloads, so this is not part of the release flow.
#
# Usage: ruby script/restore_archive_from_history.rb <archive-dir> [--ref REF]

require 'English'
require 'optparse'
require_relative 'archive_repo'

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

def main
  ref = DEFAULT_REF
  parser = OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/restore_archive_from_history.rb <archive-dir> [--ref REF]'
    opts.on('--ref REF', 'git ref to walk (default: origin/master)') { |v| ref = v }
  end
  parser.parse!
  root = ARGV.shift or abort parser.banner

  history = commits(ref)
  snapshots, first_seen = collect_snapshots(history)
  channels = collect_channels(history)
  blobs = {}

  snapshots.each do |version, files|
    csv_files = files.to_h { |table, sha|
      blobs[sha] ||= git('cat-file', 'blob', sha)
      [table, blobs[sha]]
    }

    ArchiveRepo.write_version(
      root,
      {
        'version' => version,
        'channel' => channels.fetch(version, nil),
        # The day the version was committed here, which is the release date give
        # or take the delay before the export ran. Steam has the exact dates and
        # the backfill will correct them.
        'releaseDate' => first_seen.fetch(version)
      },
      csv_files
    )
  end

  entries = ArchiveRepo.build_index(root)
  puts "Restored #{entries.size} versions into #{root}"
  puts "Tables per version: #{entries.map { |e| e['tables'].size }.tally.sort.to_h}"
end

main if $PROGRAM_NAME == __FILE__
