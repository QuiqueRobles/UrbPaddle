const path = require('path');

module.exports = {
  mode: 'development', // Cambia a 'production' para producciones reales
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
