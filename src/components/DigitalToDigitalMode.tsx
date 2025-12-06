import { useState } from 'react';
import { SignalChart } from './SignalChart';
import { generateDigitalToDigitalSignal } from '../utils/digitalToDigital';
import { DigitalToDigitalAlgorithm, SignalData } from '../types';
import { Play } from 'lucide-react';

export function DigitalToDigitalMode() {
  const [binaryInput, setBinaryInput] = useState('10110');
  const [algorithm, setAlgorithm] = useState<DigitalToDigitalAlgorithm>('NRZ-L');
  const [signalData, setSignalData] = useState<SignalData | null>(null);

  const algorithms: DigitalToDigitalAlgorithm[] = [
    'NRZ-L',
    'NRZ-I',
    'Manchester',
    'Differential Manchester',
    'AMI',
  ];

  const handleSimulate = () => {
    if (!/^[01]+$/.test(binaryInput)) {
      alert('Please enter a valid binary string (only 0s and 1s)');
      return;
    }
    const data = generateDigitalToDigitalSignal(binaryInput, algorithm);
    setSignalData(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Digital-to-Digital Encoding</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Binary Input
            </label>
            <input
              type="text"
              value={binaryInput}
              onChange={(e) => setBinaryInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10110"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encoding Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as DigitalToDigitalAlgorithm)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {algorithms.map((alg) => (
                <option key={alg} value={alg}>
                  {alg}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={18} />
              Simulate
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-gray-700">
          <strong>Algorithm:</strong> {algorithm} | <strong>Input:</strong> {binaryInput}
        </div>
      </div>

      {signalData && (
        <div className="space-y-4">
          <SignalChart
            data={signalData.input}
            title="Input Signal - Digital Bits"
            color="#10b981"
            domain={[-0.5, 1.5]}
            isDigital={true}
          />
          <SignalChart
            data={signalData.transmitted}
            title={`Transmitted Signal - ${algorithm} Encoding`}
            color="#3b82f6"
            domain={[-1.5, 1.5]}
          />
          <SignalChart
            data={signalData.output}
            title="Output Signal - Decoded Bits"
            color="#f59e0b"
            domain={[-0.5, 1.5]}
            isDigital={true}
          />
        </div>
      )}
    </div>
  );
}
