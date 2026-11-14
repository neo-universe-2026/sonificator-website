{
  description = "Sonificator Studio web development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSystem = function:
        nixpkgs.lib.genAttrs systems (system:
          function (import nixpkgs { inherit system; }));
    in
    {
      devShells = forEachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_22
            pkgs.pnpm
            pkgs.rustup
            pkgs.wasm-bindgen-cli
          ];

          shellHook = ''
            export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER=rust-lld
            echo "Sonificator Studio shell"
            echo "pnpm $(pnpm --version)"
          '';
        };
      });
    };
}
