import { DataPoint, DigitalToAnalogAlgorithm } from '../types';

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
    case 'FSK':
      transmittedSignal = generateFSK(bits, bitDuration, samplesPerBit);
      break;
    case 'PSK':
      transmittedSignal = generatePSK(bits, bitDuration, samplesPerBit);
      break;
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

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

function generateFSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  const freq0 = 3;
  const freq1 = 7;

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

function generatePSK(bits: number[], bitDuration: number, samplesPerBit: number): DataPoint[] {
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
