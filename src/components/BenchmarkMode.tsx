import React, { useState } from 'react';
import { Play, Download } from 'lucide-react';
import { generateDigitalToDigitalSignal } from '../utils/digitalToDigital';
import { generateDigitalToAnalogSignal } from '../utils/digitalToAnalog';
import { generateAnalogToAnalogSignal } from '../utils/analogToAnalog';
import { DigitalToDigitalAlgorithm, DigitalToAnalogAlgorithm, AnalogToAnalogAlgorithm } from '../types';

// Helper to generate random binary string
const generateBinaryString = (length: number): string => {
    return Array(length).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
};

interface BenchmarkResult {
    inputType: string;
    inputSize: number;
    algorithm: string;
    durationMs: number;
    memoryUsedBytes?: number;
    dataPointsCount: number;
    timestamp: string;
}

export const BenchmarkMode = () => {
    const [results, setResults] = useState<BenchmarkResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState('');

    const runBenchmark = async () => {
        setIsRunning(true);
        setResults([]);

        // Test Configurations
        const inputSizes = [1000, 5000, 10000, 50000]; // Small to Large

        const digitalToDigitalAlgorithms: DigitalToDigitalAlgorithm[] = [
            'NRZ-L', 'NRZ-I', 'Manchester', 'Differential Manchester',
            'AMI', 'Pseudoternary', 'B8ZS', 'HDB3'
        ];

        const digitalToAnalogAlgorithms: DigitalToAnalogAlgorithm[] = [
            'ASK', 'FSK', 'PSK'
        ];

        const analogToAnalogAlgorithms: AnalogToAnalogAlgorithm[] = [
            'AM', 'FM', 'PM'
        ];

        const newResults: BenchmarkResult[] = [];

        try {
            // 1. Digital to Digital
            for (const size of inputSizes) {
                const input = generateBinaryString(size);

                for (const algo of digitalToDigitalAlgorithms) {
                    setProgress(`Testing ${algo} with ${size} bits...`);
                    // Yield to UI
                    await new Promise(r => setTimeout(r, 0));

                    const startTime = performance.now();
                    const response = await generateDigitalToDigitalSignal(input, algo);
                    const endTime = performance.now();
                    const duration = endTime - startTime;

                    const resultSize = new Blob([JSON.stringify(response)]).size;

                    const result: BenchmarkResult = {
                        inputType: 'Binary String',
                        inputSize: size,
                        algorithm: algo,
                        durationMs: duration,
                        memoryUsedBytes: resultSize,
                        dataPointsCount: response.output.length,
                        timestamp: new Date().toISOString()
                    };

                    newResults.push(result);
                    setResults(prev => [...prev, result]);
                }
            }

            // 2. Digital to Analog
            for (const size of inputSizes) {
                const input = generateBinaryString(size);

                for (const algo of digitalToAnalogAlgorithms) {
                    setProgress(`Testing ${algo} with ${size} bits...`);
                    await new Promise(r => setTimeout(r, 0));

                    const startTime = performance.now();
                    const response = await generateDigitalToAnalogSignal(input, algo);
                    const endTime = performance.now();
                    const duration = endTime - startTime;

                    const resultSize = new Blob([JSON.stringify(response)]).size;

                    const result: BenchmarkResult = {
                        inputType: 'Binary String',
                        inputSize: size,
                        algorithm: algo,
                        durationMs: duration,
                        memoryUsedBytes: resultSize,
                        dataPointsCount: response.output.length,
                        timestamp: new Date().toISOString()
                    };

                    newResults.push(result);
                    setResults(prev => [...prev, result]);
                }
            }

            // 3. Analog to Analog
            for (const size of inputSizes) {
                // Analog functions typically take fixed parameters, but we test them across "sizes" 
                // to maintain consistent reporting structure, even if load might not scale linearly 
                // with this 'size' parameter in the current implementation.

                for (const algo of analogToAnalogAlgorithms) {
                    setProgress(`Testing ${algo} with ${size} factor...`);
                    await new Promise(r => setTimeout(r, 0));

                    const startTime = performance.now();
                    // Using fixed frequency/amplitude as the generator doesn't accept 'size'
                    const response = await generateAnalogToAnalogSignal(5, 1, algo);
                    const endTime = performance.now();
                    const duration = endTime - startTime;

                    const resultSize = new Blob([JSON.stringify(response)]).size;

                    const result: BenchmarkResult = {
                        inputType: 'Analog Signal',
                        inputSize: size, // Nominal size for comparison
                        algorithm: algo,
                        durationMs: duration,
                        memoryUsedBytes: resultSize,
                        dataPointsCount: response.output.length,
                        timestamp: new Date().toISOString()
                    };

                    newResults.push(result);
                    setResults(prev => [...prev, result]);
                }
            }

        } catch (error) {
            console.error("Benchmark error:", error);
            setProgress(`Error: ${error}`);
        } finally {
            setIsRunning(false);
            setProgress('Benchmark Complete');
        }
    };

    const downloadReport = () => {
        const json = JSON.stringify(results, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `benchmark_report_${new Date().getTime()}.json`;
        a.click();
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Performance Benchmark</h2>
                    <p className="text-gray-600">Measure execution time and memory usage for signal processing algorithms.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={runBenchmark}
                        disabled={isRunning}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-colors ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        <Play size={20} />
                        {isRunning ? 'Running Tests...' : 'Start Benchmark'}
                    </button>

                    {results.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <Download size={20} />
                            Export JSON
                        </button>
                    )}
                </div>
            </div>

            {progress && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm font-medium">
                    Status: {progress}
                </div>
            )}

            {results.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Algorithm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Size</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (ms)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Points</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result Size</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((r, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.algorithm}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.inputType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.inputSize}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.durationMs.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.dataPointsCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.memoryUsedBytes !== undefined ? `${(r.memoryUsedBytes / 1024).toFixed(2)} KB` : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
