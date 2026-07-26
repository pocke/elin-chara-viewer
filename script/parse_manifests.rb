# frozen_string_literal: true

# Turns the manifest table pasted out of SteamDB into manifests.json.
#
# Usage: ruby script/parse_manifests.rb <pasted-table> [--out manifests.json]
#
# SteamDB cannot be scraped (Cloudflare answers 403), so the table at
# https://steamdb.info/depot/2135153/manifests/ has to be copied by hand out of
# a browser. Rows look like:
#
#   26 July 2026 – 06:13:28 UTC<TAB>5 hours ago<TAB>4399485436282850671 nightly
#
# Keys already in manifests.json are kept, so the version names written back
# once a build has named itself survive a re-import.

require 'date'
require 'json'
require 'optparse'

ROW = /\A(\d+) (\w+) (\d{4}) . (\d{2}):(\d{2}):(\d{2}) UTC\z/

def parse(path)
  File.readlines(path).filter_map do |line|
    fields = line.split("\t").map(&:strip)
    next unless fields.size >= 3 && fields[2] =~ /\A\d/

    id, branch = fields[2].split(/\s+/, 2)
    match = ROW.match(fields[0]) or abort "unparsed date: #{fields[0].inspect}"
    seen = DateTime.parse("#{match[1]} #{match[2]} #{match[3]} #{match[4]}:#{match[5]}:#{match[6]} UTC")
    {
      'manifestId' => id,
      'seenAt' => seen.strftime('%Y-%m-%dT%H:%M:%SZ'),
      'date' => seen.strftime('%Y-%m-%d'),
      'branch' => branch ? branch.strip : 'public'
    }
  end
end

def main
  out = File.expand_path('../manifests.json', __dir__)
  OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/parse_manifests.rb <pasted-table> [--out FILE]'
    opts.on('--out FILE') { |v| out = v }
  end.parse!
  input = ARGV.shift or abort 'Usage: ruby script/parse_manifests.rb <pasted-table> [--out FILE]'

  known = File.exist?(out) ? JSON.parse(File.read(out)).to_h { |e| [e['manifestId'], e] } : {}
  rows = parse(input).map { |row| (known[row['manifestId']] || {}).merge(row) }
  rows.sort_by! { |row| row['seenAt'] }

  File.write(out, "#{JSON.pretty_generate(rows)}\n")
  puts "#{rows.size} manifests (#{rows.first['date']} .. #{rows.last['date']}) into #{out}"
end

main if $PROGRAM_NAME == __FILE__
