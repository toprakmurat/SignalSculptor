import { DataPoint, AnalogToDigitalAlgorithm } from '../types';

export function generateAnalogToDigitalSignal(
  frequency: number,
  amplitude: number,
  algorithm: AnalogToDigitalAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const duration = 2;
  const samplesPerSecond = 100;
  const totalSamples = duration * samplesPerSecond;

  const inputSignal: DataPoint[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / samplesPerSecond;
    const y = amplitude * Math.sin(2 * Math.PI * frequency * t);
    inputSignal.push({ x: t, y });
  }

  let transmittedSignal: DataPoint[] = [];
  let outputSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'PCM':
      ({ transmitted: transmittedSignal, output: outputSignal } = generatePCM(
        inputSignal,
        frequency,
        amplitude
      ));
      break;
    case 'Delta Modulation':
      ({ transmitted: transmittedSignal, output: outputSignal } = generateDeltaModulation(
        inputSignal,
        frequency,
        amplitude
      ));
      break;
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: outputSignal,
  };
}

function generatePCM(
  inputSignal: DataPoint[],
  frequency: number,
  amplitude: number
): { transmitted: DataPoint[]; output: DataPoint[] } {
  const samplingRate = Math.max(8, frequency * 4);
  const quantizationLevels = 8;
  const transmitted: DataPoint[] = [];
  const output: DataPoint[] = [];

  const sampleInterval = 1 / samplingRate;
  let nextSampleTime = 0;

  for (const point of inputSignal) {
    if (point.x >= nextSampleTime) {
      const normalizedValue = (point.y / amplitude + 1) / 2;
      const quantized = Math.round(normalizedValue * (quantizationLevels - 1));
      const reconstructedValue = (quantized / (quantizationLevels - 1)) * 2 - 1;
      const finalValue = reconstructedValue * amplitude;

      transmitted.push({ x: point.x, y: quantized });
      output.push({ x: point.x, y: finalValue });

      nextSampleTime += sampleInterval;
    }
  }

  return { transmitted, output };
}

function generateDeltaModulation(
  inputSignal: DataPoint[],
  frequency: number,
  amplitude: number
): { transmitted: DataPoint[]; output: DataPoint[] } {
  const samplingRate = Math.max(16, frequency * 8);
  const delta = amplitude * 0.2;
  const transmitted: DataPoint[] = [];
  const output: DataPoint[] = [];

  const sampleInterval = 1 / samplingRate;
  let nextSampleTime = 0;
  let approximation = 0;

  for (const point of inputSignal) {
    if (point.x >= nextSampleTime) {
      const bit = point.y > approximation ? 1 : 0;
      approximation += bit === 1 ? delta : -delta;

      transmitted.push({ x: point.x, y: bit });
      output.push({ x: point.x, y: approximation });

      nextSampleTime += sampleInterval;
    }
  }

  return { transmitted, output };
}
