module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be last (CLAUDE.md mobile rule).
    plugins: ['react-native-worklets/plugin'],
  };
};
