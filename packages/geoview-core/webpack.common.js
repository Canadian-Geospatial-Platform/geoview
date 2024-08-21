/* eslint-disable @typescript-eslint/no-var-requires */
// all lines below (3-10) needs the eslint escape no-var-requires.
// It is a file for the buid and constant, they are reuse later in the file. It is the reason why we keep it global...
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
const multipleHtmlPluginsSamples = glob.sync('./public/templates/*.html').map((name) => {
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
const multipleHtmlPluginsLayers = glob.sync('./public/templates/layers/*.html').map((name) => {
  return new HtmlWebpackPlugin({
    template: `${name}`,
    filename: `${name.substring(name.lastIndexOf('/') + 1, name.length)}`,
    title: 'Canadian Geospatial Platform Viewer',
    inject: 'head',
    scriptLoading: 'blocking',
    chunks: ['cgpv-main'],
  });
});

// inject all demos files
const multipleHtmlPluginsDemos = glob.sync('./public/templates/demos/*.html').map((name) => {
  return new HtmlWebpackPlugin({
    template: `${name}`,
    filename: `${name.substring(name.lastIndexOf('/') + 1, name.length)}`,
    title: 'Canadian Geospatial Platform Viewer',
    inject: 'head',
    scriptLoading: 'blocking',
    chunks: ['cgpv-main'],
  });
});

// inject all outlier files
const multipleHtmlPluginsOutliers = glob.sync('./public/templates/outliers/*.html').map((name) => {
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
    'geoview-aoi-panel': {
      import: '../geoview-aoi-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-basemap-panel': {
      import: '../geoview-basemap-panel/src/index.tsx',
      dependOn: 'cgpv-main',
      filename: 'corePackages/[name].js',
    },
    'geoview-geochart': {
      import: '../geoview-geochart/src/index.tsx',
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
    'geoview-demo': {
      import: '../geoview-demo/src/index.tsx',
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
      '@config': path.resolve(__dirname, 'src/api/config'),
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
      {
        test: /\.md$/,
        use: ['html-loader', 'markdown-loader'],
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
        { from: './public/datasets/geojson', to: 'datasets/geojson' },
        { from: './public/datasets/csv-files', to: 'datasets/csv-files' },
        { from: './public/datasets/geopackages', to: 'datasets/geopackages' },
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
    .concat(multipleHtmlPluginsSamples)
    .concat(multipleHtmlPluginsLayers)
    .concat(multipleHtmlPluginsDemos)
    .concat(multipleHtmlPluginsOutliers),
};

module.exports = config;
