require 'strscan'
require 'json'

FEAT_CS_URL = 'https://raw.githubusercontent.com/Elin-Modding-Resources/Elin-Decompiled/refs/heads/main/Elin/FEAT.cs'

$result = {}

def main
  system("curl -o tmp/FEAT.cs #{FEAT_CS_URL}", exception: true)

  content = File.read('tmp/FEAT.cs')
  sc = StringScanner.new(content)

  sc.skip_until(/^\tpublic List<string> Apply\(/) or raise

  feat_ids = []
  modifiers = {}

  loop do
    if sc.scan(/^\s*case (?=\d+:)/)
      feat_ids << sc.scan(/\d+/) or raise
      sc.skip(/:\n/)
      next
    end

    if sc.scan(/^\s*break;\n/)
      flush feat_ids, modifiers
      feat_ids = []
      modifiers = {}
      next
    end

    # ModBase(423, a, hide: false);
    if sc.scan(/^\s*ModBase\((?=\d+,\s*-?a,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*/)
      modifiers[target_id] = sc.scan(/-/) ? -1 : 1
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
      modifiers[target_id] = power.to_i * sign
      sc.skip(/.+\n/)
      next
    end

    # ModBase(956, a / 40, hide: false);
    if sc.scan(/^\s*ModBase\((?=\d+,\s*a\s*\/\s*-?\d+,)/)
      target_id = sc.scan(/\d+/) or raise
      sc.skip(/,\s*a\s*\/\s*/)
      power = sc.scan(/-?\d+/) or raise
      modifiers[target_id] = 1 / power.to_f
      sc.skip(/.+\n/)
      next
    end

    if sc.scan(/^\t}/)
      flush feat_ids, modifiers
      break
    end

    sc.skip(/^.+\n/)
  end

  json = JSON.pretty_generate($result)
  File.write("src/generated/featModifier.json", json)
ensure
  system("rm -f tmp/FEAT.cs")
end

def flush(feat_ids, modifiers)
  return if modifiers.empty?

  feat_ids.each do |feat_id|
    $result[feat_id] = modifiers
  end
end

main
