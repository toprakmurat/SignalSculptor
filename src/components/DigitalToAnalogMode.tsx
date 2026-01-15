import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SignalChart } from './SignalChart';
import { generateDigitalToAnalogSignal } from '../utils/digitalToAnalog';
import { DigitalToAnalogAlgorithm, SignalData } from '../types';
import { Play } from 'lucide-react';
import { VIEWPORT_THRESHOLD, VIEWPORT_WINDOW_SIZE } from '../constants';

/**
 * Digital-to-Analog Modulation Mode Component
 * 
 * Provides UI for simulating ASK, FSK, and PSK modulation techniques.
 * Optimized with debouncing to prevent recalculation on every keystroke.
 */
export function DigitalToAnalogMode() {
  const [binaryInput, setBinaryInput] = useState('10110');
  const [algorithm, setAlgorithm] = useState<DigitalToAnalogAlgorithm>('ASK');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref to prevent excessive recalculations on input changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Memoized binary input length to avoid recalculation
   */
  const binaryLength = useMemo(() => binaryInput.length, [binaryInput]);

  // Viewport state for large inputs
  const [viewportStart, setViewportStart] = useState(0);
  const needsViewport = useMemo(() => binaryLength > VIEWPORT_THRESHOLD, [binaryLength]);

  const algorithms: DigitalToAnalogAlgorithm[] = ['ASK', 'BFSK', 'MFSK', 'BPSK', 'DPSK', 'QPSK', 'OQPSK', 'MPSK', 'QAM'];

  /**
   * Validates binary input string
   */
  const isValidBinary = useCallback((input: string): boolean => {
    return /^[01]+$/.test(input) && input.length > 0;
  }, []);

  /**
   * Generates signal data with error handling
   * For large inputs, only generates data for the visible viewport
   */
  const generateSignal = useCallback((start?: number, end?: number) => {
    try {
      if (!isValidBinary(binaryInput)) {
        throw new Error('Please enter a valid binary string (only 0s and 1s)');
      }
      if (binaryInput.length > 10000) {
        throw new Error('Binary input too long (max 10000 bits)');
      }

      // For large inputs, generate only the visible portion
      const data = needsViewport && start !== undefined && end !== undefined
        ? generateDigitalToAnalogSignal(binaryInput, algorithm, start, end)
        : generateDigitalToAnalogSignal(binaryInput, algorithm);

      // Add totalBits for viewport navigation
      const signalDataWithTotal: SignalData = needsViewport
        ? { ...data, totalBits: binaryLength }
        : data;

      setSignalData(signalDataWithTotal);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate signal';
      setError(errorMessage);
      console.error('Signal generation error:', err);
    }
  }, [binaryInput, algorithm, isValidBinary, needsViewport, binaryLength]);

  const handleSimulate = useCallback(() => {
    generateSignal();
  }, [generateSignal]);

  // Handle viewport changes for large inputs (already debounced in SignalChart)
  const handleViewportChange = useCallback((start: number, end: number) => {
    // Update viewport state immediately (for synchronization)
    setViewportStart(start);
    // Generate signal for the new viewport (this is already debounced in SignalChart)
    generateSignal(start, end);
  }, [generateSignal]);

  // Reset viewport when input changes
  useEffect(() => {
    setViewportStart(0);
  }, [binaryInput, algorithm]);

  // Initial signal generation
  useEffect(() => {
    if (isValidBinary(binaryInput)) {
      const end = needsViewport ? Math.min(viewportStart + VIEWPORT_WINDOW_SIZE, binaryLength) : undefined;
      generateSignal(needsViewport ? viewportStart : undefined, end);
    }
  }, [algorithm, binaryInput, isValidBinary, needsViewport, viewportStart, binaryLength, generateSignal]);

  // Debounced auto-regenerate signal when algorithm or input changes (if valid data exists)
  // Only recalculates after user stops typing for 500ms (for small inputs)
  useEffect(() => {
    if (signalData && isValidBinary(binaryInput) && !needsViewport) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced recalculation
      debounceTimerRef.current = setTimeout(() => {
        generateSignal();
      }, 500);

      // Cleanup on unmount or dependency change
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [algorithm, binaryInput, signalData, isValidBinary, generateSignal, needsViewport]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Digital-to-Analog Modulation</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Binary Input
            </label>
            <input
              type="text"
              value={binaryInput}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow binary digits
                if (value === '' || /^[01]*$/.test(value)) {
                  setBinaryInput(value);
                  setError(null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10110"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modulation Technique
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as DigitalToAnalogAlgorithm)}
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
          {algorithm === 'ASK' && 'Amplitude Shift Keying'}
          {algorithm === 'BFSK' && 'Binary Frequency Shift Keying'}
          {algorithm === 'MFSK' && 'M-ary Frequency Shift Keying (4-FSK)'}
          {algorithm === 'BPSK' && 'Binary Phase Shift Keying'}
          {algorithm === 'DPSK' && 'Differential Phase Shift Keying'}
          {algorithm === 'QPSK' && 'Quadrature Phase Shift Keying'}
          {algorithm === 'OQPSK' && 'Offset Quadrature Phase Shift Keying'}
          {algorithm === 'MPSK' && 'M-ary Phase Shift Keying (8-PSK)'}
          {algorithm === 'QAM' && 'Quadrature Amplitude Modulation (16-QAM)'})
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
            title="Input Signal - Digital Bits"
            color="#10b981"
            domain={[-0.5, 1.5]}
            isDigital={true}
            bitDuration={1}
            numBits={needsViewport ? undefined : binaryLength}
            totalBits={needsViewport ? binaryLength : undefined}
            viewportStart={needsViewport ? viewportStart : undefined}
            viewportEnd={needsViewport ? Math.min(viewportStart + VIEWPORT_WINDOW_SIZE, binaryLength) : undefined}
            onViewportChange={needsViewport ? handleViewportChange : undefined}
          />
          <SignalChart
            data={signalData.transmitted}
            title={`Transmitted Signal - ${algorithm} Modulated`}
            color="#3b82f6"
            domain={[-1.5, 1.5]}
            bitDuration={1}
            numBits={needsViewport ? undefined : binaryLength}
            totalBits={needsViewport ? binaryLength : undefined}
            viewportStart={needsViewport ? viewportStart : undefined}
            viewportEnd={needsViewport ? Math.min(viewportStart + VIEWPORT_WINDOW_SIZE, binaryLength) : undefined}
            onViewportChange={needsViewport ? handleViewportChange : undefined}
          />
          <SignalChart
            data={signalData.output}
            title="Output Signal - Demodulated Bits"
            color="#f59e0b"
            domain={[-0.5, 1.5]}
            isDigital={true}
            bitDuration={1}
            numBits={needsViewport ? undefined : binaryLength}
            totalBits={needsViewport ? binaryLength : undefined}
            viewportStart={needsViewport ? viewportStart : undefined}
            viewportEnd={needsViewport ? Math.min(viewportStart + VIEWPORT_WINDOW_SIZE, binaryLength) : undefined}
            onViewportChange={needsViewport ? handleViewportChange : undefined}
          />
        </div>
      )}
    </div>
  );
}
