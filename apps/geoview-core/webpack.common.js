/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LodashWebpackPlugin = require('lodash-webpack-plugin');
const childProcess = require('child_process');
const glob = require('glob');
const package = require('./package.json');

// get version numbers and the hash of the current commit
const [major, minor, patch] = package.version.split('.');
const hash = JSON.stringify(childProcess.execSync('git rev-parse HEAD').toString().trim());
// eslint-disable-next-line no-console
console.log(`Build CGP Viewer: ${major}.${minor}.${patch}`);

// inject all sample files
const multipleHtmlPlugins = glob.sync('./public/templates/*.html').map((name) => {
    return new HtmlWebpackPlugin({
        template: `${name}`,
        filename: `${name.substring(name.lastIndexOf('/') + 1, name.length)}`,
        title: 'Canadian Geospatial Platform Viewer',
        inject: 'head',
        scriptLoading: 'blocking',
        chunks: ['app'],
    });
});

const config = {
    entry: {
        app: path.resolve(__dirname, 'src/app.tsx'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'gcpv-main.js',
    },
    resolve: {
        extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /.(ts|tsx|js|jsx)$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
            },
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
                test: /.(ts|tsx|js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: ['lodash'],
                            presets: ['@babel/preset-env'],
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
                { from: './public/img', to: 'img' },
                { from: './public/locales', to: 'locales' },
                { from: './public/css', to: 'css' },
                { from: './public/markers', to: 'markers' },
                { from: './public/geojson', to: 'geojson' },
                { from: './public/plugins', to: 'plugins' },
                { from: './public/favicon.ico' },
                { from: './public/templates/codedoc.js' },
            ],
        }),
        new webpack.DefinePlugin({
            __VERSION__: {
                major,
                minor,
                patch,
                timestamp: Date.now(),
                hash,
            },
        }),
    ].concat(multipleHtmlPlugins),
};

module.exports = config;
