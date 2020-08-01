import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import glsl from "rollup-plugin-glsl";
import { terser } from "rollup-plugin-terser";

const isProduction = process.env.NODE_ENV === "production";

export default {
  input: "src/index.ts",
  output: {
    file: "public/build/bundle.js",
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    typescript(),
    glsl({
      include: "./**/*.glsl",
      compress: isProduction,
    }),
    nodeResolve(),
    commonjs({ extensions: [".js", ".ts"] }),
  ].concat(
    isProduction
      ? [terser()]
      : [serve("public"), livereload({ watch: "public" })]
  ),
};
