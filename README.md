# measure-text-width

Measure the width of text using Web Workers and WASM/Rust

This repo is an exploration into the potential for use of Rust and other text
measuring techniques for web applications.

## Running

- Requires `node`, `rust` and `wasm-pack`

```
yarn start
```

Starts the server and compiles the WASM files

## Interesting Files

- `src/typed.ts` sets up the text measurements and runs the test cases
- `src/lib.rs` text measuring implementation in Rust
- `src/wasm-worker.ts` worker file which calls the WASM methods
