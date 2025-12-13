import { DataPoint, AnalogToAnalogAlgorithm } from '../types';

/**
 * Generates analog-to-analog modulation signal data.
 * 
 * @param messageFrequency - Message signal frequency in Hz
 * @param messageAmplitude - Message signal amplitude
 * @param algorithm - Modulation technique (AM, FM, or PM)
 * @returns Object containing input, transmitted, and output signal data
 * @throws Error if parameters are invalid
 */
export function generateAnalogToAnalogSignal(
  messageFrequency: number,
  messageAmplitude: number,
  algorithm: AnalogToAnalogAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  // Validate inputs
  if (messageFrequency <= 0) {
    throw new Error('Message frequency must be positive');
  }
  if (messageAmplitude <= 0) {
    throw new Error('Message amplitude must be positive');
  }
  
  const duration = 2;
  const samplesPerSecond = 200;
  const totalSamples = duration * samplesPerSecond;

  // Pre-allocate array and pre-calculate constants for better performance
  const inputSignal: DataPoint[] = new Array(totalSamples);
  const twoPiFreq = 2 * Math.PI * messageFrequency;
  const invSamplesPerSecond = 1 / samplesPerSecond;
  
  for (let i = 0; i < totalSamples; i++) {
    const t = i * invSamplesPerSecond;
    const y = messageAmplitude * Math.sin(twoPiFreq * t);
    inputSignal[i] = { x: t, y };
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
 * Generates AM (Amplitude Modulation) signal.
 * 
 * @param inputSignal - Input message signal
 * @param messageFrequency - Message frequency (for reference)
 * @param messageAmplitude - Message amplitude (for normalization)
 * @returns Array of data points representing the AM modulated signal
 */
function generateAM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const modulationIndex = 0.8;
  const twoPiCarrier = 2 * Math.PI * carrierFrequency;
  const invMessageAmplitude = 1 / messageAmplitude;
  
  // Pre-allocate array for better performance
  const signal: DataPoint[] = new Array(inputSignal.length);
  
  for (let i = 0; i < inputSignal.length; i++) {
    const point = inputSignal[i];
    const messageSignal = point.y * invMessageAmplitude;
    const carrier = Math.sin(twoPiCarrier * point.x);
    const modulatedSignal = carrierAmplitude * (1 + modulationIndex * messageSignal) * carrier;
    signal[i] = { x: point.x, y: modulatedSignal };
  }
  
  return signal;
}

/**
 * Generates FM (Frequency Modulation) signal.
 * 
 * @param inputSignal - Input message signal
 * @param messageFrequency - Message frequency
 * @param messageAmplitude - Message amplitude (for normalization)
 * @returns Array of data points representing the FM modulated signal
 */
function generateFM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const frequencyDeviation = carrierFrequency * 0.5;
  const twoPiCarrier = 2 * Math.PI * carrierFrequency;
  const twoPiDeviation = 2 * Math.PI * frequencyDeviation;
  const invMessageAmplitude = 1 / messageAmplitude;
  const invMessageFreq = 1 / messageFrequency;
  
  // Pre-allocate array for better performance
  const signal: DataPoint[] = new Array(inputSignal.length);
  
  for (let i = 0; i < inputSignal.length; i++) {
    const point = inputSignal[i];
    const messageSignal = point.y * invMessageAmplitude;
    const instantaneousPhase =
      twoPiCarrier * point.x +
      twoPiDeviation * messageSignal * point.x * invMessageFreq;
    const modulatedSignal = carrierAmplitude * Math.sin(instantaneousPhase);
    signal[i] = { x: point.x, y: modulatedSignal };
  }
  
  return signal;
}

/**
 * Generates PM (Phase Modulation) signal.
 * 
 * @param inputSignal - Input message signal
 * @param messageFrequency - Message frequency (for reference)
 * @param messageAmplitude - Message amplitude (for normalization)
 * @returns Array of data points representing the PM modulated signal
 */
function generatePM(
  inputSignal: DataPoint[],
  messageFrequency: number,
  messageAmplitude: number
): DataPoint[] {
  const carrierFrequency = messageFrequency * 5;
  const carrierAmplitude = 1;
  const phaseDeviation = Math.PI / 2;
  const twoPiCarrier = 2 * Math.PI * carrierFrequency;
  const invMessageAmplitude = 1 / messageAmplitude;
  
  // Pre-allocate array for better performance
  const signal: DataPoint[] = new Array(inputSignal.length);
  
  for (let i = 0; i < inputSignal.length; i++) {
    const point = inputSignal[i];
    const messageSignal = point.y * invMessageAmplitude;
    const instantaneousPhase = twoPiCarrier * point.x + phaseDeviation * messageSignal;
    const modulatedSignal = carrierAmplitude * Math.sin(instantaneousPhase);
    signal[i] = { x: point.x, y: modulatedSignal };
  }
  
  return signal;
}
