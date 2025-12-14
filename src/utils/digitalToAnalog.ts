import { DataPoint, DigitalToAnalogAlgorithm } from '../types';
import { grpcClient } from '../api/grpc_client';
import { DigitalToAnalogRequest, DigitalToAnalogRequest_Algorithm } from '../generated/signal';

export async function generateDigitalToAnalogSignal(
  binaryInput: string,
  algorithm: DigitalToAnalogAlgorithm,
  startBit?: number,
  endBit?: number
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[]; calculationTimeMs: number }> {
  let algo = DigitalToAnalogRequest_Algorithm.ASK;
  if (algorithm === 'FSK') algo = DigitalToAnalogRequest_Algorithm.FSK;
  if (algorithm === 'PSK') algo = DigitalToAnalogRequest_Algorithm.PSK;

  const request: DigitalToAnalogRequest = {
    binaryInput,
    algorithm: algo
  };

  const response = await grpcClient.digitalToAnalog(request);

  return {
    input: response.input,
    transmitted: response.transmitted,
    output: response.output,
    calculationTimeMs: response.calculationTimeMs
  };
}

