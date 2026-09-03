/* eslint-disable @typescript-eslint/no-var-requires */
// Fast development build: no minification, no bundle analysis, no compression, no source maps.
const { merge } = require('webpack-merge');

// Mark this as a development build so the version shows a '-dev.<shortHash>' suffix
process.env.GEOVIEW_BUILD_IS_DEV = 'true';
const common = require('./webpack.common');

const config = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
};

module.exports = merge(common, config);
