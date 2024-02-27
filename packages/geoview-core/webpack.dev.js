/* eslint-disable @typescript-eslint/no-var-requires */
// all lines below (3-5) needs the eslint escape no-var-requires. It is the reason why we keep it global...
const path = require('path');
const { merge } = require('webpack-merge');
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
  },
};

module.exports = merge(common, config);
