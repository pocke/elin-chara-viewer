# frozen_string_literal: true

require 'csv'
require 'digest'
require 'fileutils'
require 'json'

# Reads and writes the archive repository (pocke/elin-chara-viewer-data).
#
#   index.json                 generated from the files below
#   v/<slug>/meta.json         version, channel, releaseDate
#   v/<slug>/csv/<table>.csv
#   v/<slug>/featModifier.json written by extract_feat.rb
#   v/<slug>/ids.json          identifiers the detail pages accept
#
# Everything outside index.json is the source of truth: index.json exists
# because neither R2 nor raw.githubusercontent.com can list a directory, so the
# viewer needs a file that enumerates the versions.
module ArchiveRepo
  module_function

  # "EA 23.306 Patch 1" -> "EA-23.306-patch-1". The edition is kept as it is so
  # that the slug stays meaningful once the game leaves early access.
  def slugify(version)
    edition, rest = version.split(' ', 2)
    raise "no version number in #{version.inspect}" unless rest

    "#{edition}-#{rest.downcase.gsub(/[^a-z0-9.]+/, '-').gsub(/\A-|-\z/, '')}"
  end

  def version_key(version)
    m = version.match(/(\d+)\.(\d+)/) or raise "no version number in #{version.inspect}"
    [m[1].to_i, m[2].to_i, version[/Patch (\d+)/, 1].to_i]
  end

  def version_dir(root, slug)
    File.join(root, 'v', slug)
  end

  def slugs(root)
    Dir.glob(File.join(root, 'v', '*', 'meta.json')).map { |path| File.basename(File.dirname(path)) }
  end

  def read_meta(root, slug)
    JSON.parse(File.read(File.join(version_dir(root, slug), 'meta.json')))
  end

  # csv_files: { table name => content }
  def write_version(root, meta, csv_files)
    dir = version_dir(root, slugify(meta.fetch('version')))
    FileUtils.rm_rf(File.join(dir, 'csv'))
    FileUtils.mkdir_p(File.join(dir, 'csv'))

    csv_files.each do |table, content|
      File.binwrite(File.join(dir, 'csv', "#{table}.csv"), content)
    end

    File.write(File.join(dir, 'meta.json'), "#{JSON.pretty_generate(meta)}\n")
    write_ids(dir)
    dir
  end

  # The detail pages check a requested identifier against this before they
  # render, so that a URL that never existed answers 404 rather than filling the
  # route cache with an empty page.
  def write_ids(dir)
    %w[charas elements].each do |table|
      path = File.join(dir, 'csv', "#{table}.csv")
      raise "#{path} is missing; #{table}.csv is required" unless File.exist?(path)
    end

    ids = {
      # csvLoader strips the space out of "fish_ piranha" before it reaches a URL.
      'charas' => csv_column(File.join(dir, 'csv', 'charas.csv'), 'id').map { |id| id.sub(' ', '') },
      'elements' => csv_column(File.join(dir, 'csv', 'elements.csv'), 'alias')
    }
    File.write(File.join(dir, 'ids.json'), "#{JSON.generate(ids)}\n")
  end

  def csv_column(path, column)
    CSV.read(path, headers: true, encoding: 'bom|utf-8').filter_map { |row| row[column] }.uniq
  end

  def build_index(root)
    entries = slugs(root).map { |slug| index_entry(root, slug) }
    entries.sort_by! { |entry| [version_key(entry['version']), entry['releaseDate'], entry['slug']] }
    File.write(File.join(root, 'index.json'), "#{JSON.pretty_generate(entries)}\n")
    entries
  end

  def index_entry(root, slug)
    dir = version_dir(root, slug)
    meta = read_meta(root, slug)
    tables = Dir.glob(File.join(dir, 'csv', '*.csv')).map { |path| File.basename(path, '.csv') }.sort

    meta.merge(
      'slug' => slug,
      'tables' => tables,
      'contentHash' => content_hash(dir, tables),
      'featModifier' => File.exist?(File.join(dir, 'featModifier.json'))
    )
  end

  # Identical hashes mean identical data, which the version list uses to mark a
  # release that changed nothing.
  def content_hash(dir, tables)
    digest = tables.map { |table|
      "#{table}:#{Digest::SHA256.file(File.join(dir, 'csv', "#{table}.csv")).hexdigest}"
    }
    Digest::SHA256.hexdigest(digest.join("\n"))
  end
end
