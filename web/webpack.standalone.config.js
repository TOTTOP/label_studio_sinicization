const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const mode = process.env.NODE_ENV || "development";
const isDevelopment = mode !== "production";
const FRONTEND_HOSTNAME = "http://localhost:8010";
const DJANGO_HOSTNAME = "http://localhost:8080";

module.exports = {
  mode,
  devtool: isDevelopment ? "cheap-module-source-map" : "source-map",
  entry: {
    main: path.resolve(__dirname, "apps/labelstudio/src/main.tsx"),
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "auto",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      worker_threads: false,
    },
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  module: {
    rules: [{
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack", "url-loader"],
      },
      {
        test: /\.xml$/,
        loader: "url-loader",
      },
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          name: "[name].[ext]"
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(mode),
    }),
  ],
  optimization: {
    minimize: !isDevelopment,
    minimizer: [new TerserPlugin({
      parallel: true
    }), new CssMinimizerPlugin()],
  },
  devServer: {
    port: 8010,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    static: {
      directory: path.resolve(__dirname, "../label_studio/core/static/"),
      publicPath: "/static/",
    },
    proxy: {
      "/api": {
        target: `${DJANGO_HOSTNAME}/api`,
        changeOrigin: true,
        pathRewrite: {
          "^/api": ""
        },
      },
    },
  },
};
