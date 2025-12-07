import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DataPoint } from '../types';

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
}

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
  isTransmitted = false
}: SignalChartProps) {
  // Calculate transition points (bit boundaries) for vertical lines
  const transitionLines = [];
  if (numBits > 0) {
    for (let i = 0; i <= numBits; i++) {
      transitionLines.push(i * bitDuration);
    }
  }

  // Calculate appropriate x-axis ticks to avoid duplication
  const xTicks = numBits > 0 
    ? Array.from({ length: numBits + 1 }, (_, i) => i * bitDuration)
    : undefined;

  // Get min and max x values from data
  const xValues = data.map(d => d.x);
  const xDomain = xValues.length > 0 
    ? [Math.min(...xValues), Math.max(...xValues)]
    : undefined;

  // Custom tick formatter for digital transmitted signals
  const formatDigitalTick = (value: number) => {
    if (value === 1) return 'High';
    if (value === 0) return '*NLS';
    if (value === -1) return 'Low';
    return value.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
