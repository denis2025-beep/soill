// FILE: app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, AlertCircle, TrendingUp } from 'lucide-react';
import SensorGauge from '@/components/SensorGauge';
import { fetchSensorData, subscribeToRealtimeData, exportToCSV } from '@/lib/firebase';

interface SensorReading {
  id: string;
  timestamp: number;
  moisture: number;
  temperature: number;
  ec: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export default function Dashboard() {
  const [data, setData] = useState<SensorReading[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Fetch historical data
    const loadData = async () => {
      try {
        const readings = await fetchSensorData(7); // Last 7 days
        setData(readings);
        if (readings.length > 0) {
          setLatestReading(readings[readings.length - 1]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToRealtimeData((newReading) => {
      setData((prev) => [...prev, newReading].slice(-100)); // Keep last 100 readings
      setLatestReading(newReading);
      
      // Check for alerts
      const newAlerts = [];
      if (newReading.moisture < 20) newAlerts.push('Low soil moisture');
      if (newReading.ph < 6 || newReading.ph > 8.5) newAlerts.push('pH out of range');
      if (newReading.temperature > 60) newAlerts.push('High temperature');
      
      if (newAlerts.length > 0) {
        setAlerts(newAlerts);
        setTimeout(() => setAlerts([]), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleExport = () => {
    exportToCSV(data, 'soil-sensor-data');
  };

  const filterDataByDate = () => {
    if (!dateFilter.start || !dateFilter.end) return data;
    
    const startTime = new Date(dateFilter.start).getTime();
    const endTime = new Date(dateFilter.end).getTime();
    
    return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
  };

  const filteredData = filterDataByDate();
  const chartData = filteredData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    moisture: d.moisture,
    temperature: d.temperature,
    ph: d.ph,
    ec: d.ec
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Soil Sensor Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of soil conditions</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">Alerts</h3>
                {alerts.map((alert, i) => (
                  <p key={i} className="text-red-700 text-sm">{alert}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Gauges */}
        {latestReading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SensorGauge 
              label="Moisture" 
              value={latestReading.moisture} 
              unit="%" 
              min={0} 
              max={100}
              color="#3b82f6"
            />
            <SensorGauge 
              label="Temperature" 
              value={latestReading.temperature} 
              unit="°C" 
              min={-30} 
              max={70}
              color="#ef4444"
            />
            <SensorGauge 
              label="pH" 
              value={latestReading.ph} 
              unit="" 
              min={3} 
              max={10}
              color="#f59e0b"
            />
            <SensorGauge 
              label="EC" 
              value={latestReading.ec} 
              unit="µS/cm" 
              min={0} 
              max={2000}
              color="#10b981"
            />
          </div>
        )}

        {/* Data Filters & Export */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex gap-4">
              <input
                type="datetime-local"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="px-4 py-2 border rounded-lg text-sm"
                placeholder="Start date"
              />
              <input
                type="datetime-local"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="px-4 py-2 border rounded-lg text-sm"
                placeholder="End date"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Showing {filteredData.length} readings</p>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Moisture & Temperature</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">pH & EC Levels</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ph" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="ec" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Detailed Readings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Timestamp</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Moisture %</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Temp °C</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">pH</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">EC µS/cm</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">N-P-K</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice().reverse().map((reading, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-700">{new Date(reading.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 text-blue-600 font-medium">{reading.moisture.toFixed(1)}</td>
                    <td className="px-6 py-3 text-red-600 font-medium">{reading.temperature.toFixed(1)}</td>
                    <td className="px-6 py-3 text-amber-600 font-medium">{reading.ph.toFixed(2)}</td>
                    <td className="px-6 py-3 text-green-600 font-medium">{reading.ec.toFixed(0)}</td>
                    <td className="px-6 py-3 text-gray-600">{reading.nitrogen.toFixed(0)}-{reading.phosphorus.toFixed(0)}-{reading.potassium.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
