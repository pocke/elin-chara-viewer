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
* The version list is prerendered, so the archive has to be reachable during a
  build.
* `.github/workflows/archive.yml` rebuilds the archive from this repository's
  git history on every push to `master` and pushes it to the data repository. It
  needs an `ARCHIVE_REPO_TOKEN` secret with write access there.
* To rebuild the archive by hand:

  ```console
  $ ruby script/archive_versions.rb ../elin-chara-viewer-data
  $ ruby script/extract_feat.rb --archive ../elin-chara-viewer-data
  ```

## License

MIT License for the source code.

Note that the files under db/ are not covered by this license. They are imported from the Elin game.
Also, the files under src/generated/ are generated files from the Elin source code and are not covered by this license.
