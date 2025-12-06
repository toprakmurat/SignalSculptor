import { DataPoint, DigitalToDigitalAlgorithm } from '../types';

export function generateDigitalToDigitalSignal(
  binaryInput: string,
  algorithm: DigitalToDigitalAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const bits = binaryInput.split('').map(b => parseInt(b));
  const bitDuration = 1;

  const inputSignal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    inputSignal.push({ x: i * bitDuration, y: bits[i] });
    inputSignal.push({ x: (i + 1) * bitDuration, y: bits[i] });
  }

  let transmittedSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'NRZ-L':
      transmittedSignal = generateNRZL(bits, bitDuration);
      break;
    case 'NRZ-I':
      transmittedSignal = generateNRZI(bits, bitDuration);
      break;
    case 'Manchester':
      transmittedSignal = generateManchester(bits, bitDuration);
      break;
    case 'Differential Manchester':
      transmittedSignal = generateDifferentialManchester(bits, bitDuration);
      break;
    case 'AMI':
      transmittedSignal = generateAMI(bits, bitDuration);
      break;
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

function generateNRZL(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    const voltage = bits[i] === 1 ? 1 : -1;
    signal.push({ x: i * bitDuration, y: voltage });
    signal.push({ x: (i + 1) * bitDuration, y: voltage });
  }
  return signal;
}

function generateNRZI(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let currentLevel = 1;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      currentLevel = -currentLevel;
    }
    signal.push({ x: i * bitDuration, y: currentLevel });
    signal.push({ x: (i + 1) * bitDuration, y: currentLevel });
  }
  return signal;
}

function generateManchester(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 0) {
      signal.push({ x: i * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 1) * bitDuration, y: -1 });
    } else {
      signal.push({ x: i * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 1) * bitDuration, y: 1 });
    }
  }
  return signal;
}

function generateDifferentialManchester(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let startHigh = true;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 0) {
      startHigh = !startHigh;
    }

    if (startHigh) {
      signal.push({ x: i * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 1) * bitDuration, y: -1 });
    } else {
      signal.push({ x: i * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 1) * bitDuration, y: 1 });
    }
    startHigh = !startHigh;
  }
  return signal;
}

function generateAMI(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let lastOnePolarity = 1;

  for (let i = 0; i < bits.length; i++) {
    let voltage = 0;
    if (bits[i] === 1) {
      voltage = lastOnePolarity;
      lastOnePolarity = -lastOnePolarity;
    }
    signal.push({ x: i * bitDuration, y: voltage });
    signal.push({ x: (i + 1) * bitDuration, y: voltage });
  }
  return signal;
}
