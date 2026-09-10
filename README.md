# Curl-Noise for Procedural Fluid Flow

[Live Demo](https://ukabuer.github.io/curl-noise-fluid/)

A WebGL2 fluid-flow visualisation: particles are advected along the curl of a
procedural noise field, using transform feedback on the GPU.

## Reference

Robert Bridson, [Curl-Noise for Procedural Fluid Flow](http://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf)

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- A browser with WebGL2

## Scripts

```sh
npm install
npm run dev        # Vite dev server with HMR at http://localhost:5173
npm run build      # production bundle into dist/
npm run preview    # serve the built dist/ locally
npm run typecheck  # tsc --noEmit
```
