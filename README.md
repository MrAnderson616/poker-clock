# Tournament Clock

A poker tournament blind clock, packaged as a desktop app for macOS and Windows.

The app is a single self-contained HTML page wrapped in Electron. It makes no
network requests and stores nothing — fonts are bundled, so it works fully
offline.

## For testers

Grab the latest build from the [Releases page](../../releases/latest):

| You have | Download |
|---|---|
| Mac with Apple Silicon (M1/M2/M3/M4) | `TournamentClock-<version>-mac-arm64.dmg` |
| Mac with Intel | `TournamentClock-<version>-mac-x64.dmg` |
| Windows (install) | `TournamentClock-<version>-win-x64.exe` |
| Windows (no install) | `TournamentClock-<version>-portable.exe` |

Not sure which Mac you have? Apple menu → About This Mac. "Apple M…" means arm64.

### These builds are unsigned

Buying an Apple Developer certificate ($99/yr) and a Windows code-signing
certificate (a few hundred a year) isn't worth it for test builds, so both
operating systems will warn you once. This is expected.

**macOS** — double-clicking shows a warning that the app "cannot be opened
because Apple cannot check it for malicious software." What to do next depends
on your macOS version, because Apple removed the old Control-click shortcut in
macOS 15.

*macOS 15 Sequoia, macOS 26 Tahoe, and later:*

1. Double-click the app once and dismiss the warning.
2. Open **System Settings → Privacy & Security**.
3. Scroll to the bottom. There is a message naming *Tournament Clock* — click
   **Open Anyway** next to it.
4. Launch the app again and confirm.

*macOS 14 Sonoma and earlier:* right-click (or Control-click) the app in
Applications → **Open** → **Open**.

Either way you only do this once. If you would rather skip the clicking, this
one command clears the flag that triggers the whole thing:

```sh
xattr -dr com.apple.quarantine "/Applications/Tournament Clock.app"
```

**Windows** — SmartScreen will show a blue "Windows protected your PC" screen.
Click **More info**, then **Run anyway**.

## Development

```sh
npm install     # first time only
npm start       # run the app locally
```

The clock itself lives in `renderer/index.html` — plain HTML, CSS and JS with no
build step. Edit it and restart `npm start` to see changes.

`main.js` is the Electron shell: window setup, the menu, and a
`powerSaveBlocker` that stops the display sleeping mid-tournament.

### Fonts

`renderer/fonts/` holds Barlow Condensed and IBM Plex Mono as woff2, with
`renderer/fonts.css` declaring the `@font-face` rules. They were originally
loaded from the Google Fonts CDN; they're bundled so the app renders correctly
with no internet connection. Both are SIL Open Font License 1.1 — the license
texts sit alongside the font files.

## Building installers

Each platform's installers must be built on that platform, so releases are built
in CI (see below). To build locally for your own machine:

```sh
npm run dist:mac    # on macOS -> dist/*.dmg
npm run dist:win    # on Windows -> dist/*.exe
```

### macOS build notes

`build/after-pack.js` re-signs the app bundle ad-hoc. This is not optional:
electron-builder otherwise leaves Electron's original linker signature in place,
which no longer matches the modified bundle, and macOS refuses to launch it
("code has no resources but signature indicates they must be present").

**Do not move this project into `~/Desktop` or `~/Documents` if iCloud Drive
syncs those folders.** The sync daemon continuously re-stamps
`com.apple.FinderInfo` onto files, and `codesign` rejects any bundle carrying it.
The build cannot win that race. Keep the project on a non-synced path.

## Releasing

Releases are cut by pushing a tag. CI builds macOS and Windows natively in
parallel and attaches all four installers to a GitHub Release.

```sh
npm version 1.0.1      # bumps package.json and creates the tag
git push --follow-tags
```

Then send testers the link to the new release.
