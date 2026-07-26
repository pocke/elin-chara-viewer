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
  abort "#{MANIFESTS} is not an array" unless manifests.is_a?(Array)

  known = manifests.to_h { |m| [m['manifestId'], m] }
  unknown = versions.keys.reject { |id| known.key?(id) }
  abort "none of the #{versions.size} restored manifests are in #{MANIFESTS}" if unknown.size == versions.size
  warn "#{unknown.size} restored manifests are not listed in manifests.json" unless unknown.empty?

  versions.each { |id, version| known[id]&.[]=('version', version) }

  # 途中で死んでも manifests.json が切り詰められないように置き換える。
  tmp = "#{MANIFESTS}.new"
  File.write(tmp, "#{JSON.pretty_generate(manifests)}\n")
  File.rename(tmp, MANIFESTS)
  named = manifests.count { |m| m['version'] }
  puts "named #{named} of #{manifests.size} manifests (#{versions.values.uniq.size} distinct versions)"
end

main if $PROGRAM_NAME == __FILE__
