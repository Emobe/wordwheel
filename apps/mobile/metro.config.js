// Metro config for the Bun workspace monorepo. `@word-wheel/core` should
// resolve through the normal `bun install` workspace symlink, but Windows
// requires Developer Mode for that symlink to be created (see repo root
// CLAUDE.md's "Workspace note (Windows)"), and Metro doesn't traverse
// symlinks outside the app directory by default. `watchFolders` +
// `extraNodeModules` make resolution work either way, symlink or not —
// this was flagged unverified on the Phase 0 spike list (Plan.md section 20).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "@word-wheel/core": path.resolve(workspaceRoot, "packages/core/src"),
};

// packages/core is TypeScript source with no build step consumed directly;
// Metro needs to know .ts/.tsx are resolvable from a bare extensionless import.
config.resolver.sourceExts = [...config.resolver.sourceExts, "ts", "tsx"];

// packages/core's own source uses explicit ".js" extensions on relative
// imports (Node/tsc ESM resolution style — see its tsconfig), which points
// at a file that doesn't exist on disk; the real file is ".ts". Metro has
// no built-in TS-extension-mapping for this, so resolve it ourselves for
// paths inside packages/core, and fall through to Metro's default resolver
// for everything else (npm packages, the app's own files, etc).
const coreSrc = path.resolve(workspaceRoot, "packages/core/src");
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith(".") && moduleName.endsWith(".js") && context.originModulePath.startsWith(coreSrc)) {
    const tsModuleName = `${moduleName.slice(0, -3)}.ts`;
    return context.resolveRequest(context, tsModuleName, platform);
  }
  if (defaultResolveRequest) return defaultResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
