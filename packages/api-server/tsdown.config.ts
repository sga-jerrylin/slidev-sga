import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  target: 'node18',
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  external: [
    'express',
    'fs-extra',
    'chokidar',
    'winston'
  ]
})
