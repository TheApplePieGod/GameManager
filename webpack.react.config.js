const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = (env) => {
    const dev = env.dev;

    var config = {
      entry: "./src/frontend/app.tsx",
      target: "electron-renderer",
      devtool: dev ? "source-map" : undefined,
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.ts(x?)$/,
            exclude: /node_modules/,
            loader: "ts-loader",
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      devServer: {
        compress: true,
        hot: true,
        port: 4000,
        static: {
            directory: path.join(__dirname, "src"),
        }
      },
      output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "bundle.js",
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: "./html/index.html",
        }),
      ],
    };

    return config;
}
