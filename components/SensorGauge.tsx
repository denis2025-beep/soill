// FILE: components/SensorGauge.tsx
interface SensorGaugeProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
}

export default function SensorGauge({ label, value, unit, min, max, color }: SensorGaugeProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  // Determine status based on value
  let status = 'normal';
  if (label === 'Moisture' && value < 20) status = 'critical';
  if (label === 'pH' && (value < 6 || value > 8.5)) status = 'warning';
  if (label === 'Temperature' && value > 60) status = 'warning';

  const statusColors = {
    normal: 'from-blue-400 to-blue-600',
    warning: 'from-yellow-400 to-yellow-600',
    critical: 'from-red-400 to-red-600',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${status === 'critical' ? 'border-red-500' : status === 'warning' ? 'border-yellow-500' : 'border-green-500'}`}>
      <div className="flex flex-col items-center">
        <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
        
        {/* Circular Gauge */}
        <div className="relative w-24 h-24 mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 282.7} 282.7`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          
          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-gray-900">{value.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{unit}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'critical' ? 'bg-red-500 animate-pulse' : status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
          <span className="text-xs text-gray-600 capitalize">{status}</span>
        </div>

        {/* Range info */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          {min}-{max} {unit}
        </p>
      </div>
    </div>
  );
}
