import { DataPoint, DigitalToAnalogAlgorithm } from '../types';

/**
 * Generates digital-to-analog modulation signal data.
 * 
 * @param binaryInput - Binary string (0s and 1s)
 * @param algorithm - Modulation technique (ASK, BFSK, MFSK, BPSK, DPSK, QPSK, OQPSK, MPSK, or QAM)
 * @returns Object containing input, transmitted, and output signal data
 * @throws Error if binary input is invalid
 */
export function generateDigitalToAnalogSignal(
  binaryInput: string,
  algorithm: DigitalToAnalogAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const bits = binaryInput.split('').map(b => parseInt(b));
  const bitDuration = 1;
  const samplesPerBit = 100;

  const inputSignal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    inputSignal.push({ x: i * bitDuration, y: bits[i] });
    inputSignal.push({ x: (i + 1) * bitDuration, y: bits[i] });
  }

  let transmittedSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'ASK':
      transmittedSignal = generateASK(bits, bitDuration, samplesPerBit);
      break;
    case 'BFSK':
      transmittedSignal = generateBFSK(bits, bitDuration, samplesPerBit);
      break;
    case 'MFSK':
      transmittedSignal = generateMFSK(bits, bitDuration, samplesPerBit);
      break;
    case 'BPSK':
      transmittedSignal = generateBPSK(bits, bitDuration, samplesPerBit);
      break;
    case 'DPSK':
      transmittedSignal = generateDPSK(bits, bitDuration, samplesPerBit);
      break;
    case 'QPSK':
      transmittedSignal = generateQPSK(bits, bitDuration, samplesPerBit);
      break;
    case 'OQPSK':
      transmittedSignal = generateOQPSK(bits, bitDuration, samplesPerBit);
      break;
    case 'MPSK':
      transmittedSignal = generateMPSK(bits, bitDuration, samplesPerBit);
      break;
    case 'QAM':
      transmittedSignal = generateQAM(bits, bitDuration, samplesPerBit);
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
function generateASK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;

  for (let i = 0; i < bits.length; i++) {
    const amplitude = bits[i] === 1 ? 1 : 0.2;
    for (let j = 0; j <= samplesPerBit; j++) {
      const t = i * bitDuration + (j / samplesPerBit) * bitDuration;
      const y = amplitude * Math.sin(2 * Math.PI * carrierFreq * t);
      signal.push({ x: t, y });
    }
  }
  return signal;
}

/**
 * Generates BFSK (Binary Frequency Shift Keying) signal.
 * Bit 1 = high frequency, Bit 0 = low frequency.
 */
function generateBFSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const freq0 = 3;  // Frequency for bit 0
  const freq1 = 7;  // Frequency for bit 1

  for (let i = 0; i < bits.length; i++) {
    const frequency = bits[i] === 1 ? freq1 : freq0;
    for (let j = 0; j <= samplesPerBit; j++) {
      const t = i * bitDuration + (j / samplesPerBit) * bitDuration;
      const y = Math.sin(2 * Math.PI * frequency * t);
      signal.push({ x: t, y });
    }
  }
  return signal;
}

/**
 * Generates MFSK (M-ary Frequency Shift Keying) signal.
 * Uses 4 frequencies (M=4) for 2-bit symbols: 00, 01, 10, 11
 */
function generateMFSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  // 4-FSK: 4 different frequencies for 2 bits per symbol
  const frequencies = [2, 4, 6, 8]; // f00, f01, f10, f11
  const symbolDuration = bitDuration * 2; // Each symbol = 2 bits
  const samplesPerSymbol = samplesPerBit * 2;

  // Pad bits to even number
  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * 2];
    const bit2 = paddedBits[i * 2 + 1];
    const symbolValue = bit1 * 2 + bit2; // 00=0, 01=1, 10=2, 11=3
    const freq = frequencies[symbolValue];

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = i * symbolDuration + (j / samplesPerSymbol) * symbolDuration;
      const y = Math.sin(2 * Math.PI * freq * t);
      signal.push({ x: t, y });
    }
  }

  return signal;
}

