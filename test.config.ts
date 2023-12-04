import { defineConfig, UserConfig } from 'vite';
import { esbuildDecorators } from '@anatine/esbuild-decorators';
import typescript from "@rollup/plugin-typescript";
import swc from "rollup-plugin-swc";

export const config: UserConfig = {
  root: './src/web/x-framework',
  publicDir: '../../../data/dataset/img/',
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        esbuildDecorators({
          tsconfig: './tsconfig.json',
        }),
      ],
    },
  },
};

// export default defineConfig(config);

export default defineConfig({
  root: './src/web/x-framework',
  publicDir: '../../../data/dataset/img/',
  plugins: [
      swc({
          jsc: {
              parser: {
                  syntax: "typescript",
                  // tsx: true, // If you use react
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