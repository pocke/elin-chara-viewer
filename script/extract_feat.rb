require 'English'
require 'fileutils'
require 'optparse'
require 'strscan'
require 'json'
require_relative 'archive_repo'

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

# The exact build, then every older one nearest first, then every newer one.
# Newer ones are needed at all because the decompile of FEAT.cs carries only
# the constants until EA 23.46 Hotfix 2, leaving the versions before it with
# nothing older to read modifiers out of.
def nearby_commits(spec)
  target = version_value(spec)
  builds = candidates.uniq { |_hash, _subject, value| value }
  by_distance = ->(direction) {
    builds.select { |_hash, _subject, value| (value <=> target) == direction }
          .sort_by { |_hash, _subject, value| value }
  }
  builds.select { |_hash, _subject, value| value == target } +
    by_distance.call(-1).reverse + by_distance.call(1)
end

def sh!(*cmd)
  system(*cmd, exception: true)
end

def make_json(spec)
  nearby_commits(spec).each do |commit, build, _value|
    sc = StringScanner.new(feat_source(commit))
    # `virtual` was added to the signature partway through the game's history.
    next unless sc.skip_until(/^\tpublic (?:virtual )?List<string> Apply\(/)

    unless version_value(build) == version_value(spec)
      warn "extract_feat: no decompiled build for #{spec.inspect}; using #{build.inspect}"
    end
    return scan_apply(sc, build)
  end

  raise "no decompiled build carries feat modifiers for #{spec.inspect}"
end

def scan_apply(sc, build)
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

# The build the modifiers came from is written next to them, because many
# archived versions have no decompiled build of their own upstream and an
# approximation has to be distinguishable from an exact match.
def generate_archive(root, slugs, fail_fast:)
  slugs.each do |slug|
    version = ArchiveRepo.read_meta(root, slug).fetch('version')
    result, build = make_json(version)
    write_json(
      File.join(ArchiveRepo.version_dir(root, slug), 'featModifier.json'),
      { 'source' => build, 'modifiers' => result }
    )
  rescue StandardError => e
    raise if fail_fast

    warn "extract_feat: #{version || slug} failed: #{e.message}"
  end

  ArchiveRepo.build_index(root)
end

def main
  archive_dir = nil
  only = nil
  parser = OptionParser.new do |opts|
    opts.banner = 'Usage: ruby script/extract_feat.rb [--archive DIR [--version VERSION]]'
    opts.on('--archive DIR', 'write into the archive repository at DIR') { |v| archive_dir = v }
    opts.on('--version VERSION', 'only this version, instead of every archived one') { |v| only = v }
  end
  parser.parse!

  prepare

  if archive_dir
    slugs = only ? [ArchiveRepo.slugify(only)] : ArchiveRepo.slugs(archive_dir)
    generate_archive(archive_dir, slugs, fail_fast: !only.nil?)
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
