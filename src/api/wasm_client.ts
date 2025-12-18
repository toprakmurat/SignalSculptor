import { 
    DataPoint, 
    AnalogToAnalogAlgorithm, 
    DigitalToAnalogAlgorithm, 
    DigitalToDigitalAlgorithm,
    PCMConfig,
    DeltaModulationConfig
} from '../types';

// @ts-ignore
import createSignalModule from './wasm/signal_lib.js';

let wasmModule: any = null;
let moduleLoading: Promise<void> | null = null;

export async function ensureModuleLoaded() {
    if (wasmModule) return;
    if (moduleLoading) {
        await moduleLoading;
        return;
    }

    moduleLoading = (async () => {
        try {
            wasmModule = await createSignalModule({
                locateFile: (path: string) => {
                    if (path.endsWith('.wasm')) {
                        return '/wasm/signal_lib.wasm';
                    }
                    return path;
                }
            });
        } catch (e) {
            console.error("Failed to load WASM module", e);
            moduleLoading = null;
            throw e;
        }
    })();
    await moduleLoading;
}

function mapPoints(vectorPoint: any): DataPoint[] {
    const result: DataPoint[] = [];
    const size = vectorPoint.size();
    for (let i = 0; i < size; i++) {
        const p = vectorPoint.get(i);
        result.push({ x: p.x, y: p.y });
    }
    // Clean up the C++ vector object to prevent memory leaks in WASM heap
    vectorPoint.delete();
    return result;
}

export async function analogToAnalogWasm(
    freq: number, 
    amp: number, 
    algo: AnalogToAnalogAlgorithm
): Promise<{ input: DataPoint[], transmitted: DataPoint[], output: DataPoint[], calculationTimeMs: number }> {
    await ensureModuleLoaded();
    
    const algoEnum = wasmModule.AnalogModulation[algo];
    const result = wasmModule.AnalogToAnalog(freq, amp, algoEnum);
    
    const input = mapPoints(result.input);
    const transmitted = mapPoints(result.transmitted);
    const output = mapPoints(result.output);
    const calculationTimeMs = result.calculation_time_ms;
    
    return { input, transmitted, output, calculationTimeMs };
}

export async function analogToDigitalPCMWasm(
    freq: number,
    amp: number,
    config: PCMConfig
): Promise<{ input: DataPoint[], transmitted: DataPoint[], output: DataPoint[], calculationTimeMs: number }> {
    await ensureModuleLoaded();

    const pcmConfig = {
        sampling_rate: config.samplingRate,
        quantization_levels: config.quantizationLevels
    };

    const result = wasmModule.AnalogToDigitalPCM(freq, amp, pcmConfig);
    
    const input = mapPoints(result.input);
    const transmitted = mapPoints(result.transmitted);
    const output = mapPoints(result.output);
    const calculationTimeMs = result.calculation_time_ms;
    
    return { input, transmitted, output, calculationTimeMs };
}

export async function analogToDigitalDMWasm(
    freq: number,
    amp: number,
    config: DeltaModulationConfig
): Promise<{ input: DataPoint[], transmitted: DataPoint[], output: DataPoint[], calculationTimeMs: number }> {
    await ensureModuleLoaded();

    const dmConfig = {
        sampling_rate: config.samplingRate,
        delta_step_size: config.deltaStepSize
    };

    const result = wasmModule.AnalogToDigitalDM(freq, amp, dmConfig);
    
    const input = mapPoints(result.input);
    const transmitted = mapPoints(result.transmitted);
    const output = mapPoints(result.output);
    const calculationTimeMs = result.calculation_time_ms;
    
    return { input, transmitted, output, calculationTimeMs };
}

export async function digitalToAnalogWasm(
    binary: string,
    algo: DigitalToAnalogAlgorithm
): Promise<{ input: DataPoint[], transmitted: DataPoint[], output: DataPoint[], calculationTimeMs: number }> {
    await ensureModuleLoaded();

    const algoEnum = wasmModule.DigitalModulation[algo];
    const result = wasmModule.DigitalToAnalog(binary, algoEnum);

    const input = mapPoints(result.input);
    const transmitted = mapPoints(result.transmitted);
    const output = mapPoints(result.output);
    const calculationTimeMs = result.calculation_time_ms;
    
    return { input, transmitted, output, calculationTimeMs };
}

export async function digitalToDigitalWasm(
    binary: string,
    algo: DigitalToDigitalAlgorithm
): Promise<{ input: DataPoint[], transmitted: DataPoint[], output: DataPoint[], calculationTimeMs: number }> {
    await ensureModuleLoaded();

    let algoEnumVal;
    switch(algo) {
        case 'NRZ-L': algoEnumVal = wasmModule.LineCoding.NRZ_L; break;
        case 'NRZ-I': algoEnumVal = wasmModule.LineCoding.NRZ_I; break;
        case 'Manchester': algoEnumVal = wasmModule.LineCoding.MANCHESTER; break;
        case 'Differential Manchester': algoEnumVal = wasmModule.LineCoding.DIFFERENTIAL_MANCHESTER; break;
        case 'AMI': algoEnumVal = wasmModule.LineCoding.AMI; break;
        case 'Pseudoternary': algoEnumVal = wasmModule.LineCoding.PSEUDOTERNARY; break;
        case 'B8ZS': algoEnumVal = wasmModule.LineCoding.B8ZS; break;
        case 'HDB3': algoEnumVal = wasmModule.LineCoding.HDB3; break;
        default: throw new Error(`Unknown algorithm: ${algo}`);
    }

    const result = wasmModule.DigitalToDigital(binary, algoEnumVal);

    const input = mapPoints(result.input);
    const transmitted = mapPoints(result.transmitted);
    const output = mapPoints(result.output);
    const calculationTimeMs = result.calculation_time_ms;
    
    return { input, transmitted, output, calculationTimeMs };
}
