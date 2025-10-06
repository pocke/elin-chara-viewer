# frozen_string_literal: true

require 'pathname'

db_paths = Pathname.glob(Pathname(__dir__).join('../db/*/'))
versions = db_paths.map { |p|
  ver_str = p.basename.to_s
  [ver_str[/EA (\d+\.\d+)/, 1].to_f, ver_str[/Patch (\d+)/, 1].to_i, p, ver_str]
}.sort_by{ |v, p| [v, p] }.reverse

if 1 < versions.size
  versions[1..].each do |_, _, path|
    puts "Removing #{path}"
    # path.rmtree
  end
end

db_ts = Pathname(__dir__).join('../src/lib/db.ts')
_, _, _, ver_str = versions.first
db_ts.write db_ts.read.gsub(%r!^(import \w+ from '\.\./\.\./db/)[^/]+!) { "#{$1}#{ver_str}" }

next_config = Pathname(__dir__).join('../next.config.ts')
next_config.write next_config.read.sub(/(ELIN_EA_VERSION: ')[^']+/) { |m| "#{$1}#{ver_str}" }
