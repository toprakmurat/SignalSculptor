import { DataPoint, AnalogToDigitalConfig } from '../types';
import { analogToDigitalPCMWasm, analogToDigitalDMWasm } from '../api/wasm_client';

export async function generateAnalogToDigitalSignal(
  frequency: number,
  amplitude: number,
  config: AnalogToDigitalConfig,
  inputSignal?: DataPoint[]
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] }> {

  if (config.algorithm === 'PCM' && config.pcm) {
    return await analogToDigitalPCMWasm(frequency, amplitude, config.pcm);
  } else if (config.algorithm === 'Delta Modulation' && config.deltaModulation) {
    return await analogToDigitalDMWasm(frequency, amplitude, config.deltaModulation);
  }

  // Fallback / Error case
  return { input: [], transmitted: [], output: [] };
}
