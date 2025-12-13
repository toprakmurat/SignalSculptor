import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DataPoint } from '../types';
import { VIEWPORT_THRESHOLD, VIEWPORT_WINDOW_SIZE } from '../constants';

interface SignalChartProps {
  data: DataPoint[];
  title: string;
  color: string;
  domain?: [number, number];
  showGrid?: boolean;
  isDigital?: boolean;
  bitDuration?: number;
  numBits?: number;
  ticks?: number[];
  isTransmitted?: boolean;
  onViewportChange?: (startBit: number, endBit: number) => void;
  viewportStart?: number;
  viewportEnd?: number;
  totalBits?: number;
}

/**
 * SignalChart Component
 * 
 * Displays signal waveforms using Recharts. Optimized with memoization to prevent
 * recalculation of chart properties on every render.
 * 
 * @param data - Array of data points to display
 * @param title - Chart title
 * @param color - Line color for the signal
 * @param domain - Y-axis domain [min, max]
 * @param showGrid - Whether to show grid lines
 * @param isDigital - Whether signal is digital (step function) or analog (smooth)
 * @param bitDuration - Duration of each bit for digital signals
 * @param numBits - Number of bits for digital signals
 * @param ticks - Custom Y-axis tick values
 * @param isTransmitted - Whether this is a transmitted signal (affects tick formatting)
 */