/**
 * Generates BPSK (Binary Phase Shift Keying) signal.
 * Bit 1 = 0° phase, Bit 0 = 180° phase.
 */
function generateBPSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;

  for (let i = 0; i < bits.length; i++) {
    const phaseShift = bits[i] === 1 ? 0 : Math.PI;
    for (let j = 0; j <= samplesPerBit; j++) {
      const t = i * bitDuration + (j / samplesPerBit) * bitDuration;
      const y = Math.sin(2 * Math.PI * carrierFreq * t + phaseShift);
      signal.push({ x: t, y });
    }
  }
  return signal;
}

/**
 * Generates DPSK (Differential Phase Shift Keying) signal.
 * Phase changes (0° or 180°) are relative to the previous bit.
 * Bit 1 = no phase change, Bit 0 = 180° phase change.
 */
function generateDPSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;
  let currentPhase = 0; // Start with reference phase

  for (let i = 0; i < bits.length; i++) {
    // In DPSK, bit 0 causes phase change, bit 1 keeps same phase
    if (bits[i] === 0) {
      currentPhase += Math.PI;
    }

    for (let j = 0; j <= samplesPerBit; j++) {
      const t = i * bitDuration + (j / samplesPerBit) * bitDuration;
      const y = Math.sin(2 * Math.PI * carrierFreq * t + currentPhase);
      signal.push({ x: t, y });
    }
  }
  return signal;
}

/**
 * Generates QPSK (Quadrature Phase Shift Keying) signal.
 * Uses 4 phase states (45°, 135°, 225°, 315°) for 2-bit symbols.
 */
function generateQPSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;
  const symbolDuration = bitDuration * 2; // Each symbol = 2 bits
  const samplesPerSymbol = samplesPerBit * 2;

  // Phase mapping for QPSK: 00=45°, 01=135°, 10=315°, 11=225°
  const phaseMap = [
    Math.PI / 4,       // 00 → 45°
    3 * Math.PI / 4,   // 01 → 135°
    7 * Math.PI / 4,   // 10 → 315°
    5 * Math.PI / 4    // 11 → 225°
  ];

  // Pad bits to even number
  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * 2];
    const bit2 = paddedBits[i * 2 + 1];
    const symbolValue = bit1 * 2 + bit2;
    const phase = phaseMap[symbolValue];

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = i * symbolDuration + (j / samplesPerSymbol) * symbolDuration;
      const y = Math.sin(2 * Math.PI * carrierFreq * t + phase);
      signal.push({ x: t, y });
    }
  }

  return signal;
}

/**
 * Generates OQPSK (Offset Quadrature Phase Shift Keying) signal.
 * Similar to QPSK but with Q-channel delayed by half a symbol period.
 * This limits phase transitions to 90° maximum.
 */
function generateOQPSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;

  // Pad bits to even number
  const paddedBits = bits.length % 2 === 0 ? bits : [...bits, 0];
  const numSymbols = paddedBits.length / 2;

  // Extract I and Q bits
  const iBits: number[] = [];
  const qBits: number[] = [];
  for (let i = 0; i < numSymbols; i++) {
    iBits.push(paddedBits[i * 2]);     // Even bits → I channel
    qBits.push(paddedBits[i * 2 + 1]); // Odd bits → Q channel
  }

  const symbolDuration = bitDuration * 2;
  const samplesPerSymbol = samplesPerBit * 2;
  const halfSymbolSamples = samplesPerBit; // Q offset by half symbol
  const totalSamples = numSymbols * samplesPerSymbol + halfSymbolSamples;

  // Generate OQPSK: I(t)*cos(wt) + Q(t-T/2)*sin(wt)
  for (let sample = 0; sample < totalSamples; sample++) {
    const t = (sample / samplesPerSymbol) * symbolDuration;

    // Determine which symbol we're in for I channel
    const iSymbolIdx = Math.floor(sample / samplesPerSymbol);
    // Q channel is offset by half symbol
    const qSymbolIdx = Math.floor((sample - halfSymbolSamples / 2) / samplesPerSymbol);

    const iValue = iSymbolIdx >= 0 && iSymbolIdx < iBits.length
      ? (iBits[iSymbolIdx] === 1 ? 1 : -1)
      : 0;
    const qValue = qSymbolIdx >= 0 && qSymbolIdx < qBits.length
      ? (qBits[qSymbolIdx] === 1 ? 1 : -1)
      : 0;

    const y = iValue * Math.cos(2 * Math.PI * carrierFreq * t) + qValue * Math.sin(2 * Math.PI * carrierFreq * t);
    signal.push({ x: t, y });
  }

  return signal;
}

