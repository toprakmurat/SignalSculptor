import { DataPoint, AnalogToDigitalConfig, PCMConfig, DeltaModulationConfig } from '../types';

/**
 * Gets input signal value at exact time using binary search for O(log n) complexity.
 * Falls back to linear interpolation between surrounding points.
 * 
 * @param inputSignal - Array of data points (must be sorted by x)
 * @param time - Target time value
 * @returns Interpolated y value at the given time
 */
function getInputValueAtTime(inputSignal: DataPoint[], time: number): number {
  if (inputSignal.length === 0) return 0;
  
  const lastIndex = inputSignal.length - 1;
  const firstTime = inputSignal[0].x;
  const lastTime = inputSignal[lastIndex].x;
  
  // Early returns for out-of-bounds
  if (time <= firstTime) return inputSignal[0].y;
  if (time >= lastTime) return inputSignal[lastIndex].y;
  
  // Binary search for the interval containing the target time
  // O(log n) instead of O(n) linear search
  let left = 0;
  let right = lastIndex;
  
  while (right - left > 1) {
    const mid = Math.floor((left + right) / 2);
    if (inputSignal[mid].x <= time) {
      left = mid;
    } else {
      right = mid;
    }
  }
  
  // Linear interpolation between the two surrounding points
  const t1 = inputSignal[left].x;
  const t2 = inputSignal[right].x;
  const y1 = inputSignal[left].y;
  const y2 = inputSignal[right].y;
  
  if (t2 === t1) return y1;
  
  const ratio = (time - t1) / (t2 - t1);
  return y1 + ratio * (y2 - y1);
}

/**
 * Generates analog-to-digital conversion signal data.
 * 
 * @param frequency - Input signal frequency in Hz
 * @param amplitude - Input signal amplitude
 * @param config - Conversion algorithm configuration (PCM or Delta Modulation)
 * @param inputSignal - Optional pre-generated input signal (for testing/caching)
 * @returns Object containing input, transmitted, and output signal data
 * @throws Error if configuration is invalid or missing required parameters
 */
export function generateAnalogToDigitalSignal(
  frequency: number,
  amplitude: number,
  config: AnalogToDigitalConfig,
  inputSignal?: DataPoint[]
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  // Validate inputs
  if (frequency <= 0) {
    throw new Error('Frequency must be positive');
  }
  if (amplitude <= 0) {
    throw new Error('Amplitude must be positive');
  }
  
  const duration = 2;
  const samplesPerSecond = 100;
  const totalSamples = duration * samplesPerSecond;

  // Use provided input signal or generate default sine wave
  // Pre-allocate array size for better performance
  const input = inputSignal || (() => {
    const signal: DataPoint[] = new Array(totalSamples);
    const twoPiFreq = 2 * Math.PI * frequency;
    const invSamplesPerSecond = 1 / samplesPerSecond;
    
    for (let i = 0; i < totalSamples; i++) {
      const t = i * invSamplesPerSecond;
      const y = amplitude * Math.sin(twoPiFreq * t);
      signal[i] = { x: t, y };
    }
    return signal;
  })();

  let transmittedSignal: DataPoint[] = [];
  let outputSignal: DataPoint[] = [];

  switch (config.algorithm) {
    case 'PCM':
      if (!config.pcm) {
        throw new Error('PCM configuration required');
      }
      if (config.pcm.samplingRate <= 0) {
        throw new Error('PCM sampling rate must be positive');
      }
      if (config.pcm.quantizationLevels < 2) {
        throw new Error('PCM quantization levels must be at least 2');
      }
      ({ transmitted: transmittedSignal, output: outputSignal } = generatePCM(
        input,
        amplitude,
        config.pcm
      ));
      break;
    case 'Delta Modulation':
      if (!config.deltaModulation) {
        throw new Error('Delta Modulation configuration required');
      }
      if (config.deltaModulation.samplingRate <= 0) {
        throw new Error('Delta Modulation sampling rate must be positive');
      }
      if (config.deltaModulation.deltaStepSize <= 0 || config.deltaModulation.deltaStepSize > 1) {
        throw new Error('Delta step size must be between 0 and 1');
      }
      ({ transmitted: transmittedSignal, output: outputSignal } = generateDeltaModulation(
        input,
        amplitude,
        config.deltaModulation
      ));
      break;
    default:
      throw new Error(`Unknown algorithm: ${(config as any).algorithm}`);
  }

  return {
    input,
    transmitted: transmittedSignal,
    output: outputSignal,
  };
}

/**
 * Generates PCM (Pulse Code Modulation) signal.
 * 
 * @param inputSignal - Input analog signal data points
 * @param amplitude - Original signal amplitude for normalization
 * @param config - PCM configuration (sampling rate and quantization levels)
 * @returns Object containing transmitted (quantized) and output (reconstructed) signals
 */
