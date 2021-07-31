
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

var config = {
    entry: './src/frontend/app.tsx',
    target: 'electron-renderer',
    devtool: 'source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    }, 
    module: {
      rules: [
      {
        test: /\.ts(x?)$/,
        include: /src\\frontend/,
        loader: "awesome-typescript-loader"
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
    },
    devServer: {
      contentBase: path.join(__dirname, './dist'),
      historyApiFallback: true,
      compress: true,
      hot: true,
      port: 4000,
      publicPath: '/',
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './html/index.html'
      })
    ],
  };

//config.target = webpackTargetElectronRenderer(config);

module.exports = config;