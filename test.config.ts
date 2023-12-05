import { defineConfig } from 'vite';
import swc from "rollup-plugin-swc";

export default defineConfig({
  root: './src/web/x-web',
  publicDir: '../../../data/dataset/img/',
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