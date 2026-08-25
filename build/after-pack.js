'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// electron-builder leaves the packaged .app carrying Electron's original
// linker-only signature, which no longer matches the modified bundle:
//   "code has no resources but signature indicates they must be present"
// macOS then refuses to launch it -- on Apple Silicon it reports the app as
// damaged, and right-click -> Open does not help, because the signature is
// malformed rather than merely untrusted.
//
// We have no Developer ID, so re-sign the whole bundle ad-hoc. Testers still
// see the "unidentified developer" prompt (expected, documented in README),
// but the app is now structurally valid and will launch.
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );

  // Extended attributes on the bundle make codesign bail with "resource fork,
  // Finder information, or similar detritus not allowed". Note that `xattr -cr`
  // silently fails to remove com.apple.FinderInfo -- it has to be deleted by
  // name. Signing nested bundles re-adds it, so this runs before every sign.
  //
  // If this ever starts failing again, check whether the project has been moved
  // somewhere iCloud syncs (Desktop/Documents with iCloud Drive on). The sync
  // daemon re-stamps these attributes mid-build and nothing here can win
  // that race -- keep the project on a non-synced path.
  const stripXattrs = () => {
    execFileSync('xattr', ['-cr', appPath]);
    execFileSync('find', [appPath, '-xattrname', 'com.apple.FinderInfo',
      '-exec', 'xattr', '-d', 'com.apple.FinderInfo', '{}', ';']);
  };

  stripXattrs();

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    stdio: 'inherit'
  });

  stripXattrs();

  // Fail the build loudly rather than shipping a bundle that cannot launch.
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], {
    stdio: 'inherit'
  });

  console.log(`  • ad-hoc signed ${path.basename(appPath)}`);
};
