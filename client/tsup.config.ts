import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'bin/browserpack.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  splitting: false,
});
