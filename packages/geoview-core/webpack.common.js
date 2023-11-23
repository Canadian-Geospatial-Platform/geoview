/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LodashWebpackPlugin = require('lodash-webpack-plugin');
const glob = require('glob');
const childProcess = require('child_process');
const package = require('./package.json');

// get date, version numbers and the hash of the current commit
const date = new Date().toISOString();
const [major, minor, patch] = package.version.split('.');
const hash = JSON.stringify(childProcess.execSync('git rev-parse HEAD').toString().trim());

// eslint-disable-next-line no-console
console.log(`Build CGP Viewer: ${major}.${minor}.${patch} - ${date}`);

// inject all sample files
const multipleHtmlPlugins1 = glob.sync('./public/templates/*.html').map((name) => {
  return new HtmlWebpackPlugin({
    template: `${name}`,
    filename: `${name.substring(name.lastIndexOf('/') + 1, name.length)}`,
    title: 'Canadian Geospatial Platform Viewer',
    inject: 'head',
    scriptLoading: 'blocking',
    chunks: ['cgpv-main'],
  });
});

// inject all layer files
const multipleHtmlPlugins2 = glob.sync('./public/templates/layers/*.html').map((name) => {
  return new HtmlWebpackPlugin({
    template: `${name}`,
    filename: `${name.substring(name.lastIndexOf('/') + 1, name.length)}`,
    title: 'Canadian Geospatial Platform Viewer',
    inject: 'head',
    scriptLoading: 'blocking',
    chunks: ['cgpv-main'],
  });
});

const config = {
  entry: {
    'cgpv-main': './src/app.tsx',
    'geoview-details-panel': {
      import: '../geoview-details-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-basemap-panel': {
      import: '../geoview-basemap-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-layers-panel': {
      import: '../geoview-layers-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-footer-panel': {
      import: '../geoview-footer-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-swiper': {
      import: '../geoview-swiper/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-time-slider': {
      import: '../geoview-time-slider/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-geochart': {
      import: '../geoview-geochart/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  },
  resolve: {
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      crypto: false,
      path: false,
      stream: false,
      events: false,
      buffer: false,
      fs: false,
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@public': path.resolve(__dirname, 'public'),
    },
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['lodash', '@babel/transform-runtime'],
              presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
            },
          },
        ],
      },
      {
        test: /github.com\+Canadian-Geospatial-Platform\+geochart(.*)\.(ts|tsx|js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['lodash', '@babel/transform-runtime'],
              presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new LodashWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'Canadian Geospatial Platform Viewer',
      inject: 'head',
      scriptLoading: 'blocking',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: '../../docs', to: 'docs' },
        { from: './public/img', to: 'img' },
        { from: './public/configs', to: 'configs' },
        { from: './public/locales', to: 'locales', noErrorOnMissing: true },
        { from: './public/css', to: 'css' },
        { from: './public/markers', to: 'markers' },
        { from: './public/geojson', to: 'geojson' },
        { from: './public/plugins', to: 'plugins', noErrorOnMissing: true },
        { from: './public/favicon.ico' },
        { from: './public/templates/codedoc.js' },
        { from: './public/templates/layers/layerlib.js' },
      ],
    }),
    new webpack.BannerPlugin({
      banner: `Package:[name]: ${major}.${minor}.${patch} - ${hash} - ${date}`,
      raw: false,
      entryOnly: true,
      include: /\.js$/,
    }),
    new webpack.DefinePlugin({
      __VERSION__: {
        major,
        minor,
        patch,
        timestamp: Date.now(),
      },
    }),
  ]
    .concat(multipleHtmlPlugins1)
    .concat(multipleHtmlPlugins2),
};

module.exports = config;
