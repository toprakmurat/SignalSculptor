import { useState } from 'react';
import { Radio, Waves, Activity, Signal, BarChart2 } from 'lucide-react';
import { DigitalToDigitalMode } from './components/DigitalToDigitalMode';
import { DigitalToAnalogMode } from './components/DigitalToAnalogMode';
import { AnalogToDigitalMode } from './components/AnalogToDigitalMode';
import { AnalogToAnalogMode } from './components/AnalogToAnalogMode';
import { BenchmarkMode } from './components/BenchmarkMode';
import { SimulationMode } from './types';


function App() {
  const [activeMode, setActiveMode] = useState<SimulationMode | 'benchmark'>('digital-to-digital');

  const modes = [
    {
      id: 'digital-to-digital' as const,
      name: 'Digital → Digital',
      icon: Radio,
      description: 'Line Coding',
    },
    {
      id: 'digital-to-analog' as const,
      name: 'Digital → Analog',
      icon: Waves,
      description: 'Modulation',
    },
    {
      id: 'analog-to-digital' as const,
      name: 'Analog → Digital',
      icon: Activity,
      description: 'Sampling',
    },
    {
      id: 'analog-to-analog' as const,
      name: 'Analog → Analog',
      icon: Signal,
      description: 'Carrier Mod.',
    },
    {
      id: 'benchmark' as const,
      name: 'Benchmark',
      icon: BarChart2,
      description: 'Performance',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">SignalSculptor</h1>
              <p className="text-gray-600 mt-1">BLG 337E - Computer Communications Assignment</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-800">Murat Toprak</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${activeMode === mode.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Icon size={20} />
                  <div className="text-left">
                    <div className="text-sm font-bold">{mode.name}</div>
                    <div className="text-xs opacity-90">{mode.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="transition-all duration-300">
          {activeMode === 'digital-to-digital' && <DigitalToDigitalMode />}
          {activeMode === 'digital-to-analog' && <DigitalToAnalogMode />}
          {activeMode === 'analog-to-digital' && <AnalogToDigitalMode />}
          {activeMode === 'analog-to-analog' && <AnalogToAnalogMode />}
          {activeMode === 'benchmark' && <BenchmarkMode />}
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            Computer Communications - Data Transmission Simulation Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
