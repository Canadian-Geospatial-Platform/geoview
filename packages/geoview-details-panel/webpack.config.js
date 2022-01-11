const path = require("path");

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "details-panel.js",
    },
    resolve: {
        extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    },
    module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            loader: "ts-loader",
          },
          {
            enforce: "pre",
            test: /\.js$/,
            loader: "source-map-loader",
          },
          {
            test: /\.css$/,
            loader: "css-loader",
          },
        ],
      },
      plugins: [
      ],
}


