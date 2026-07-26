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
  $ ruby script/archive_release.rb ../elin-chara-viewer-data 'EA 23.306' --source depot
  $ ruby script/extract_feat.rb --archive ../elin-chara-viewer-data --version 'EA 23.306'
  ```

* `script/restore_archive_from_history.rb` imported the versions that only
  existed in this repository's git history. It was a one-shot; the release flow
  above is what keeps the archive current.

## License

MIT License for the source code.

Note that the files under db/ are not covered by this license. They are imported from the Elin game.
Also, the files under src/generated/ are generated files from the Elin source code and are not covered by this license.
