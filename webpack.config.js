const WorkerPlugin = require("worker-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const path = require("path");

const appConfig = {
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
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  }
};

const workerConfig = {
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
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-[contenthash].js"
  }
};

module.exports = [appConfig, workerConfig];
