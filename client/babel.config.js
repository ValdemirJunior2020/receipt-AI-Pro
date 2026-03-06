// File: client/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // keep any other plugins you already have ABOVE this line
      "react-native-reanimated/plugin",
    ],
  };
};