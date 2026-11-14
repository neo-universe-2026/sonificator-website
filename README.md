# Sonificator Studio

Browser demo for the `sonificator` Rust library. It decodes a selected video in
the browser, samples each frame, sends RGBA data through WebAssembly, and
streams generated stereo PCM through Web Audio. The interface uses Motion for
entrance and scroll-triggered animation.

## Run with Nix

Enter the reproducible development shell. It provides `pnpm`, Node.js,
Rust, and `wasm-bindgen`:

```sh
nix develop
pnpm install
pnpm dev
```

## Run without Nix

```sh
npm install
npm run dev
```

The WASM adapter is built from the parent library with `wasm-bindgen` before
Vite starts. The demo videos are copied from `../test-assets`.
