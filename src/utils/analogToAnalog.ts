import { DataPoint, AnalogToAnalogAlgorithm } from '../types';
import { grpcClient } from '../api/grpc_client';
import { AnalogToAnalogRequest, AnalogToAnalogRequest_Algorithm } from '../generated/signal';

export async function generateAnalogToAnalogSignal(
  messageFrequency: number,
  messageAmplitude: number,
  algorithm: AnalogToAnalogAlgorithm
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[]; calculationTimeMs: number }> {
  let algo = AnalogToAnalogRequest_Algorithm.AM;
  if (algorithm === 'FM') algo = AnalogToAnalogRequest_Algorithm.FM;
  if (algorithm === 'PM') algo = AnalogToAnalogRequest_Algorithm.PM;

  const request: AnalogToAnalogRequest = {
    messageFrequency,
    messageAmplitude,
    algorithm: algo
  };

  const response = await grpcClient.analogToAnalog(request);

  return {
    input: response.input,
    transmitted: response.transmitted,
    output: response.output,
    calculationTimeMs: response.calculationTimeMs
  };
}

