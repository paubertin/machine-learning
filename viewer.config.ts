import { defineConfig } from 'vite';
import swc from "rollup-plugin-swc3";

export default defineConfig({
  root: './src/web/',
  publicDir: '../../data/dataset/img/',
  build: {
    outDir: './dist',
  },
  plugins: [
      swc({
          jsc: {
              parser: {
                  syntax: "typescript",
                  dynamicImport: true,
                  decorators: true,
              },
              target: "es2022",
              transform: {
                  decoratorMetadata: true,
              },
          },
      }),
  ],
  esbuild: false,
});