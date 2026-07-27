# Elin Chara Viewer

This is an application for viewing character data in the Elin.

## Development

* `npm run dev` for development server
* `npm run build` for production build
* `npm run check:archive -- <archive-dir>` parses every archived version with the app's schemas (defaults to `tmp/archive`)

## Past versions

Only the two current versions live in `db/` and are bundled into the build. Every
past version lives in [elin-chara-viewer-data](https://github.com/pocke/elin-chara-viewer-data)
and is fetched at request time, so their pages are generated on demand instead of
at build time.

* `NEXT_PUBLIC_ARCHIVE_BASE_URL` points at the archive. Production must set it:
  the default is the repository on `raw.githubusercontent.com`, which is meant
  for development and is not a CDN to serve readers from. The data repository
  syncs itself to Cloudflare R2 and that is what production points at; the
  bucket needs the CORS policy kept in that repository, because the browser
  reads the CSVs directly.
* Nothing reads the archive at build time, so a build never depends on the
  archive host.
* `.github/workflows/archive.yml` adds the versions named in `versions/` to the
  data repository on every push to `master`. It needs an `ARCHIVE_REPO_TOKEN`
  secret with write access there.
* To add a version by hand — a build downloaded from Steam, or one the release
  flow missed:

  ```console
  $ ruby script/archive_release.rb ../elin-chara-viewer-data 'EA 23.306' \
      --channel stable --release-date 2026-05-10 --db /path/to/exported/csv
  $ ruby script/extract_feat.rb --archive ../elin-chara-viewer-data --version 'EA 23.306'
  ```

  `--db` points at the directory holding `<version>/*.csv`, and `--channel` is
  required for a version that no `versions/` file names.

* `script/restore_archive_from_history.rb` imported the versions that only
  existed in this repository's git history. It was a one-shot; the release flow
  above is what keeps the archive current.

* The versions older than that were restored from Steam itself, by
  downloading each build of depot 2135153 and running it so the exporter
  writes its CSVs. That sweep was a one-shot; its scripts and the manifest
  list it worked from are attached to #303.

* `script/export-build.sh` is the part of it that stays: it launches a build
  that was downloaded rather than installed, waits for the export to finish,
  and stops the game. `update.sh` uses it for the build each branch currently
  points at.

* A release that was missed entirely needs the manifest of the build that is
  no longer current, which only SteamDB lists. Copy its id from
  https://steamdb.info/depot/2135153/manifests/ and hand it to
  DepotDownloader; `-branch nightly` is required, because a past manifest is
  refused on the public branch:

  ```console
  $ DepotDownloader.exe -app 2135150 -depot 2135153 -manifest <id> \
      -branch nightly -username <user> -remember-password -dir C:\elin-build
  $ script/export-build.sh 'C:\elin-build' 'C:\elin-export'
  ```

  The build names itself, so the export lands in `C:\elin-export/<version>/`.
  From there it is the by-hand archive flow above.

* `npm run check:export -- <export-dir> --baseline <dir>` checks an export for
  the ways the exporter fails quietly — the column order is reconstructed from
  the IL of `CreateRow()`, and a build it cannot follow writes a
  plausible-looking CSV with the wrong columns. `--archive <dir>` sweeps every
  archived version instead.

## License

MIT License for the source code.

Note that the files under db/ are not covered by this license. They are imported from the Elin game.
Also, the files under src/generated/ are generated files from the Elin source code and are not covered by this license.
