# SignalSculptor
SignalSculptor is an educational web application that simulates common data transmission techniques used in computer communications. It provides interactive demonstrations for digital-to-digital (line coding), digital-to-analog (modulation), analog-to-digital (sampling & quantization), and analog-to-analog (carrier modulation) transformations. The UI visualizes input, transmitted, and output signals and includes a small benchmarking section.

This project is implemented with React + TypeScript and bundled with Vite. Charts are rendered using Recharts and the styling is done with Tailwind CSS.

## Architecture & WASM
The core signal processing logic is written in C++ for performance and shared between:
1.  **WebAssembly (WASM)**: Running directly in the browser (primary mode).
2.  **gRPC Server**: Legacy/Reference backend implementation.

The C++ logic is located in `cpp_server/` and is compiled to a WASM module (`signal_lib.wasm`) that the frontend loads dynamically.

## Contents
- `src/` — application source code
	- `api/wasm/` — Generated JS bindings for WASM
	- `components/` — UI components and mode pages
	- `utils/` — signal generation helpers (interfacing with WASM)
- `cpp_server/` — C++ source code for signal processing logic
    - `SignalLib.cpp/h` — Core algorithms
    - `wasm_binding.cpp` — Emscripten bindings
    - `compile_wasm.sh` — WASM build script
- `public/wasm/` — Compiled `.wasm` binary

## Requirements
- **Node.js 18+**
- **Emscripten** (only if you need to modify C++ code and recompile WASM)

## Quick start

### 1. Run the Web App
The project comes with pre-compiled WASM artifacts, so you can run it immediately:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. (Optional) Recompile WASM
If you modify the C++ logic in `cpp_server/`, you must recompile the WASM module.
Ensure you have the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) installed and active in your terminal.

```bash
cd cpp_server
./compile_wasm.sh
```
This command will:
1.  Compile `SignalLib.cpp` to WebAssembly.
2.  Update `src/api/wasm/signal_lib.js`.
3.  Update `public/wasm/signal_lib.wasm`.
4.  Refresh the web page to see changes.

## Available scripts
- `npm run dev` — start Vite dev server
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — locally preview the production build

## Troubleshooting
- **"signal_lib.wasm not found"**: Ensure the `public/wasm/` folder exists and contains the `.wasm` file. If not, run the compilation script.
- **Performance Issues**: The app uses a debounced input for expensive operations. If simulating extremely large datasets, there might be a slight delay.