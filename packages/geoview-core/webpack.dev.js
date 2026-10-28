// It is a file for the build and constant, they are reused later in the file. It is the reason why we keep it global...
const path = require('path');
const { merge } = require('webpack-merge');

// Mark this as a development build so the version shows a '-dev.<shortHash>' suffix
process.env.GEOVIEW_BUILD_IS_DEV = 'true';
const common = require('./webpack.common');

const config = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    compress: true,
    open: true,
    hot: false,
    liveReload: false,
    client: {
      overlay: {
        // The browser reports this benign ResizeObserver notice as an error; don't cover the map with the overlay for it
        runtimeErrors: (error) => !error?.message?.includes('ResizeObserver loop'),
      },
    },
  },
};

module.exports = merge(common, config);
