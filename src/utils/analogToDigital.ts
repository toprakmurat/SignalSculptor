import { DataPoint, AnalogToDigitalConfig, PCMConfig, DeltaModulationConfig } from '../types';
import { grpcClient } from '../api/grpc_client';
import { AnalogToDigitalRequest, AnalogToDigitalRequest_PCMConfig, AnalogToDigitalRequest_DeltaModulationConfig } from '../generated/signal';

export async function generateAnalogToDigitalSignal(
  frequency: number,
  amplitude: number,
  config: AnalogToDigitalConfig,
  inputSignal?: DataPoint[]
): Promise<{ input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] }> {

  let pcmConfig: AnalogToDigitalRequest_PCMConfig | undefined;
  let deltaConfig: AnalogToDigitalRequest_DeltaModulationConfig | undefined;

  if (config.algorithm === 'PCM' && config.pcm) {
    pcmConfig = {
      samplingRate: config.pcm.samplingRate,
      quantizationLevels: config.pcm.quantizationLevels
    };
  } else if (config.algorithm === 'Delta Modulation' && config.deltaModulation) {
    deltaConfig = {
      samplingRate: config.deltaModulation.samplingRate,
      deltaStepSize: config.deltaModulation.deltaStepSize
    };
  }

  const request: AnalogToDigitalRequest = {
    frequency,
    amplitude,
    pcm: pcmConfig,
    deltaModulation: deltaConfig
  };

  const response = await grpcClient.analogToDigital(request);

  return {
    input: response.input,
    transmitted: response.transmitted,
    output: response.output
  };
}

