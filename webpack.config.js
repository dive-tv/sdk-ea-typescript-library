const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    ea: './src/ea.ts',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist'),
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  // Add the loader for .ts files
  module: {
    loaders: [
      {
        test: /\.(ts|tsx)?$/,
        exclude: ['/\.(spec|e2e|d)\.tsx?$/', 'node_modules'],
        use: {
          loader: 'awesome-typescript-loader?configFileName=tsconfig.json',
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  target: 'web', // Make web variables accessible to webpack, e.g. window
  devtool: 'source-map',
  node: {
    // workaround for webpack-dev-server issue
    // https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
    fs: 'empty',
    net: 'empty'
  },
};
