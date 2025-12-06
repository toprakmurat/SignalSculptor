import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../types';

interface SignalChartProps {
  data: DataPoint[];
  title: string;
  color: string;
  domain?: [number, number];
  showGrid?: boolean;
  isDigital?: boolean;
}

export function SignalChart({ data, title, color, domain, showGrid = true, isDigital = false }: SignalChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
          <XAxis
            dataKey="x"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            domain={isDigital ? [0, 1] : (domain || ['auto', 'auto'])}
            ticks={isDigital ? [0, 1] : undefined}
            label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }}
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
