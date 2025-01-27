/* eslint-disable @typescript-eslint/no-var-requires */
// All lines below (3-8) needs the eslint escape no-var-requires.
// It is a file for the buid and constant, they are reuse later in the file. It is the reason why we keep it global...
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { WebpackBundleSizeAnalyzerPlugin } = require('webpack-bundle-size-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const zlib = require('zlib');

const common = require('./webpack.common');

const config = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: '../analysis/bundle-analyzer.html',
      analyzeAfterCompile: true,
    }),
    new WebpackBundleSizeAnalyzerPlugin('../analysis/bundle-size-analyzer.log'),
    // compress file for our production build
    // js file build for gh-page use the pre built gZip compression from GitHub
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false,
    }),
  ],
};

module.exports = merge(common, config);
