export type SimulationMode = 'digital-to-digital' | 'digital-to-analog' | 'analog-to-digital' | 'analog-to-analog';

export type DigitalToDigitalAlgorithm = 'NRZ-L' | 'NRZ-I' | 'Manchester' | 'Differential Manchester' | 'AMI' | 'Pseudoternary' | 'B8ZS' | 'HDB3';
export type DigitalToAnalogAlgorithm = 'ASK' | 'FSK' | 'PSK';
export type AnalogToDigitalAlgorithm = 'PCM' | 'Delta Modulation';
export type AnalogToAnalogAlgorithm = 'AM' | 'FM' | 'PM';

export interface DataPoint {
  x: number;
  y: number;
}

export interface SignalData {
  input: DataPoint[];
  transmitted: DataPoint[];
  output: DataPoint[];
  totalBits?: number; // Total number of bits for lazy loading
}

/**
 * Configuration for viewport-based rendering
 */
export interface ViewportConfig {
  startBit: number;
  endBit: number;
  windowSize: number; // Number of bits to show at once
}

export interface PCMConfig {
  samplingRate: number;
  quantizationLevels: number;
}

export interface DeltaModulationConfig {
  samplingRate: number;
  deltaStepSize: number;
}

export interface AnalogToDigitalConfig {
  algorithm: AnalogToDigitalAlgorithm;
  pcm?: PCMConfig;
  deltaModulation?: DeltaModulationConfig;
}
