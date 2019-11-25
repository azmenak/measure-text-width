const WorkerPlugin = require("worker-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const path = require("path");

const appConfig = {
  devtool: "cheap-module-eval-source-map",
  entry: "./src/typed.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-[contenthash].js"
  },
  mode: "production",
  plugins: [new HtmlWebpackPlugin(), new WorkerPlugin()],
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }
    ]
  }
};

const workerConfig = {
  devtool: "cheap-module-eval-source-map",
  entry: "./src/wasm-worker.ts",
  target: "webworker",
  plugins: [
    new WasmPackPlugin({
      crateDirectory: __dirname
    })
  ],
  mode: "production",
  resolve: {
    extensions: [".ts", ".js", ".wasm"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader", options: { transpileOnly: true } }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-[contenthash].js"
  }
};

module.exports = [appConfig, workerConfig];
