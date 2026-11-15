# Sonificator Studio

Sonificator Studio is a browser-based demonstration of the Rust Sonificator audio engine. It loads the engine as WebAssembly, analyses frames from a selected scientific visualisation in the browser, and generates stereo audio through the Web Audio API.

It demonstrates one end-to-end path from moving image to sound. The current engine is tuned to orange visual emissions in a CO₂ globe animation; it is not yet a universal sonification tool for every dataset.

## How it works

1. The browser loads the video source.
2. While a session is playing, JavaScript draws each video frame to a small canvas.
3. The canvas pixels are passed to the Rust engine through a wasm-bindgen wrapper.
4. A Web Audio processing callback requests audio samples from the engine.
5. The returned interleaved stereo samples are copied into the browser's left and right output channels.

The demo also displays the current visual-feature measurements reported by the engine.

## Requirements

- Node.js with Corepack / pnpm available.
- Rust and Cargo (the WASM crate uses Rust edition 2024).
- The Rust target wasm32-unknown-unknown.
- The wasm-bindgen CLI, compatible with the wasm-bindgen crate version in the project.
- A modern browser with WebAssembly, canvas and Web Audio support.
- Internet access for remote video sources and project dependencies.

## Run locally

From the repository root:

    pnpm install
    rustup target add wasm32-unknown-unknown

Install the wasm-bindgen CLI at a version compatible with the crate dependency, then build and start the development server:

    cargo install wasm-bindgen-cli
    pnpm dev

The build script compiles wasm/Cargo.toml for wasm32-unknown-unknown, runs wasm-bindgen with the web target, and writes generated bindings into wasm/pkg. Vite serves the app; open the local URL printed in the terminal.

For a production build:

    pnpm build
    pnpm preview

## Using the demo

1. Open the Studio page in a supported browser.
2. Choose one of the available visual sources.
3. Start the session. Browsers generally require a user gesture before audio can play.
4. Pause or resume the session with the playback controls.
5. Seek within the video using the progress control and watch the displayed feature values update.

If the engine fails to load, check the terminal output for Rust / WASM build errors and confirm that the WASM target and wasm-bindgen CLI are installed. If video playback fails, check network access and the source video's browser codec support.

## Project structure

| Path | Purpose |
| --- | --- |
| src/main.js | Video frame capture, playback controls and Web Audio integration |
| wasm/src/lib.rs | JavaScript-facing wrapper around the Rust engine |
| wasm/Cargo.toml | WASM crate and Rust engine dependency |
| scripts/build-wasm.mjs | Builds the WASM module and JavaScript bindings |
| index.html | Studio page entry point |
| package.json | Vite scripts and JavaScript dependencies |

## Relationship to the other repositories

- [sonificator](https://github.com/neo-universe-2026/sonificator) contains the reusable Rust engine and command-line video renderer.
- [Website](https://github.com/neo-universe-2026/Website) contains the main Earth Information Jukebox globe experience. Its dataset catalogue and interactive globe are not yet integrated with the live Sonificator Studio audio pipeline.

## Current limitations

- The engine's image analysis is tuned to orange emissions in the CO₂ demo. Other visualisations require their own feature extraction and mapping.
- This repository is a focused browser demonstration, not a complete multi-dataset production application.
- Audio generation is performed locally in the browser after the WASM module loads; remote videos still require network access.
- Browser codec support and autoplay policies may affect playback.

## Development

The Rust engine is maintained in the linked sonificator repository. When changing the engine API or feature mapping, update this wrapper and its documentation together. Before submitting a change, run the available build and verify a complete play / pause session in a browser.

## Project status

The browser-to-WASM-to-Web-Audio demonstration is implemented. Integration of dataset-specific soundtracks into the main globe website remains future work.
