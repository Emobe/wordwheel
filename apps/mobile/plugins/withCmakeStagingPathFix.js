const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Native modules under node_modules/.bun/<pkg>@<version>+<hash>/node_modules/<pkg>/...
 * nest their own package name twice, pushing CMake's generated object-file
 * paths past Windows' ~250 character CMAKE_OBJECT_PATH_MAX (hit with
 * @shopify/react-native-skia, react-native-worklets and react-native-reanimated
 * — real "ninja: error: manifest 'build.ninja' still dirty after 100 tries"
 * build failures on Windows, not a theoretical concern).
 *
 * This redirects every subproject's CMake build-staging directory to a short
 * path under the root project's own build dir instead, so builds don't
 * depend on how deep Bun's package cache happens to nest a given module.
 *
 * Expo's own docs flag raw Gradle-file string edits as "dangerous" (no
 * structured parser, just an insertion), which is why this is a named,
 * documented plugin rather than a silent one-off hand-edit — a future
 * `expo prebuild --clean` (or an EAS cloud build, which always prebuilds
 * fresh) would otherwise silently drop this fix and reintroduce the exact
 * path-length failures it exists to prevent.
 */
const MARKER = "// withCmakeStagingPathFix";

function withCmakeStagingPathFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withCmakeStagingPathFix expects a Groovy build.gradle");
    }
    if (config.modResults.contents.includes(MARKER)) {
      return config; // already applied — safe to run more than once
    }

    const insertion = `
${MARKER}
// See apps/mobile/plugins/withCmakeStagingPathFix.js for why this exists.
subprojects { subproject ->
  afterEvaluate {
    if (subproject.hasProperty("android")) {
      subproject.android.externalNativeBuild {
        cmake {
          buildStagingDirectory = new File(rootProject.buildDir, ".cxx/\${subproject.name}")
        }
      }
    }
  }
}
`;

    // Must run before the react-native/expo root-project plugins evaluate
    // subprojects, so insert right after the buildscript{} block rather
    // than appending to the end of the file.
    const anchor = /apply plugin: ?["']expo-root-project["']/;
    if (!anchor.test(config.modResults.contents)) {
      throw new Error(
        "withCmakeStagingPathFix: could not find the expo-root-project apply line to insert before",
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      anchor,
      `${insertion}\n$&`,
    );

    return config;
  });
}

module.exports = withCmakeStagingPathFix;
