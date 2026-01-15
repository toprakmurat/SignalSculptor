# SignalSculptor
SignalSculptor is an educational web application that simulates common data transmission techniques used in computer communications. It provides interactive demonstrations for digital-to-digital (line coding), digital-to-analog (modulation), analog-to-digital (sampling & quantization), and analog-to-analog (carrier modulation) transformations. The UI visualizes input, transmitted, and output signals and includes a small benchmarking section.

This project is implemented with React + TypeScript and bundled with Vite. Charts are rendered using Recharts and the styling is done with Tailwind CSS.

## Contents
- `src/` — application source code
	- `components/` — UI components and mode pages
	- `utils/` — signal generation algorithms and helpers
	- `types.ts` — shared TypeScript types
- `index.html`, `vite.config.ts` — Vite app entry and config
- `package.json` — npm scripts and dependencies

## Features
- Interactive encodings and modulations:
	- Digital → Digital: NRZ-L, NRZ-I, Manchester, Differential Manchester, AMI
	- Digital → Analog: ASK, BFSK, MFSK, BPSK, DPSK, QPSK, OQPSK, MPSK, QAM
	- Analog → Digital: PCM, Delta Modulation
	- Analog → Analog: carrier modulation demonstrations
- Visual signal charts for input, transmitted, and output signals
- Configurable parameters (bit patterns, frequencies, amplitudes, algorithms)
- Benchmark mode to compare simple performance characteristics

## Requirements
- Node.js 18+ recommended
- npm (bundled with Node) or yarn

## Quick start (development)
1. Clone the repository and open the project root.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser at the URL shown by Vite (usually `http://localhost:5173`).

## Available scripts
- `npm run dev` — start Vite dev server
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — locally preview the production build

Check `package.json` for the exact script definitions.