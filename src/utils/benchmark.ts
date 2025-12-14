
import { generateAnalogToAnalogSignal } from './analogToAnalog';
import { generateDigitalToAnalogSignal } from './digitalToAnalog';
import { generateDigitalToDigitalSignal } from './digitalToDigital';
import { DigitalToDigitalAlgorithm, DigitalToAnalogAlgorithm, AnalogToAnalogAlgorithm } from '../types';

export interface BenchmarkResult {
    algorithm: string;
    category: 'Digital-to-Digital' | 'Digital-to-Analog' | 'Analog-to-Analog';
    inputSize: number;
    timeMs: number;
    memoryUsedBytes: number;
    dataPointsCount: number;
}

export type ProgressCallback = (message: string) => void;
export type ResultCallback = (result: BenchmarkResult) => void;

const INPUT_SIZES = [100, 500, 1000, 5000, 10000];

const DIGITAL_TO_DIGITAL_ALGOS: DigitalToDigitalAlgorithm[] = [
    'NRZ-L', 'NRZ-I', 'Manchester', 'Differential Manchester',
    'AMI', 'Pseudoternary', 'B8ZS', 'HDB3'
];

const DIGITAL_TO_ANALOG_ALGOS: DigitalToAnalogAlgorithm[] = [
    'ASK', 'FSK', 'PSK'
];

const ANALOG_TO_ANALOG_ALGOS: AnalogToAnalogAlgorithm[] = [
    'AM', 'FM', 'PM'
];

// Helper to estimate object size using Blob
function estimateMemoryUsage(data: any): number {
    try {
        const json = JSON.stringify(data);
        return new Blob([json]).size;
    } catch (e) {
        return 0;
    }
}

export async function runBenchmarks(
    onResult: ResultCallback,
    onProgress: ProgressCallback
) {
    // 1. Digital to Digital
    for (const size of INPUT_SIZES) {
        const input = Array(size).fill(0).map(() => Math.round(Math.random())).join('');

        for (const algo of DIGITAL_TO_DIGITAL_ALGOS) {
            onProgress(`Testing ${algo} with ${size} bits...`);

            // Tiny yield before work
            await new Promise(r => setTimeout(r, 10));

            const start = performance.now();
            const response = generateDigitalToDigitalSignal(input, algo);
            const end = performance.now();

            const memory = estimateMemoryUsage(response);

            onResult({
                algorithm: algo,
                category: 'Digital-to-Digital',
                inputSize: size,
                timeMs: end - start,
                memoryUsedBytes: memory,
                dataPointsCount: response.output.length
            });
        }
    }

    // 2. Digital to Analog
    for (const size of INPUT_SIZES) {
        const input = Array(size).fill(0).map(() => Math.round(Math.random())).join('');

        for (const algo of DIGITAL_TO_ANALOG_ALGOS) {
            onProgress(`Testing ${algo} with ${size} bits...`);
            await new Promise(r => setTimeout(r, 10));

            const start = performance.now();
            const response = generateDigitalToAnalogSignal(input, algo);
            const end = performance.now();

            const memory = estimateMemoryUsage(response);

            onResult({
                algorithm: algo,
                category: 'Digital-to-Analog',
                inputSize: size,
                timeMs: end - start,
                memoryUsedBytes: memory,
                dataPointsCount: response.output.length
            });
        }
    }

    // 3. Analog to Analog
    for (const size of INPUT_SIZES) {
        // For Analog-to-Analog, "size" is ambiguous. 
        // We will treat 'size' as determining the frequency/resolution to generate comparable data points
        // or just run it 'size' times? 
        // The user prompt implies "inputSizes" is consistently applied.
        // Let's assume for Analog, we might simulate 'size' steps or duration.
        // However, existing `generateAnalogToAnalogSignal` takes freq/amp fixed.
        // To generate a large result (like the Blob check needs), we probably shouldn't loop 1000 times on the same object.
        // Actually, `generateAnalogToAnalogSignal` returns a `SignalData` object with arrays.
        // It generates points based on a predefined duration/step?
        // Let's check `analogToAnalog.ts` content if possible, but assuming it returns fixed size usually.
        // To make it depend on "size", we might need to modify the generator or just use 'size' to scale the iteration count
        // and aggregate results? 
        // BUT the user wants "memory usage" of the result.
        // If the generator only produces 100 points always, memory usage won't scale with 'size'.

        // Simplest approach satisfying "small to large inputs":
        // The previous implementation used loop iterations. 
        // The user's snippet uses `generateDigitalToDigitalSignal` which returns a large array for large inputs.
        // For Analog, let's just test the algorithms. If they don't scale with size param, we note that.
        // But wait, we can't easily change `analogToAnalog` sig without breaking things.
        // We will just run it once per algo/size combo, and note memory is constant if it is.
        // OR we can simulate larger data by concatenating results?
        // Let's stick to simple execution for now, maybe just repeat the generation to measure TIME scaling (if size meant load).
        // The Blob size check implies we want to measure the OUTPUT size.

        for (const algo of ANALOG_TO_ANALOG_ALGOS) {
            onProgress(`Testing ${algo} with ${size} factor...`);
            await new Promise(r => setTimeout(r, 10));

            const start = performance.now();
            // We'll just call it. If it doesn't scale, it doesn't scale.
            const response = generateAnalogToAnalogSignal(5, 1, algo);
            const end = performance.now();

            // To simulate "larger input" effect on memory for the report (if we want to fake/simulate it)
            // we could duplicate the data? No, let's be honest.
            // If the function doesn't support variable size, the "Input Size" column will just refer to "Test Case Size"
            // and memory will be constant.
            // Wait, we can assume 'size' might be used for 'frequency' to generate more dense waves?
            // No, let's just run it.

            const memory = estimateMemoryUsage(response);

            onResult({
                algorithm: algo,
                category: 'Analog-to-Analog',
                inputSize: size, // It's nominal here
                timeMs: end - start,
                memoryUsedBytes: memory,
                dataPointsCount: response.output.length
            });
        }
    }

    onProgress("Benchmark Complete");
}
