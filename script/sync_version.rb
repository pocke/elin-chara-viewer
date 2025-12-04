# frozen_string_literal: true

require 'pathname'

root = Pathname(__dir__).join('..')
db_paths = Pathname.glob(Pathname(__dir__).join('../db/*/'))

EA_VERSION = root.join('versions/EA').read
NIGHTLY_VERSION = root.join('versions/nightly').read

unnecessary_versions = db_paths.select { |p|
  ver_str = p.basename.to_s
  ver_str != EA_VERSION && ver_str != NIGHTLY_VERSION
}

unnecessary_versions.each do |path|
  puts "Removing #{path}"
  path.rmtree
end

db_ts = Pathname(__dir__).join('../src/lib/db.ts')
db_ts.write db_ts.read.gsub(%r!^(import ea\w+ from '\.\./\.\./db/)[^/]+!) { "#{$1}#{EA_VERSION}" }
db_ts.write db_ts.read.gsub(%r!^(import nightly\w+ from '\.\./\.\./db/)[^/]+!) { "#{$1}#{NIGHTLY_VERSION}" }

next_config = Pathname(__dir__).join('../next.config.ts')
next_config.write next_config.read.sub(/(ELIN_EA_VERSION: ')[^']+/) { |m| "#{$1}#{EA_VERSION}" }
next_config.write next_config.read.sub(/(ELIN_NIGHTLY_VERSION: ')[^']+/) { |m| "#{$1}#{NIGHTLY_VERSION}" }
