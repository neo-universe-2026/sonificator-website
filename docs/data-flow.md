# Browser audio data flow

## Components

- **HTML video element:** plays the selected visual source.
- **Canvas:** receives a downsampled copy of the current video frame.
- **JavaScript controller:** coordinates playback, frame capture and UI state.
- **WASM wrapper:** exposes the Rust engine to JavaScript.
- **Sonificator library:** analyses RGBA pixels and synthesises audio.
- **Web Audio API:** schedules the generated stereo samples for browser playback.

## Runtime sequence

When a session starts, the application creates an AudioContext, constructs a WasmSonificator using the context's sample rate and connects the video/audio processing graph.

While the video is playing, the frame-capture loop draws the current frame to a 128 × 72 canvas. The resulting RGBA pixel buffer is sent to push_frame. The Web Audio processing callback asks the WASM engine for as many audio frames as the output buffer needs, then copies alternating samples into the left and right channels.

This arrangement keeps the audio engine independent from HTML and browser UI code. The wrapper is deliberately small: it forwards frame input, sample rendering and feature readings.

## Synchronisation and browser behaviour

The frame loop is driven by requestAnimationFrame; audio blocks are requested by the Web Audio callback. These are separate browser scheduling mechanisms, so this prototype should be treated as a demonstration rather than a precision scientific playback instrument.

Audio contexts are commonly suspended until a user gesture. The interface therefore starts playback in response to the user's control action.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| WASM engine does not load | Check Rust target installation, wasm-bindgen CLI compatibility and build output |
| Video does not play | Check network access, source URL and browser codec support |
| No audio | Start the session from a user gesture; check browser audio permissions and output volume |
| Build fails before Vite starts | Run the WASM build script directly and inspect Cargo / wasm-bindgen errors |

## Important interpretation note

The displayed feature values describe colour patterns extracted from video frames. They are not direct sensor readings. A change in the visualisation's colour palette, compression, camera movement or rendering style can change the extracted values even if the underlying scientific variable has not changed.
