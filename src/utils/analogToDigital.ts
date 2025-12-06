import { DataPoint, AnalogToDigitalConfig, PCMConfig, DeltaModulationConfig } from '../types';

// Helper function to get input value at exact time (with linear interpolation)
function getInputValueAtTime(inputSignal: DataPoint[], time: number): number {
  if (inputSignal.length === 0) return 0;
  
  // Find the two points surrounding the target time
  for (let i = 0; i < inputSignal.length - 1; i++) {
    if (inputSignal[i].x <= time && inputSignal[i + 1].x >= time) {
      // Linear interpolation
      const t1 = inputSignal[i].x;
      const t2 = inputSignal[i + 1].x;
      const y1 = inputSignal[i].y;
      const y2 = inputSignal[i + 1].y;
      
      if (t2 === t1) return y1;
      
      const ratio = (time - t1) / (t2 - t1);
      return y1 + ratio * (y2 - y1);
    }
  }
  
  // If time is at or beyond the end, return last value
  if (time >= inputSignal[inputSignal.length - 1].x) {
    return inputSignal[inputSignal.length - 1].y;
  }
  
  // If time is before the start, return first value
  return inputSignal[0].y;
}

export function generateAnalogToDigitalSignal(
  frequency: number,
  amplitude: number,
  config: AnalogToDigitalConfig,
  inputSignal?: DataPoint[]
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const duration = 2;
  const samplesPerSecond = 100;
  const totalSamples = duration * samplesPerSecond;

  // Use provided input signal or generate default sine wave
  const input = inputSignal || (() => {
    const signal: DataPoint[] = [];
    for (let i = 0; i < totalSamples; i++) {
      const t = i / samplesPerSecond;
      const y = amplitude * Math.sin(2 * Math.PI * frequency * t);
      signal.push({ x: t, y });
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
      ({ transmitted: transmittedSignal, output: outputSignal } = generateDeltaModulation(
        input,
        amplitude,
        config.deltaModulation
      ));
      break;
  }

  return {
    input,
    transmitted: transmittedSignal,
    output: outputSignal,
  };
}

function generatePCM(
  inputSignal: DataPoint[],
  amplitude: number,
  config: PCMConfig
): { transmitted: DataPoint[]; output: DataPoint[] } {
  const transmitted: DataPoint[] = [];
  const output: DataPoint[] = [];

  const sampleInterval = 1 / config.samplingRate;
  const duration = inputSignal.length > 0 ? inputSignal[inputSignal.length - 1].x : 2;
  
  for (let i = 0; i * sampleInterval <= duration; i++) {
    const sampleTime = Math.round(i * sampleInterval * 1000000) / 1000000;
    
    // Interpolate or find the closest input value at this exact sample time
    const inputValue = getInputValueAtTime(inputSignal, sampleTime);
    
    const normalizedValue = (inputValue / amplitude + 1) / 2;
    const quantized = Math.round(normalizedValue * (config.quantizationLevels - 1));
    const reconstructedValue = (quantized / (config.quantizationLevels - 1)) * 2 - 1;
    const finalValue = reconstructedValue * amplitude;

    transmitted.push({ x: sampleTime, y: quantized });
    output.push({ x: sampleTime, y: finalValue });
  }

  return { transmitted, output };
}

function generateDeltaModulation(
  inputSignal: DataPoint[],
  amplitude: number,
  config: DeltaModulationConfig
): { transmitted: DataPoint[]; output: DataPoint[] } {
  const delta = amplitude * config.deltaStepSize;
  const transmitted: DataPoint[] = [];
  const output: DataPoint[] = [];

  const sampleInterval = 1 / config.samplingRate;
  const duration = inputSignal.length > 0 ? inputSignal[inputSignal.length - 1].x : 2;
  let approximation = 0;

  // Add initial point at t=0
  output.push({ x: 0, y: approximation });

  for (let i = 0; i * sampleInterval <= duration; i++) {
    const sampleTime = Math.round(i * sampleInterval * 1000000) / 1000000;
    
    // Get input value at exact sample time
    const inputValue = getInputValueAtTime(inputSignal, sampleTime);
    
    // Compare input with current approximation to determine bit
    const bit = inputValue > approximation ? 1 : 0;
    
    // Transmit the bit at the exact sample time
    transmitted.push({ x: sampleTime, y: bit });
    
    // Update approximation based on transmitted bit (receiver side)
    approximation += bit === 1 ? delta : -delta;
    
    // Clamp approximation to prevent excessive drift
    approximation = Math.max(-amplitude * 1.5, Math.min(amplitude * 1.5, approximation));
    
    // Add step transition: hold previous value until step time, then step to new value
    // This creates the staircase effect
    if (output.length > 0) {
      const prevY = output[output.length - 1].y;
      // Add point just before the step to hold previous value
      output.push({ x: sampleTime - 0.001, y: prevY });
    }
    
    // Add reconstructed output point at the new level at exact sample time
    output.push({ x: sampleTime, y: approximation });
  }

  // Extend the last value to the end of the signal
  if (output.length > 0 && inputSignal.length > 0) {
    const lastY = output[output.length - 1].y;
    const lastX = inputSignal[inputSignal.length - 1].x;
    output.push({ x: lastX, y: lastY });
  }

  return { transmitted, output };
}
