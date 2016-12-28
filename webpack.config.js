const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: './static',
    filename: 'app.js'
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        include: [path.resolve(__dirname, 'src')],
        test: /\.js$/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
