import { DataPoint, DigitalToDigitalAlgorithm } from '../types';
import { grpcClient } from '../api/grpc_client';
import { DigitalToDigitalRequest, DigitalToDigitalRequest_Algorithm } from '../generated/signal';

export async function generateDigitalToDigitalSignal(
  binaryInput: string,
  algorithm: DigitalToDigitalAlgorithm,
  startBit?: number,
  endBit?: number
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] }> {
  let algo = DigitalToDigitalRequest_Algorithm.NRZ_L;
  switch (algorithm) {
    case 'NRZ-L': algo = DigitalToDigitalRequest_Algorithm.NRZ_L; break;
    case 'NRZ-I': algo = DigitalToDigitalRequest_Algorithm.NRZ_I; break;
    case 'Manchester': algo = DigitalToDigitalRequest_Algorithm.MANCHESTER; break;
    case 'Differential Manchester': algo = DigitalToDigitalRequest_Algorithm.DIFFERENTIAL_MANCHESTER; break;
    case 'AMI': algo = DigitalToDigitalRequest_Algorithm.AMI; break;
    case 'Pseudoternary': algo = DigitalToDigitalRequest_Algorithm.PSEUDOTERNARY; break;
    case 'B8ZS': algo = DigitalToDigitalRequest_Algorithm.B8ZS; break;
    case 'HDB3': algo = DigitalToDigitalRequest_Algorithm.HDB3; break;
  }

  const request: DigitalToDigitalRequest = {
    binaryInput,
    algorithm: algo
  };

  const response = await grpcClient.digitalToDigital(request);

  return {
    input: response.input,
    transmitted: response.transmitted,
    output: response.output
  };
}