/**
 * Generates MPSK (M-ary Phase Shift Keying) signal.
 * Uses 8 phase states (M=8) for 3-bit symbols.
 */
function generateMPSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;
  const M = 8; // 8-PSK
  const bitsPerSymbol = 3;
  const symbolDuration = bitDuration * bitsPerSymbol;
  const samplesPerSymbol = samplesPerBit * bitsPerSymbol;

  // Pad bits to multiple of 3
  const remainder = bits.length % bitsPerSymbol;
  const paddedBits = remainder === 0 ? bits : [...bits, ...new Array(bitsPerSymbol - remainder).fill(0)];
  const numSymbols = paddedBits.length / bitsPerSymbol;

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * bitsPerSymbol];
    const bit2 = paddedBits[i * bitsPerSymbol + 1];
    const bit3 = paddedBits[i * bitsPerSymbol + 2];
    const symbolValue = bit1 * 4 + bit2 * 2 + bit3; // 0 to 7
    const phase = (symbolValue / M) * 2 * Math.PI; // Uniform phase distribution

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = i * symbolDuration + (j / samplesPerSymbol) * symbolDuration;
      const y = Math.sin(2 * Math.PI * carrierFreq * t + phase);
      signal.push({ x: t, y });
    }
  }

  return signal;
}

/**
 * Generates QAM (Quadrature Amplitude Modulation) signal.
 * Uses 16-QAM: 4 amplitude levels × 4 phase states for 4-bit symbols.
 */
function generateQAM(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const carrierFreq = 5;
  const bitsPerSymbol = 4; // 16-QAM
  const symbolDuration = bitDuration * bitsPerSymbol;
  const samplesPerSymbol = samplesPerBit * bitsPerSymbol;

  // Pad bits to multiple of 4
  const remainder = bits.length % bitsPerSymbol;
  const paddedBits = remainder === 0 ? bits : [...bits, ...new Array(bitsPerSymbol - remainder).fill(0)];
  const numSymbols = paddedBits.length / bitsPerSymbol;

  // 16-QAM constellation: 4x4 grid
  // I levels: -3, -1, +1, +3 (normalized)
  // Q levels: -3, -1, +1, +3 (normalized)
  const levels = [-3, -1, 1, 3];

  for (let i = 0; i < numSymbols; i++) {
    const bit1 = paddedBits[i * bitsPerSymbol];
    const bit2 = paddedBits[i * bitsPerSymbol + 1];
    const bit3 = paddedBits[i * bitsPerSymbol + 2];
    const bit4 = paddedBits[i * bitsPerSymbol + 3];

    // Gray coding for I (bits 1,2) and Q (bits 3,4) channels
    const iIndex = bit1 * 2 + bit2;
    const qIndex = bit3 * 2 + bit4;
    const iAmplitude = levels[iIndex] / 3; // Normalize to ±1 range
    const qAmplitude = levels[qIndex] / 3;

    for (let j = 0; j <= samplesPerSymbol; j++) {
      const t = i * symbolDuration + (j / samplesPerSymbol) * symbolDuration;
      const y = iAmplitude * Math.cos(2 * Math.PI * carrierFreq * t) + qAmplitude * Math.sin(2 * Math.PI * carrierFreq * t);
      signal.push({ x: t, y });
    }
  }

  return signal;
}
