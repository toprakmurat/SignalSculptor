import { DataPoint, DigitalToDigitalAlgorithm } from '../types';
import { digitalToDigitalWasm } from '../api/wasm_client';

export async function generateDigitalToDigitalSignal(
  binaryInput: string,
  algorithm: DigitalToDigitalAlgorithm,
  startBit?: number,
  endBit?: number
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[]; calculationTimeMs: number }> {
  return await digitalToDigitalWasm(binaryInput, algorithm);
}
