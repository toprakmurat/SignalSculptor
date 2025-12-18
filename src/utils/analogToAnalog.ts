import { DataPoint, AnalogToAnalogAlgorithm } from '../types';
import { analogToAnalogWasm } from '../api/wasm_client';

export async function generateAnalogToAnalogSignal(
  messageFrequency: number,
  messageAmplitude: number,
  algorithm: AnalogToAnalogAlgorithm
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[]; calculationTimeMs: number }> {
  return await analogToAnalogWasm(messageFrequency, messageAmplitude, algorithm);
}
