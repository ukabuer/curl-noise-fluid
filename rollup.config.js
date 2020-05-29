import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import glsl from "rollup-plugin-glsl";

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
    }),
    nodeResolve(),
    commonjs(),
    serve("public"),
    livereload({ watch: "public" }),
  ],
};
