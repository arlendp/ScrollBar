import babel from 'rollup-plugin-babel';

export default {
  input: 'src/init.js',
  output: {
    file: 'main.js',
    format: 'umd',
    name: 'ScrollBar'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}