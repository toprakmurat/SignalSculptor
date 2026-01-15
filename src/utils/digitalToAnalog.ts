import { DataPoint, DigitalToAnalogAlgorithm } from '../types';
import { VIEWPORT_BUFFER_SIZE } from '../constants';

/**
 * Generates digital-to-analog modulation signal data.
 * 
 * @param binaryInput - Binary string (0s and 1s)
 * @param algorithm - Modulation technique (ASK, BFSK, MFSK, BPSK, DPSK, QPSK, OQPSK, MPSK, or QAM)
 * @param startBit - Optional start bit index for partial generation (0-based)
 * @param endBit - Optional end bit index for partial generation (exclusive)
 * @returns Object containing input, transmitted, and output signal data
 * @throws Error if binary input is invalid
 */
export function generateDigitalToAnalogSignal(
  binaryInput: string,
  algorithm: DigitalToAnalogAlgorithm,
  startBit?: number,
  endBit?: number
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  // Validate input
  if (!/^[01]+$/.test(binaryInput)) {
    throw new Error('Invalid binary input: must contain only 0s and 1s');
  }
  if (binaryInput.length === 0) {
    throw new Error('Binary input cannot be empty');
  }

  // Convert string to number array (optimized: pre-allocate)
  const allBits: number[] = new Array(binaryInput.length);
  for (let i = 0; i < binaryInput.length; i++) {
    allBits[i] = parseInt(binaryInput[i], 10);
  }

  const bitDuration = 1;
  const samplesPerBit = 100;
  const totalBits = allBits.length;

  // Handle partial generation for viewport
  const usePartial = startBit !== undefined && endBit !== undefined;
  const actualStartBit = usePartial ? Math.max(0, startBit - VIEWPORT_BUFFER_SIZE) : 0;
  const actualEndBit = usePartial ? Math.min(totalBits, endBit + VIEWPORT_BUFFER_SIZE) : totalBits;
  const numBits = actualEndBit - actualStartBit;

  // Extract relevant bits for partial generation
  const bits = usePartial
    ? allBits.slice(actualStartBit, actualEndBit)
    : allBits;

  // Pre-allocate input signal array (2 points per bit)
  // Adjust x coordinates for partial generation
  const inputSignal: DataPoint[] = new Array(numBits * 2);
  for (let i = 0; i < numBits; i++) {
    const bitValue = bits[i];
    const x1 = (actualStartBit + i) * bitDuration;
    const x2 = (actualStartBit + i + 1) * bitDuration;
    inputSignal[i * 2] = { x: x1, y: bitValue };
    inputSignal[i * 2 + 1] = { x: x2, y: bitValue };
  }

  let transmittedSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'ASK':
      transmittedSignal = generateASK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'BFSK':
      transmittedSignal = generateBFSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'MFSK':
      transmittedSignal = generateMFSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'BPSK':
      transmittedSignal = generateBPSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'DPSK':
      transmittedSignal = generateDPSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'QPSK':
      transmittedSignal = generateQPSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'OQPSK':
      transmittedSignal = generateOQPSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'MPSK':
      transmittedSignal = generateMPSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'QAM':
      transmittedSignal = generateQAM(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

/**
 * Generates ASK (Amplitude Shift Keying) signal.
 * Bit 1 = high amplitude, Bit 0 = low amplitude.
 */
function generateASK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numBits; i++) {
    const amplitude = bits[i] === 1 ? 1 : 0.2;
    const baseTime = (startBit + i) * bitDuration;
    const timeStep = bitDuration / samplesPerBit;

    for (let j = 0; j <= samplesPerBit; j++) {
      const t = baseTime + j * timeStep;
      const y = amplitude * Math.sin(twoPiCarrier * t);
      signal[index++] = { x: t, y };
    }
  }
  return signal;
}

/**
 * Generates BFSK (Binary Frequency Shift Keying) signal.
 * Bit 1 = high frequency, Bit 0 = low frequency.
 */
function generateBFSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const freq0 = 3;
  const freq1 = 7;
  const twoPiFreq0 = 2 * Math.PI * freq0;
  const twoPiFreq1 = 2 * Math.PI * freq1;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numBits; i++) {
    const twoPiFreq = bits[i] === 1 ? twoPiFreq1 : twoPiFreq0;
    const baseTime = (startBit + i) * bitDuration;
    const timeStep = bitDuration / samplesPerBit;

    for (let j = 0; j <= samplesPerBit; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiFreq * t);
      signal[index++] = { x: t, y };
    }
  }
  return signal;
}

/**
 * Generates MFSK (M-ary Frequency Shift Keying) signal.
 * Uses 4 frequencies (M=4) for 2-bit symbols: 00, 01, 10, 11
 */
function generateMFSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const frequencies = [2, 4, 6, 8];
  const symbolDuration = bitDuration * 2;
  const samplesPerSymbol = samplesPerBit * 2;

  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;
  const totalSamples = numSymbols * (samplesPerSymbol + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * 2];
    const bit2 = paddedBits[i * 2 + 1];
    const symbolValue = bit1 * 2 + bit2;
    const freq = frequencies[symbolValue];
    const twoPiFreq = 2 * Math.PI * freq;

    const baseTime = (startBit / 2 + i) * symbolDuration;
    const timeStep = symbolDuration / samplesPerSymbol;

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiFreq * t);
      signal[index++] = { x: t, y };
    }
  }

  return signal.slice(0, index);
}

/**
 * Generates BPSK (Binary Phase Shift Keying) signal.
 * Bit 1 = 0° phase, Bit 0 = 180° phase.
 */
function generateBPSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numBits; i++) {
    const phaseShift = bits[i] === 1 ? 0 : Math.PI;
    const baseTime = (startBit + i) * bitDuration;
    const timeStep = bitDuration / samplesPerBit;

    for (let j = 0; j <= samplesPerBit; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiCarrier * t + phaseShift);
      signal[index++] = { x: t, y };
    }
  }
  return signal;
}

/**
 * Generates DPSK (Differential Phase Shift Keying) signal.
 * Phase changes relative to the previous bit.
 * Bit 1 = no phase change, Bit 0 = 180° phase change.
 */
function generateDPSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;
  let currentPhase = 0;

  for (let i = 0; i < numBits; i++) {
    if (bits[i] === 0) {
      currentPhase += Math.PI;
    }

    const baseTime = (startBit + i) * bitDuration;
    const timeStep = bitDuration / samplesPerBit;

    for (let j = 0; j <= samplesPerBit; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiCarrier * t + currentPhase);
      signal[index++] = { x: t, y };
    }
  }
  return signal;
}

/**
 * Generates QPSK (Quadrature Phase Shift Keying) signal.
 * Uses 4 phase states (45°, 135°, 225°, 315°) for 2-bit symbols.
 */
function generateQPSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const symbolDuration = bitDuration * 2;
  const samplesPerSymbol = samplesPerBit * 2;

  const phaseMap = [
    Math.PI / 4,
    3 * Math.PI / 4,
    7 * Math.PI / 4,
    5 * Math.PI / 4
  ];

  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;
  const totalSamples = numSymbols * (samplesPerSymbol + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * 2];
    const bit2 = paddedBits[i * 2 + 1];
    const symbolValue = bit1 * 2 + bit2;
    const phase = phaseMap[symbolValue];

    const baseTime = (startBit / 2 + i) * symbolDuration;
    const timeStep = symbolDuration / samplesPerSymbol;

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiCarrier * t + phase);
      signal[index++] = { x: t, y };
    }
  }

  return signal.slice(0, index);
}

/**
 * Generates OQPSK (Offset Quadrature Phase Shift Keying) signal.
 * Similar to QPSK but with Q-channel delayed by half a symbol period.
 */
function generateOQPSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;

  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;

  const iBits: number[] = [];
  const qBits: number[] = [];
  for (let i = 0; i < numSymbols; i++) {
    iBits.push(paddedBits[i * 2]);
    qBits.push(paddedBits[i * 2 + 1]);
  }

  const symbolDuration = bitDuration * 2;
  const samplesPerSymbol = samplesPerBit * 2;
  const halfSymbolSamples = samplesPerBit;
  const totalSamples = numSymbols * samplesPerSymbol + halfSymbolSamples;

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let sample = 0; sample < totalSamples; sample++) {
    const t = (startBit / 2) * symbolDuration + (sample / samplesPerSymbol) * symbolDuration;

    const iSymbolIdx = Math.floor(sample / samplesPerSymbol);
    const qSymbolIdx = Math.floor((sample - halfSymbolSamples / 2) / samplesPerSymbol);

    const iValue = iSymbolIdx >= 0 && iSymbolIdx < iBits.length
      ? (iBits[iSymbolIdx] === 1 ? 1 : -1)
      : 0;
    const qValue = qSymbolIdx >= 0 && qSymbolIdx < qBits.length
      ? (qBits[qSymbolIdx] === 1 ? 1 : -1)
      : 0;

    const y = iValue * Math.cos(twoPiCarrier * t) + qValue * Math.sin(twoPiCarrier * t);
    signal[index++] = { x: t, y };
  }

  return signal.slice(0, index);
}

/**
 * Generates MPSK (M-ary Phase Shift Keying) signal.
 * Uses 8 phase states (M=8) for 3-bit symbols.
 */
function generateMPSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const M = 8;
  const bitsPerSymbol = 3;
  const symbolDuration = bitDuration * bitsPerSymbol;
  const samplesPerSymbol = samplesPerBit * bitsPerSymbol;

  const remainder = bits.length % bitsPerSymbol;
  const paddedBits = remainder === 0 ? bits : [...bits, ...new Array(bitsPerSymbol - remainder).fill(0)];
  const numSymbols = paddedBits.length / bitsPerSymbol;
  const totalSamples = numSymbols * (samplesPerSymbol + 1);

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * bitsPerSymbol];
    const bit2 = paddedBits[i * bitsPerSymbol + 1];
    const bit3 = paddedBits[i * bitsPerSymbol + 2];
    const symbolValue = bit1 * 4 + bit2 * 2 + bit3;
    const phase = (symbolValue / M) * 2 * Math.PI;

    const baseTime = (startBit / bitsPerSymbol + i) * symbolDuration;
    const timeStep = symbolDuration / samplesPerSymbol;

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = baseTime + j * timeStep;
      const y = Math.sin(twoPiCarrier * t + phase);
      signal[index++] = { x: t, y };
    }
  }

  return signal.slice(0, index);
}

/**
 * Generates QAM (Quadrature Amplitude Modulation) signal.
 * Uses 16-QAM: 4 amplitude levels × 4 phase states for 4-bit symbols.
 */
function generateQAM(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const bitsPerSymbol = 4;
  const symbolDuration = bitDuration * bitsPerSymbol;
  const samplesPerSymbol = samplesPerBit * bitsPerSymbol;

  const remainder = bits.length % bitsPerSymbol;
  const paddedBits = remainder === 0 ? bits : [...bits, ...new Array(bitsPerSymbol - remainder).fill(0)];
  const numSymbols = paddedBits.length / bitsPerSymbol;
  const totalSamples = numSymbols * (samplesPerSymbol + 1);

  const levels = [-3, -1, 1, 3];

  const signal: DataPoint[] = new Array(totalSamples);
  let index = 0;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * bitsPerSymbol];
    const bit2 = paddedBits[i * bitsPerSymbol + 1];
    const bit3 = paddedBits[i * bitsPerSymbol + 2];
    const bit4 = paddedBits[i * bitsPerSymbol + 3];

    const iIndex = bit1 * 2 + bit2;
    const qIndex = bit3 * 2 + bit4;
    const iAmplitude = levels[iIndex] / 3;
    const qAmplitude = levels[qIndex] / 3;

    const baseTime = (startBit / bitsPerSymbol + i) * symbolDuration;
    const timeStep = symbolDuration / samplesPerSymbol;

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = baseTime + j * timeStep;
      const y = iAmplitude * Math.cos(twoPiCarrier * t) + qAmplitude * Math.sin(twoPiCarrier * t);
      signal[index++] = { x: t, y };
    }
  }

  return signal.slice(0, index);
}
