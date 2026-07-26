# frozen_string_literal: true

# Writes the version each manifest turned out to hold back into manifests.json.
#
# Usage: ruby script/record_manifest_versions.rb [tmp/backfill/state.tsv]
#
# A build only names itself once it has been downloaded and run, so this is the
# record of work already done rather than something that can be derived.

require 'json'

ROOT = File.expand_path('..', __dir__)
MANIFESTS = File.join(ROOT, 'manifests.json')

def main
  state = ARGV[0] || File.join(ROOT, 'tmp/backfill/state.tsv')
  abort "no state file: #{state}" unless File.exist?(state)

  versions = {}
  File.foreach(state) do |line|
    id, _date, _branch, status, version, = line.chomp.split("\t")
    next unless %w[done duplicate].include?(status)
    next if version.to_s.empty?

    versions[id] = version
  end
  abort "no restored manifests in #{state}" if versions.empty?

  manifests = JSON.parse(File.read(MANIFESTS))
  named = manifests.count { |m| versions.key?(m['manifestId']) }
  manifests.each do |manifest|
    version = versions[manifest['manifestId']] or next
    manifest['version'] = version
  end

  File.write(MANIFESTS, "#{JSON.pretty_generate(manifests)}\n")
  puts "named #{named} of #{manifests.size} manifests (#{versions.values.uniq.size} distinct versions)"
end

main if $PROGRAM_NAME == __FILE__
