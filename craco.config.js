const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/')
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer']
        })
      );

      return config;
    }
  }
};
