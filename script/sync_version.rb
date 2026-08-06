# frozen_string_literal: true

require 'pathname'

root = Pathname(__dir__).join('../web')
db_paths = Pathname.glob(root.join('db/*/'))

EA_VERSION = root.join('versions/EA').read.strip
NIGHTLY_VERSION = root.join('versions/nightly').read.strip

# Both are spliced into TypeScript below, so a quote in one of them writes code
# rather than a version.
[EA_VERSION, NIGHTLY_VERSION].each do |version|
  raise "not a version: #{version.inspect}" unless version.match?(/\A[A-Za-z0-9]+(?:[. ][A-Za-z0-9]+)*\z/)
end

unnecessary_versions = db_paths.select { |p|
  ver_str = p.basename.to_s
  ver_str != EA_VERSION && ver_str != NIGHTLY_VERSION
}

unnecessary_versions.each do |path|
  puts "Removing #{path}"
  path.rmtree
end

bundled_data_ts = root.join('src/lib/bundledData.ts')
bundled_data_ts.write bundled_data_ts.read.gsub(%r!^(import ea\w+ from '\.\./\.\./db/)[^/]+!) { "#{$1}#{EA_VERSION}" }
bundled_data_ts.write bundled_data_ts.read.gsub(%r!^(import nightly\w+ from '\.\./\.\./db/)[^/]+!) { "#{$1}#{NIGHTLY_VERSION}" }

next_config = root.join('next.config.ts')
next_config.write next_config.read.sub(/(ELIN_EA_VERSION: ')[^']+/) { |m| "#{$1}#{EA_VERSION}" }
next_config.write next_config.read.sub(/(ELIN_NIGHTLY_VERSION: ')[^']+/) { |m| "#{$1}#{NIGHTLY_VERSION}" }
