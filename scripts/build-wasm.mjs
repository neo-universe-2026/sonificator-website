import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const wasmTarget = resolve(root, "wasm/pkg");
mkdirSync(wasmTarget, { recursive: true });

execFileSync("cargo", [
  "build",
  "--manifest-path", resolve(root, "wasm/Cargo.toml"),
  "--target", "wasm32-unknown-unknown",
  "--release",
], { cwd: root, stdio: "inherit" });

execFileSync("wasm-bindgen", [
  resolve(root, "wasm/target/wasm32-unknown-unknown/release/sonificator_wasm.wasm"),
  "--target", "web",
  "--out-dir", wasmTarget,
  "--out-name", "sonificator_wasm",
], { cwd: root, stdio: "inherit" });
