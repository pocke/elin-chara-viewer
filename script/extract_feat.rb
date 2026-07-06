require 'strscan'
require 'json'

GITHUB_REPO_URL = "https://github.com/Elin-Modding-Resources/Elin-Decompiled"

def prepare
  if Dir.exist?("tmp/Elin-Decompiled")
    sh! "git", "-C", "tmp/Elin-Decompiled", "fetch", "--filter=blob:none"
  else
    sh! "git", "clone", "--filter=blob:none", GITHUB_REPO_URL, "tmp/Elin-Decompiled"
  end
end

VERSION_FILES = { 'EA' => 'versions/EA', 'Nightly' => 'versions/nightly' }.freeze

def checkout(version)
  target = version_value(File.read(VERSION_FILES.fetch(version)))
  sh! 'git', '-C', 'tmp/Elin-Decompiled', 'checkout', closest_commit(target)
end

def version_value(str)
  m = str.match(/(\d+)\.(\d+)/) or raise "no version in #{str.inspect}"
  major, minor = m.captures
  patch = str[/Patch (\d+)/, 1] || 0
  major.to_i * 1_000_000 + minor.to_i * 1_000 + patch.to_i
end

def closest_commit(target)
  log = `git -C tmp/Elin-Decompiled log --format=%H%x09%s origin/main`
  candidates = log.each_line.filter_map do |line|
    hash, subject = line.chomp.split("\t", 2)
    next unless subject&.match?(/\d+\.\d+/)
    [hash, version_value(subject)]
  end
  raise 'no candidate commit' if candidates.empty?

  candidates.min_by { |_hash, value| (value - target).abs }.first
end

def sh!(*cmd)
  system(*cmd, exception: true)
end

def make_json(version)
  checkout(version)

  content = File.read('tmp/Elin-Decompiled/Elin/FEAT.cs')
  sc = StringScanner.new(content)

  sc.skip_until(/^\tpublic virtual List<string> Apply\(/) or raise

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

    if sc.scan(/^\t}/)
      flush result, feat_ids, sub_feats
      break
    end

    sc.skip(/^.+\n/)
  end

  json = JSON.pretty_generate(result)
  File.write("src/generated/featModifier.#{version.downcase}.json", json)
end

def main
  prepare

  make_json('EA')
  make_json('Nightly')
end

def flush(result, feat_ids, sub_feats)
  return if sub_feats.empty?

  feat_ids.each do |feat_id|
    result[feat_id] = sub_feats
  end
end

main
