# Elin Chara Viewer

This is an application for viewing character data in the Elin.

## Development

Dependencies are installed and run inside Docker, never on the host, so that a
compromised package reaches no further than the container. Docker is all the
app needs; the host needs no Node. The release and archive flows below also
need `ruby`, `git`, `gh` and, on Windows, DepotDownloader, and the Claude Code
hook needs `jq`.

```console
$ mkdir -p node_modules   # the check service mounts the tree read-only and
                          # cannot create the volume's mount point itself
$ docker compose run --rm check npm ci --ignore-scripts
$ docker compose up                                      # localhost:3000
```

* `docker compose run --rm app npm run build` for production build
* `docker compose run --rm app npm run check:archive -- <archive-dir>` parses every archived version with the app's schemas (defaults to `tmp/archive`; an archive outside the repository has to be mounted in, as below)
* `docker compose run --rm app npm run check:history` holds the change history's `PROVENANCE` to the models

`docker compose run` does not publish ports, which is why the dev server is the
one command that uses `up`. `node_modules` lives in a named volume, so the host
never holds a copy; editors that load ESLint, Prettier or TypeScript from the
working tree will not find them.

A changed `Dockerfile` needs `docker compose build`, and a change to what it
creates for the named volumes needs `docker compose down -v` as well, because a
volume takes its ownership from the image only when it is first created.

Turbopack fails with `Permission denied` when `.next` holds a build from
outside the container, because it records absolute paths that do not exist
inside one. Deleting `.next` is the fix.

`compose.yaml` mounts read-only every file the host executes or reads as
configuration, so that a dependency cannot write itself a path back out of the
container; it lists them, and CI checks that the list still covers the `.rb`
and `.sh` files in the tree. Adding a file of that kind means adding it there
too. `.env` is committed because there has to be something to mount — Docker
creates a directory in place of a missing mount source — and it pins
`COMPOSE_FILE`, without which compose would also load a `compose.override.yaml`
that the container had written.

`.node-version` and the Node version in the `Dockerfile` are checked against
each other by CI, because Dependabot watches npm only: the base image is
updated by hand, and its security updates arrive with it.

What this does not protect:

* the bundle the dev server sends to the browser, where a compromised
  dependency runs on the host's machine anyway
* anything the container sends out over the network, or reaches on the host
  through `host.docker.internal`
* files the container can create that no mount covers yet — `.envrc`,
  `.mcp.json`, `.vscode/` and the like
* `next.config.ts` and `src/lib/bundledData.ts`, which `update.sh` rewrites and
  therefore has to allow through its own check, and which run in the Vercel
  build once merged
* the same `package-lock.json`, installed again by CI and by Vercel
* the host's own Node, which nothing removes

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
  data repository on every push to `master`, rebuilds the change history there,
  and pushes both as one commit. It needs an `ARCHIVE_REPO_TOKEN` secret with
  write access there.
* To add a version by hand — a build downloaded from Steam, or one the release
  flow missed:

  ```console
  $ ruby script/archive_release.rb ../elin-chara-viewer-data 'EA 23.306' \
      --channel stable --release-date 2026-05-10 --db /path/to/exported/csv
  $ ruby script/extract_feat.rb --archive ../elin-chara-viewer-data --version 'EA 23.306'
  $ docker compose run --rm -v "$PWD/../elin-chara-viewer-data:/data" app \
      npm run build:history -- /data
  ```

  Directories outside the repository have to be mounted in, and `tmp/` is
  mounted read-only, so the archive cannot be passed by path alone.

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

* `check:export` checks an export for the ways the exporter fails quietly —
  the column order is reconstructed from the IL of `CreateRow()`, and a build
  it cannot follow writes a plausible-looking CSV with the wrong columns.
  `--archive <dir>` sweeps every archived version instead.

  ```console
  $ docker compose run --rm -v '<export-dir>:/fresh:ro' check \
      npm run check:export -- /fresh --baseline 'db/<version>'
  ```

  Quote the baseline: every version name holds spaces, and a baseline that
  cannot be read is only a warning.

## Change history

The character detail pages show what changed about a character, version by
version. Computing that from every archived version on request is out of the
question, so `build:history` does it offline and writes
one file per character page to `history/charas/` in the data repository; the
page fetches its own when the accordion is opened. The whole history is rebuilt
from scratch on every release, so a version archived out of order or a corrected
release date needs nothing else done.

* `src/lib/history/viewModel.ts` holds `PROVENANCE`, which says what each raw
  column feeds. The history hides a raw column once the display group it feeds
  has already reported the change, so a column that quietly starts feeding a
  group would show the same change twice. `docker compose run --rm app npm run check:history` sets each
  column to another value the game uses and checks that nothing moves
  undeclared.
* A version that gains a column makes every character look changed, because the
  schemas fill the older versions in with a default. Those are dropped, and a
  column addition outside `KNOWN_NEW_COLUMNS` stops the build instead.
* The build refuses to write when it would lose pages or change the entry count
  by more than a quarter. `--allow-large-change` says the difference is meant.

## License

MIT License for the source code.

Note that the files under db/ are not covered by this license. They are imported from the Elin game.
Also, the files under src/generated/ are generated files from the Elin source code and are not covered by this license.
