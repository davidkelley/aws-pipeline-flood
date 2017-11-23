const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    create: './functions/steps/create',
    remove: './functions/steps/remove',
    results: './functions/steps/results',
    status: './functions/steps/status',
    pipeline: './functions/pipeline',
  },
  target: 'node',
  externals: {
    'aws-sdk': 'aws-sdk',
  },
  output: {
    libraryTarget: 'commonjs2',
    path: `${__dirname}/out`,
    filename: '[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      // Flood.IO API key secret is available at build time as the
      // environment variable FLOOD_API_KEY; bake it into our build here.
      'process.env.FLOOD_API_KEY': JSON.stringify(process.env.FLOOD_API_KEY),
    }),
    new UglifyJSPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: ['babel-loader'],
        exclude: /node_modules/,
      },
    ],
  },
};
