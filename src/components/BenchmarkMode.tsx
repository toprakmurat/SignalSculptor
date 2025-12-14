
import { useState } from 'react';
import { Play, RotateCcw, Download, Trash2 } from 'lucide-react';
import { runBenchmarks, BenchmarkResult } from '../utils/benchmark';

export function BenchmarkMode() {
    const [results, setResults] = useState<BenchmarkResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progressMsg, setProgressMsg] = useState("");

    const handleRunBenchmark = async () => {
        setIsRunning(true);
        setResults([]);
        setProgressMsg("Starting...");

        try {
            await runBenchmarks(
                (result) => {
                    setResults(prev => [...prev, result]);
                },
                (msg) => {
                    setProgressMsg(msg);
                }
            );
        } catch (error) {
            console.error("Benchmark failed:", error);
            setProgressMsg("Failed");
        } finally {
            setIsRunning(false);
        }
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(results, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `benchmark_report_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatMemory = (bytes: number) => {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Comprehensive Benchmark</h2>
                        <p className="text-gray-600 mt-1">
                            Test all algorithms from small to large inputs.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {results.length > 0 && (
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all border border-blue-200"
                            >
                                <Download size={18} />
                                Report
                            </button>
                        )}
                        <button
                            onClick={handleRunBenchmark}
                            disabled={isRunning}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-white transition-all ${isRunning
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {isRunning ? (
                                <>
                                    <RotateCcw className="animate-spin" size={20} />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play size={20} />
                                    Run All
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {isRunning && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm font-medium animate-pulse border border-blue-100">
                        {progressMsg}
                    </div>
                )}

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                        <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                            <tr className="text-left font-semibold text-gray-700 border-b border-gray-200">
                                <th className="p-3 border-r border-gray-200">Algorithm</th>
                                <th className="p-3 border-r border-gray-200">Category</th>
                                <th className="p-3 border-r border-gray-200">Input Size</th>
                                <th className="p-3 border-r border-gray-200">Time</th>
                                <th className="p-3 border-r border-gray-200">Memory (Blob)</th>
                                <th className="p-3">Data Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 italic">
                                        No results. Run the benchmark to generate data.
                                    </td>
                                </tr>
                            ) : (
                                results.map((result, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 border-r border-gray-200 font-medium text-gray-800">{result.algorithm}</td>
                                        <td className="p-3 border-r border-gray-200 text-gray-500 text-xs">{result.category}</td>
                                        <td className="p-3 border-r border-gray-200 font-mono">{result.inputSize.toLocaleString()}</td>
                                        <td className="p-3 border-r border-gray-200 font-mono font-bold text-blue-700">
                                            {result.timeMs.toFixed(3)} ms
                                        </td>
                                        <td className="p-3 border-r border-gray-200 font-mono text-xs text-gray-700">
                                            {formatMemory(result.memoryUsedBytes)}
                                        </td>
                                        <td className="p-3 font-mono text-gray-600">
                                            {result.dataPointsCount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
