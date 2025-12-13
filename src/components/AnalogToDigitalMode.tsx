import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SignalChart } from './SignalChart';
import { generateAnalogToDigitalSignal } from '../utils/analogToDigital';
import { AnalogToDigitalAlgorithm, SignalData } from '../types';
import { Play, Lightbulb } from 'lucide-react';

/**
 * Analog-to-Digital Conversion Mode Component
 * 
 * Provides UI for simulating PCM and Delta Modulation conversion algorithms.
 * Optimized with debouncing to prevent recalculation on every input change.
 */
export function AnalogToDigitalMode() {
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(1);
  const [algorithm, setAlgorithm] = useState<AnalogToDigitalAlgorithm>('PCM');
  
  // PCM settings
  const [pcmSamplingRate, setPcmSamplingRate] = useState(10);
  const [quantizationLevels, setQuantizationLevels] = useState(16);
  
  // Delta Modulation settings
  const [dmSamplingRate, setDmSamplingRate] = useState(32);
  const [deltaStepSize, setDeltaStepSize] = useState(0.15);
  
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer ref to prevent excessive recalculations
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const algorithms: AnalogToDigitalAlgorithm[] = ['PCM', 'Delta Modulation'];

  /**
   * Generates optimal configuration based on current frequency and algorithm.
   * Uses Nyquist theorem: sampling rate should be at least 2x frequency.
   */
  const getOptimalConfig = useCallback(() => {
    try {
      if (algorithm === 'PCM') {
        // Nyquist: at least 2x frequency, recommend 4-5x for good quality
        const optimalSampling = Math.max(10, Math.round(frequency * 5));
        setPcmSamplingRate(optimalSampling);
        setQuantizationLevels(16); // 4-bit encoding, good balance
      } else {
        // Delta Modulation needs higher sampling rate, recommend 8-10x
        const optimalSampling = Math.max(20, Math.round(frequency * 10));
        setDmSamplingRate(optimalSampling);
        setDeltaStepSize(0.15); // 15% of amplitude is usually good
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set optimal configuration');
    }
  }, [algorithm, frequency]);
  
  // Update optimal config when frequency or algorithm changes
  useEffect(() => {
    getOptimalConfig();
  }, [getOptimalConfig]);

  /**
   * Memoized configuration object to avoid recreating on every render
   */
  const config = useMemo(() => {
    return algorithm === 'PCM'
      ? {
          algorithm,
          pcm: {
            samplingRate: pcmSamplingRate,
            quantizationLevels,
          },
        }
      : {
          algorithm,
          deltaModulation: {
            samplingRate: dmSamplingRate,
            deltaStepSize,
          },
        };
  }, [algorithm, pcmSamplingRate, quantizationLevels, dmSamplingRate, deltaStepSize]);

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
      if (algorithm === 'PCM' && (!config.pcm || config.pcm.samplingRate < 2 * frequency)) {
        throw new Error(`PCM sampling rate must be at least ${Math.ceil(2 * frequency)} Hz (Nyquist criterion)`);
      }
      if (algorithm === 'Delta Modulation' && (!config.deltaModulation || config.deltaModulation.samplingRate < 2 * frequency)) {
        throw new Error(`Delta Modulation sampling rate must be at least ${Math.ceil(2 * frequency)} Hz`);
      }

      const data = generateAnalogToDigitalSignal(frequency, amplitude, config);
      setSignalData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate signal';
      setError(errorMessage);
      console.error('Signal generation error:', err);
    }
  }, [frequency, amplitude, config, algorithm]);

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
  }, [algorithm, frequency, amplitude, pcmSamplingRate, quantizationLevels, dmSamplingRate, deltaStepSize, signalData, generateSignal]);

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

          <div className="flex items-end gap-2">
            <button
              onClick={getOptimalConfig}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
              title="Set optimal configuration based on frequency"
            >
              <Lightbulb size={18} />
              Optimal
            </button>
            <button
              onClick={handleSimulate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={18} />
              Simulate
            </button>
          </div>
        </div>

        {/* Optimal Configuration Guide */}
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Configuration Guide:</strong>
              {algorithm === 'PCM' ? (
                <span> For PCM, use sampling rate ≥ 2× frequency (Nyquist), recommend 4-5× for quality. 
                Higher quantization levels (16-32) provide better fidelity but use more bandwidth.</span>
              ) : (
                <span> For Delta Modulation, use sampling rate ≥ 8-10× frequency. 
                Balance delta step: too small causes granular noise, too large causes slope overload.</span>
              )}
            </div>
          </div>
        </div>

        {/* Algorithm-specific settings */}
        {algorithm === 'PCM' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampling Rate (Hz): {pcmSamplingRate}
              </label>
              <input
                type="range"
                min="4"
                max="40"
                step="1"
                value={pcmSamplingRate}
                onChange={(e) => setPcmSamplingRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optimal: {Math.round(frequency * 5)} Hz (5× frequency) | Min: {Math.round(frequency * 2)} Hz
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantization Levels: {quantizationLevels} ({Math.log2(quantizationLevels).toFixed(0)} bits)
              </label>
              <select
                value={quantizationLevels}
                onChange={(e) => setQuantizationLevels(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4">4 (2 bits - Low)</option>
                <option value="8">8 (3 bits - Basic)</option>
                <option value="16">16 (4 bits - Good)</option>
                <option value="32">32 (5 bits - High)</option>
                <option value="64">64 (6 bits - Very High)</option>
                <option value="128">128 (7 bits - Excellent)</option>
                <option value="256">256 (8 bits - CD Quality)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">More levels = better quality but higher bandwidth</p>
            </div>
          </div>
        )}

        {algorithm === 'Delta Modulation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampling Rate (Hz): {dmSamplingRate}
              </label>
              <input
                type="range"
                min="10"
                max="80"
                step="2"
                value={dmSamplingRate}
                onChange={(e) => setDmSamplingRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optimal: {Math.round(frequency * 10)} Hz (10× frequency) | Higher reduces slope overload
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delta Step Size: {deltaStepSize.toFixed(2)} ({(deltaStepSize * 100).toFixed(0)}% of amplitude)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.01"
                value={deltaStepSize}
                onChange={(e) => setDeltaStepSize(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optimal: 0.10-0.20 | Too small = granular noise, too large = slope overload
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-gray-700">
          <strong>Algorithm:</strong> {algorithm} |{' '}
          <strong>Sampling Rate:</strong> {algorithm === 'PCM' ? `${pcmSamplingRate} Hz` : `${dmSamplingRate} Hz`}
          {algorithm === 'PCM' && <> | <strong>Quantization Levels:</strong> {quantizationLevels}</>}
          {algorithm === 'Delta Modulation' && <> | <strong>Delta Step:</strong> {deltaStepSize.toFixed(2)}</>}
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
            title="Input Signal - Analog Waveform"
            color="#10b981"
          />
          <SignalChart
            data={signalData.transmitted}
            title={`Transmitted Signal - ${algorithm} Digital Stream`}
            color="#3b82f6"
            isDigital={true}
            isTransmitted={true}
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
