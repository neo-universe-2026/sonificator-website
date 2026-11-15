# Sonificator Studio

Browser demonstration for the [sonificator](https://github.com/neo-universe-2026/sonificator) Rust audio engine. It decodes a selected video in the browser, samples each frame into an offscreen 2D canvas, passes the RGBA pixels to the `sonificator-wasm` WebAssembly module, and streams generated stereo PCM through the Web Audio API.

## Architecture

- `index.html` / `src/style.css` — Control-room interface, playback transport, signal selector, and live visual analysis telemetry.
- `src/main.js` — Frame capture loop, `AudioContext` / `ScriptProcessorNode` audio rendering pipeline, Motion entrance/scroll animations, and transport controls.
- `wasm/` — `wasm-bindgen` wrapper (`WasmSonificator`) around `neo-universe-2026/sonificator`.
- `scripts/build-wasm.mjs` — Compiles `wasm/Cargo.toml` for `wasm32-unknown-unknown` and generates JS/WASM bindings in `wasm/pkg/`.
- `public/assets/` — H.264 MP4 visual sources (`orbit.mp4`, `zoom.mp4`).

## Prerequisites

- Node.js 22+ (`pnpm` or `npm`)
- Rust toolchain with the `wasm32-unknown-unknown` target:
  ```sh
  rustup target add wasm32-unknown-unknown
  ```
- `wasm-bindgen-cli` matching the `wasm-bindgen` crate version in `wasm/Cargo.lock` (currently `0.2.130`):
  ```sh
  cargo install wasm-bindgen-cli --version 0.2.130
  ```

## Run with Nix

Enter the reproducible development shell (provides Node.js 22, `pnpm`, Rust, and `wasm-bindgen-cli`):

```sh
nix develop
pnpm install
pnpm dev
```

## Run without Nix

With `pnpm`:

```sh
pnpm install
pnpm dev
```

Or with `npm`:

```sh
npm install
npm run dev
```

For a production build and preview:

```sh
pnpm build
pnpm preview
```
