import { BarChart } from 'lucide-react';

export function BenchmarkSection() {
  const benchmarkData = [
    {
      algorithm: 'NRZ-L',
      runtime: '0.45 ms',
      memory: '2.1 MB',
      complexity: 'O(n)',
      aiOptimized: 'Yes',
    },
    {
      algorithm: 'Manchester',
      runtime: '0.68 ms',
      memory: '3.2 MB',
      complexity: 'O(2n)',
      aiOptimized: 'Yes',
    },
    {
      algorithm: 'ASK',
      runtime: '1.23 ms',
      memory: '4.5 MB',
      complexity: 'O(n·m)',
      aiOptimized: 'No',
    },
    {
      algorithm: 'FSK',
      runtime: '1.31 ms',
      memory: '4.8 MB',
      complexity: 'O(n·m)',
      aiOptimized: 'No',
    },
    {
      algorithm: 'PCM',
      runtime: '2.15 ms',
      memory: '6.2 MB',
      complexity: 'O(n·log k)',
      aiOptimized: 'Yes',
    },
    {
      algorithm: 'AM',
      runtime: '1.87 ms',
      memory: '5.4 MB',
      complexity: 'O(n·m)',
      aiOptimized: 'No',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Performance Benchmark</h2>
        </div>

        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This table displays simulated performance metrics comparing
            traditional implementations vs. AI-optimized algorithms. Runtime and memory usage are
            measured for processing 1000 bits/samples.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left p-3 font-semibold text-gray-700">Algorithm</th>
                <th className="text-left p-3 font-semibold text-gray-700">Runtime</th>
                <th className="text-left p-3 font-semibold text-gray-700">Memory Usage</th>
                <th className="text-left p-3 font-semibold text-gray-700">Time Complexity</th>
                <th className="text-left p-3 font-semibold text-gray-700">AI Optimized</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 font-medium text-gray-800">{row.algorithm}</td>
                  <td className="p-3 text-gray-600">{row.runtime}</td>
                  <td className="p-3 text-gray-600">{row.memory}</td>
                  <td className="p-3 text-gray-600 font-mono text-sm">{row.complexity}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.aiOptimized === 'Yes'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {row.aiOptimized}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Digital Encoding</h3>
            <p className="text-sm text-gray-700">
              Line coding schemes show linear time complexity with minimal memory overhead.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Modulation Techniques</h3>
            <p className="text-sm text-gray-700">
              Carrier-based modulation requires more computation due to waveform generation.
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">AI Optimization</h3>
            <p className="text-sm text-gray-700">
              Machine learning models can optimize sampling rates and quantization levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
