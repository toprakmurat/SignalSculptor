import { useState } from 'react';
import { SignalChart } from './SignalChart';
import { generateAnalogToDigitalSignal } from '../utils/analogToDigital';
import { AnalogToDigitalAlgorithm, SignalData } from '../types';
import { Play } from 'lucide-react';

export function AnalogToDigitalMode() {
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(1);
  const [algorithm, setAlgorithm] = useState<AnalogToDigitalAlgorithm>('PCM');
  const [signalData, setSignalData] = useState<SignalData | null>(null);

  const algorithms: AnalogToDigitalAlgorithm[] = ['PCM', 'Delta Modulation'];

  const handleSimulate = () => {
    const data = generateAnalogToDigitalSignal(frequency, amplitude, algorithm);
    setSignalData(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Analog-to-Digital Conversion</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency (Hz): {frequency}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amplitude: {amplitude.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AnalogToDigitalAlgorithm)}
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
          <strong>Algorithm:</strong> {algorithm} |{' '}
          <strong>Sampling Rate:</strong> {algorithm === 'PCM' ? `${frequency * 4} Hz` : `${frequency * 8} Hz`}
        </div>
      </div>

      {signalData && (
        <div className="space-y-4">
          <SignalChart
            data={signalData.input}
            title="Input Signal - Analog Waveform"
            color="#10b981"
          />
          <SignalChart
            data={signalData.transmitted}
            title={`Transmitted Signal - ${algorithm} Digital Stream`}
            color="#3b82f6"
            isDigital={true}
          />
          <SignalChart
            data={signalData.output}
            title="Output Signal - Reconstructed Analog"
            color="#f59e0b"
          />
        </div>
      )}
    </div>
  );
}
