import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SignalChart } from './SignalChart';
import { generateAnalogToAnalogSignal } from '../utils/analogToAnalog';
import { AnalogToAnalogAlgorithm, SignalData } from '../types';
import { Play } from 'lucide-react';

/**
 * Analog-to-Analog Modulation Mode Component
 * 
 * Provides UI for simulating AM, FM, and PM carrier modulation techniques.
 * Optimized with debouncing to prevent recalculation on every slider movement.
 */
export function AnalogToAnalogMode() {
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(1);
  const [algorithm, setAlgorithm] = useState<AnalogToAnalogAlgorithm>('AM');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer ref to prevent excessive recalculations
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const algorithms: AnalogToAnalogAlgorithm[] = ['AM', 'FM', 'PM'];

  /**
   * Generates signal data with error handling
   */
  const generateSignal = useCallback(() => {
    try {
      // Validate inputs
      if (frequency <= 0 || frequency > 10) {
        throw new Error('Frequency must be between 0.5 and 10 Hz');
      }
      if (amplitude <= 0 || amplitude > 5) {
        throw new Error('Amplitude must be between 0.5 and 5');
      }
      
      const data = generateAnalogToAnalogSignal(frequency, amplitude, algorithm);
      setSignalData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate signal';
      setError(errorMessage);
      console.error('Signal generation error:', err);
    }
  }, [frequency, amplitude, algorithm]);

  const handleSimulate = useCallback(() => {
    generateSignal();
  }, [generateSignal]);

  // Debounced auto-regenerate signal when parameters change (if valid data exists)
  // Only recalculates after user stops adjusting sliders for 300ms
  useEffect(() => {
    if (signalData) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer for debounced recalculation
      debounceTimerRef.current = setTimeout(() => {
        generateSignal();
      }, 300);
      
      // Cleanup on unmount or dependency change
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [algorithm, frequency, amplitude, signalData, generateSignal]);

  /**
   * Memoized carrier frequency calculation
   */
  const carrierFrequency = useMemo(() => frequency * 5, [frequency]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Analog-to-Analog Modulation</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Frequency (Hz): {frequency}
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
              Message Amplitude: {amplitude.toFixed(1)}
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
              Modulation Technique
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AnalogToAnalogAlgorithm)}
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
          <strong>Technique:</strong> {algorithm} (
          {algorithm === 'AM' && 'Amplitude Modulation'}
          {algorithm === 'FM' && 'Frequency Modulation'}
          {algorithm === 'PM' && 'Phase Modulation'}) |{' '}
          <strong>Carrier Frequency:</strong> {carrierFrequency} Hz
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 mt-4">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {signalData && (
        <div className="space-y-4">
          <SignalChart
            data={signalData.input}
            title="Input Signal - Baseband Message Signal m(t)"
            color="#10b981"
          />
          <SignalChart
            data={signalData.transmitted}
            title={`Transmitted Signal - ${algorithm} Modulated Carrier s(t)`}
            color="#3b82f6"
          />
          <SignalChart
            data={signalData.output}
            title="Output Signal - Demodulated Message"
            color="#f59e0b"
          />
        </div>
      )}
    </div>
  );
}
