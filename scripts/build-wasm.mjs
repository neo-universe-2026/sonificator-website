import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const wasmTarget = resolve(root, "wasm/pkg");
mkdirSync(wasmTarget, { recursive: true });

const cargoBin = resolve(homedir(), ".cargo", "bin");
const env = {
  ...process.env,
  PATH: process.env.PATH ? `${cargoBin}${delimiter}${process.env.PATH}` : cargoBin,
};

function resolveBin(name) {
  const filename = process.platform === "win32" ? `${name}.exe` : name;
  const candidate = resolve(cargoBin, filename);
  return existsSync(candidate) ? candidate : name;
}

execFileSync(resolveBin("cargo"), [
  "build",
  "--manifest-path", resolve(root, "wasm/Cargo.toml"),
  "--target", "wasm32-unknown-unknown",
  "--release",
], { cwd: root, env, stdio: "inherit" });

execFileSync(resolveBin("wasm-bindgen"), [
  resolve(root, "wasm/target/wasm32-unknown-unknown/release/sonificator_wasm.wasm"),
  "--target", "web",
  "--out-dir", wasmTarget,
  "--out-name", "sonificator_wasm",
], { cwd: root, env, stdio: "inherit" });