function generatePCM(
  inputSignal: DataPoint[],
  amplitude: number,
  config: PCMConfig
): { transmitted: DataPoint[]; output: DataPoint[] } {
  if (inputSignal.length === 0) {
    return { transmitted: [], output: [] };
  }
  
  const sampleInterval = 1 / config.samplingRate;
  const duration = inputSignal[inputSignal.length - 1].x;
  const numSamples = Math.ceil(duration * config.samplingRate) + 1;
  
  // Pre-allocate arrays with estimated size for better performance
  const transmitted: DataPoint[] = new Array(numSamples);
  const output: DataPoint[] = new Array(numSamples);
  
  // Pre-calculate constants to avoid repeated calculations
  const invAmplitude = 1 / amplitude;
  const quantizationRange = config.quantizationLevels - 1;
  const invQuantizationRange = 1 / quantizationRange;
  
  let index = 0;
  for (let i = 0; i * sampleInterval <= duration; i++) {
    const sampleTime = Math.round(i * sampleInterval * 1000000) / 1000000;
    
    // Interpolate or find the closest input value at this exact sample time
    const inputValue = getInputValueAtTime(inputSignal, sampleTime);
    
    // Normalize to [0, 1], quantize, then denormalize
    const normalizedValue = (inputValue * invAmplitude + 1) * 0.5;
    const quantized = Math.round(normalizedValue * quantizationRange);
    const reconstructedValue = (quantized * invQuantizationRange * 2 - 1) * amplitude;

    transmitted[index] = { x: sampleTime, y: quantized };
    output[index] = { x: sampleTime, y: reconstructedValue };
    index++;
  }
  
  // Trim arrays to actual size
  transmitted.length = index;
  output.length = index;

  return { transmitted, output };
}

/**
 * Generates Delta Modulation signal.
 * 
 * @param inputSignal - Input analog signal data points
 * @param amplitude - Original signal amplitude for step size calculation
 * @param config - Delta Modulation configuration (sampling rate and delta step size)
 * @returns Object containing transmitted (binary) and output (reconstructed) signals
 */
function generateDeltaModulation(
  inputSignal: DataPoint[],
  amplitude: number,
  config: DeltaModulationConfig
): { transmitted: DataPoint[]; output: DataPoint[] } {
  if (inputSignal.length === 0) {
    return { transmitted: [], output: [] };
  }
  
  const delta = amplitude * config.deltaStepSize;
  const sampleInterval = 1 / config.samplingRate;
  const duration = inputSignal[inputSignal.length - 1].x;
  const numSamples = Math.ceil(duration * config.samplingRate) + 1;
  
  // Pre-allocate arrays with estimated size (output needs more points for step transitions)
  const transmitted: DataPoint[] = new Array(numSamples);
  const output: DataPoint[] = new Array(numSamples * 2 + 1); // Extra space for step transitions
  
  // Pre-calculate clamp bounds
  const minApproximation = -amplitude * 1.5;
  const maxApproximation = amplitude * 1.5;
  
  let approximation = 0;
  let transmittedIndex = 0;
  let outputIndex = 0;

  // Add initial point at t=0
  output[outputIndex++] = { x: 0, y: approximation };

  for (let i = 0; i * sampleInterval <= duration; i++) {
    const sampleTime = Math.round(i * sampleInterval * 1000000) / 1000000;
    
    // Get input value at exact sample time
    const inputValue = getInputValueAtTime(inputSignal, sampleTime);
    
    // Compare input with current approximation to determine bit
    const bit = inputValue > approximation ? 1 : 0;
    
    // Transmit the bit at the exact sample time
    transmitted[transmittedIndex++] = { x: sampleTime, y: bit };
    
    // Update approximation based on transmitted bit (receiver side)
    approximation += bit === 1 ? delta : -delta;
    
    // Clamp approximation to prevent excessive drift
    approximation = Math.max(minApproximation, Math.min(maxApproximation, approximation));
    
    // Add step transition: hold previous value until step time, then step to new value
    // This creates the staircase effect
    if (outputIndex > 0) {
      const prevY = output[outputIndex - 1].y;
      // Add point just before the step to hold previous value
      output[outputIndex++] = { x: sampleTime - 0.001, y: prevY };
    }
    
    // Add reconstructed output point at the new level at exact sample time
    output[outputIndex++] = { x: sampleTime, y: approximation };
  }

  // Extend the last value to the end of the signal
  if (outputIndex > 0) {
    const lastY = output[outputIndex - 1].y;
    const lastX = inputSignal[inputSignal.length - 1].x;
    output[outputIndex++] = { x: lastX, y: lastY };
  }
  
  // Trim arrays to actual size
  transmitted.length = transmittedIndex;
  output.length = outputIndex;

  return { transmitted, output };
}
