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

def checkout(version)
  sh! 'git', '-C', 'tmp/Elin-Decompiled', 'checkout', 'origin/main'

  key = version == 'EA' ? 'Stable' : 'Nightly'
  until `git -C tmp/Elin-Decompiled log --oneline | head -1`.include?(key)
    sh! "git", "-C", "tmp/Elin-Decompiled", "checkout", "HEAD^"
  end
end

def sh!(*cmd)
  system(*cmd, exception: true)
end

def make_json(version)
  checkout(version)

  content = File.read('tmp/Elin-Decompiled/Elin/FEAT.cs')
  sc = StringScanner.new(content)

  sc.skip_until(/^\tpublic List<string> Apply\(/) or raise

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
