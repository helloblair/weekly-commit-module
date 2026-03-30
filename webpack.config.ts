import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { ModuleFederationPlugin } = webpack.container;

interface Configuration extends webpack.Configuration {
  devServer?: DevServerConfiguration;
}

const config: Configuration = {
  entry: "./src/index",
  mode: "development",
  output: {
    publicPath: "auto",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "weeklyCommitModule",
      filename: "remoteEntry.js",
      exposes: {
        "./WeeklyCommitModule": "./src/bootstrap",
        "./ManagerDashboard": "./src/pages/ManagerDashboard",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: "^18.2.0",
          eager: false,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.2.0",
          eager: false,
        },
      },
    }),
    new webpack.DefinePlugin({
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
        process.env.REACT_APP_API_BASE_URL || ""
      ),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
    }),
  ],
  devServer: {
    port: 3001,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    ],
  },
};

export default config;
