import { DataPoint, DigitalToAnalogAlgorithm } from '../types';
import { digitalToAnalogWasm } from '../api/wasm_client';

export async function generateDigitalToAnalogSignal(
  binaryInput: string,
  algorithm: DigitalToAnalogAlgorithm,
  startBit?: number,
  endBit?: number
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[]; calculationTimeMs: number }> {
  return await digitalToAnalogWasm(binaryInput, algorithm);
}
