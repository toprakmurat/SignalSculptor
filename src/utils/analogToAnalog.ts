import { DataPoint, AnalogToAnalogAlgorithm } from '../types';

export function generateAnalogToAnalogSignal(
  messageFrequency: number,
  messageAmplitude: number,
  algorithm: AnalogToAnalogAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const duration = 2;
  const samplesPerSecond = 200;
  const totalSamples = duration * samplesPerSecond;

  const inputSignal: DataPoint[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / samplesPerSecond;
    const y = messageAmplitude * Math.sin(2 * Math.PI * messageFrequency * t);
    inputSignal.push({ x: t, y });
  }

  let transmittedSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'AM':
      transmittedSignal = generateAM(inputSignal, messageFrequency, messageAmplitude);
      break;
    case 'FM':
      transmittedSignal = generateFM(inputSignal, messageFrequency, messageAmplitude);
      break;
    case 'PM':
      transmittedSignal = generatePM(inputSignal, messageFrequency, messageAmplitude);
      break;
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

function generateAM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const modulationIndex = 0.8;

  return inputSignal.map(point => {
    const messageSignal = point.y / messageAmplitude;
    const carrier = Math.sin(2 * Math.PI * carrierFrequency * point.x);
    const modulatedSignal = carrierAmplitude * (1 + modulationIndex * messageSignal) * carrier;
    return { x: point.x, y: modulatedSignal };
  });
}

function generateFM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const frequencyDeviation = carrierFrequency * 0.5;

  return inputSignal.map(point => {
    const messageSignal = point.y / messageAmplitude;
    const instantaneousPhase =
      2 * Math.PI * carrierFrequency * point.x +
      (2 * Math.PI * frequencyDeviation * messageSignal * point.x) / messageFrequency;
    const modulatedSignal = carrierAmplitude * Math.sin(instantaneousPhase);
    return { x: point.x, y: modulatedSignal };
  });
}

function generatePM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const phaseDeviation = Math.PI / 2;

  return inputSignal.map(point => {
    const messageSignal = point.y / messageAmplitude;
    const instantaneousPhase =
      2 * Math.PI * carrierFrequency * point.x + phaseDeviation * messageSignal;
    const modulatedSignal = carrierAmplitude * Math.sin(instantaneousPhase);
    return { x: point.x, y: modulatedSignal };
  });
}
