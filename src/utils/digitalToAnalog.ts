import { DataPoint, DigitalToAnalogAlgorithm } from '../types';
import { VIEWPORT_BUFFER_SIZE } from '../constants';

/**
 * Generates digital-to-analog modulation signal data.
 * 
 * @param binaryInput - Binary string (0s and 1s)
 * @param algorithm - Modulation technique (ASK, FSK, or PSK)
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
    case 'FSK':
      transmittedSignal = generateFSK(bits, bitDuration, samplesPerBit, actualStartBit);
      break;
    case 'PSK':
      transmittedSignal = generatePSK(bits, bitDuration, samplesPerBit, actualStartBit);
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
 * 
 * @param bits - Array of binary bits
 * @param bitDuration - Duration of each bit
 * @param samplesPerBit - Number of samples per bit period
 * @returns Array of data points representing the ASK signal
 */
function generateASK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);
  
  // Pre-allocate array for better performance
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
 * Generates FSK (Frequency Shift Keying) signal.
 * Bit 1 = high frequency, Bit 0 = low frequency.
 * 
 * @param bits - Array of binary bits
 * @param bitDuration - Duration of each bit
 * @param samplesPerBit - Number of samples per bit period
 * @returns Array of data points representing the FSK signal
 */
function generateFSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const freq0 = 3;
  const freq1 = 7;
  const twoPiFreq0 = 2 * Math.PI * freq0;
  const twoPiFreq1 = 2 * Math.PI * freq1;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);
  
  // Pre-allocate array for better performance
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
 * Generates PSK (Phase Shift Keying) signal.
 * Bit 1 = 0° phase, Bit 0 = 180° phase.
 * 
 * @param bits - Array of binary bits
 * @param bitDuration - Duration of each bit
 * @param samplesPerBit - Number of samples per bit period
 * @returns Array of data points representing the PSK signal
 */
function generatePSK(bits: number[], bitDuration: number, samplesPerBit: number, startBit: number = 0): DataPoint[] {
  const carrierFreq = 5;
  const twoPiCarrier = 2 * Math.PI * carrierFreq;
  const numBits = bits.length;
  const totalSamples = numBits * (samplesPerBit + 1);
  
  // Pre-allocate array for better performance
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