export function SignalChart({
  data,
  title,
  color,
  domain,
  showGrid = true,
  isDigital = false,
  bitDuration = 1,
  numBits = 0,
  ticks,
  isTransmitted = false,
  onViewportChange,
  viewportStart,
  viewportEnd,
  totalBits
}: SignalChartProps) {
  // Determine if we need viewport slider
  const needsViewport = useMemo(() => {
    return (numBits > VIEWPORT_THRESHOLD || (totalBits && totalBits > VIEWPORT_THRESHOLD));
  }, [numBits, totalBits]);

  const effectiveTotalBits = totalBits || numBits;

  // Internal viewport state if not controlled externally
  const [internalViewportStart, setInternalViewportStart] = useState(0);

  // Debounce timer for viewport changes
  const viewportDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local state for immediate slider feedback (before debounced update)
  const [localViewportStart, setLocalViewportStart] = useState(viewportStart ?? 0);

  // Sync local state with external viewport when it changes
  useEffect(() => {
    if (viewportStart !== undefined) {
      setLocalViewportStart(viewportStart);
    }
  }, [viewportStart]);

  // Use external viewport if provided, otherwise use internal state
  // For immediate visual feedback during dragging, use localViewportStart
  const currentViewportStart = viewportStart !== undefined ? localViewportStart : internalViewportStart;
  const currentViewportEnd = viewportEnd !== undefined
    ? Math.min(localViewportStart + VIEWPORT_WINDOW_SIZE, effectiveTotalBits)
    : Math.min(currentViewportStart + VIEWPORT_WINDOW_SIZE, effectiveTotalBits);

  /**
   * Filters data to visible viewport range
   * Uses local viewport state for immediate visual feedback during dragging
   */
  const visibleData = useMemo(() => {
    if (!needsViewport) return data;

    // Use local viewport for immediate feedback, even if data hasn't been regenerated yet
    const viewportStartTime = currentViewportStart * bitDuration;
    const viewportEndTime = currentViewportEnd * bitDuration;

    // Filter data to visible range
    // Note: If user drags outside loaded range, this will show partial/empty data
    // until debounced regeneration completes
    return data.filter(point => point.x >= viewportStartTime && point.x <= viewportEndTime);
  }, [data, needsViewport, currentViewportStart, currentViewportEnd, bitDuration]);

  /**
   * Handles slider change for viewport navigation with debouncing
   * Updates local state immediately for visual feedback, but debounces the actual signal generation
   */
  const handleSliderChange = useCallback((value: number) => {
    const newStart = Math.max(0, Math.min(value, effectiveTotalBits - VIEWPORT_WINDOW_SIZE));
    const newEnd = Math.min(newStart + VIEWPORT_WINDOW_SIZE, effectiveTotalBits);

    // Update local state immediately for visual feedback
    if (viewportStart !== undefined) {
      setLocalViewportStart(newStart);
    } else {
      setInternalViewportStart(newStart);
    }

    // Clear existing debounce timer
    if (viewportDebounceTimerRef.current) {
      clearTimeout(viewportDebounceTimerRef.current);
    }

    // Debounce the actual signal generation (300ms delay)
    viewportDebounceTimerRef.current = setTimeout(() => {
      if (onViewportChange) {
        onViewportChange(newStart, newEnd);
      }
    }, 300);
  }, [effectiveTotalBits, onViewportChange, viewportStart]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (viewportDebounceTimerRef.current) {
        clearTimeout(viewportDebounceTimerRef.current);
      }
    };
  }, []);
  // Memoize transition points (bit boundaries) for vertical lines
  // Only recalculates when viewport or bitDuration changes
  const transitionLines = useMemo(() => {
    if (!needsViewport) {
      if (numBits <= 0) return [];
      const lines: number[] = [];
      for (let i = 0; i <= numBits; i++) {
        lines.push(i * bitDuration);
      }
      return lines;
    }

    // For viewport mode, only show lines in visible range
    const lines: number[] = [];
    const startBit = Math.floor(currentViewportStart);
    const endBit = Math.ceil(currentViewportEnd);
    for (let i = startBit; i <= endBit; i++) {
      lines.push(i * bitDuration);
    }
    return lines;
  }, [numBits, bitDuration, needsViewport, currentViewportStart, currentViewportEnd]);

  // Memoize x-axis ticks to avoid duplication
  // Only recalculates when viewport or bitDuration changes
  const xTicks = useMemo(() => {
    if (!needsViewport) {
      return numBits > 0
        ? Array.from({ length: numBits + 1 }, (_, i) => i * bitDuration)
        : undefined;
    }

    // For viewport mode, show ticks in visible range
    const startBit = Math.floor(currentViewportStart);
    const endBit = Math.ceil(currentViewportEnd);
    const tickCount = endBit - startBit + 1;
    return Array.from({ length: tickCount }, (_, i) => (startBit + i) * bitDuration);
  }, [numBits, bitDuration, needsViewport, currentViewportStart, currentViewportEnd]);

  // Memoize x-domain calculation
  // For viewport mode, use viewport range; otherwise use data range
  const xDomain = useMemo(() => {
    if (needsViewport) {
      return [currentViewportStart * bitDuration, currentViewportEnd * bitDuration];
    }

    if (visibleData.length === 0) return undefined;

    // Optimized: use single pass instead of Math.min/max on array
    let minX = visibleData[0].x;
    let maxX = visibleData[0].x;
    for (let i = 1; i < visibleData.length; i++) {
      const x = visibleData[i].x;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    return [minX, maxX];
  }, [visibleData, needsViewport, currentViewportStart, currentViewportEnd, bitDuration]);

  // Memoized custom tick formatter for digital transmitted signals
  const formatDigitalTick = useMemo(() => {
    return (value: number) => {
      if (value === 1) return 'High';
      if (value === 0) return '*NLS';
      if (value === -1) return 'Low';
      return value.toString();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {needsViewport && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Bits {Math.floor(currentViewportStart) + 1}-{Math.ceil(currentViewportEnd)} of {effectiveTotalBits}</span>
          </div>
        )}
      </div>

      {needsViewport && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-12">0</span>
            <input
              type="range"
              min="0"
              max={Math.max(0, effectiveTotalBits - VIEWPORT_WINDOW_SIZE)}
              step="1"
              value={currentViewportStart}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-12 text-right">{effectiveTotalBits}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            Navigate through signal (showing {VIEWPORT_WINDOW_SIZE} bits at a time) • Updates after 300ms pause
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={visibleData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}

          {/* Vertical transition lines for bit boundaries */}
          {transitionLines.map((x, idx) => (
            <ReferenceLine
              key={`transition-${idx}`}
              x={x}
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              opacity={0.6}
            />
          ))}

          <XAxis
            dataKey="x"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
            domain={xDomain}
            ticks={xTicks}
            type="number"
            allowDuplicatedCategory={false}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={domain || (isDigital ? [0, 1] : ['auto', 'auto'])}
            ticks={ticks !== undefined ? ticks : (isDigital ? [0, 1] : undefined)}
            label={{ value: 'Voltage', angle: -90, position: 'insideLeft' }}
            tickFormatter={isDigital && isTransmitted ? formatDigitalTick : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
            }}
          />
          <Line
            type={isDigital ? "stepAfter" : "monotone"}
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
