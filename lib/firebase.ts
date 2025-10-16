// FILE: lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, off } from 'firebase/database';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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

// Fetch historical data (last N days)
export const fetchSensorData = async (days: number = 7): Promise<SensorReading[]> => {
  try {
    const sensorsRef = ref(database, 'sensors');
    const daysInMs = days * 24 * 60 * 60 * 1000;
    const startTime = Date.now() - daysInMs;

    return new Promise((resolve, reject) => {
      onValue(sensorsRef, (snapshot) => {
        const readings: SensorReading[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          
          // Parse timestamp from key or use provided timestamp
          const timestamp = data.timestamp || parseInt(childSnapshot.key);
          
          if (timestamp >= startTime) {
            readings.push({
              id: childSnapshot.key,
              timestamp,
              moisture: parseFloat(data.moisture) || 0,
              temperature: parseFloat(data.temperature) || 0,
              ec: parseFloat(data.ec) || 0,
              ph: parseFloat(data.ph) || 0,
              nitrogen: parseFloat(data.nitrogen) || 0,
              phosphorus: parseFloat(data.phosphorus) || 0,
              potassium: parseFloat(data.potassium) || 0,
            });
          }
        });

        resolve(readings.sort((a, b) => a.timestamp - b.timestamp));
      }, (error) => {
        console.error('Error fetching data:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return [];
  }
};

// Real-time listener
export const subscribeToRealtimeData = (callback: (reading: SensorReading) => void): (() => void) => {
  const sensorsRef = ref(database, 'sensors');

  const listener = onValue(sensorsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const entries = Object.entries(data);
      const latestEntry = entries[entries.length - 1];
      
      if (latestEntry) {
        const [key, value] = latestEntry as [string, any];
        
        callback({
          id: key,
          timestamp: value.timestamp || parseInt(key),
          moisture: parseFloat(value.moisture) || 0,
          temperature: parseFloat(value.temperature) || 0,
          ec: parseFloat(value.ec) || 0,
          ph: parseFloat(value.ph) || 0,
          nitrogen: parseFloat(value.nitrogen) || 0,
          phosphorus: parseFloat(value.phosphorus) || 0,
          potassium: parseFloat(value.potassium) || 0,
        });
      }
    }
  });

  // Return unsubscribe function
  return () => off(sensorsRef);
};

// Export data as CSV
export const exportToCSV = (data: SensorReading[], filename: string = 'sensor-data') => {
  const headers = ['Timestamp', 'Moisture (%)', 'Temperature (°C)', 'pH', 'EC (µS/cm)', 'Nitrogen', 'Phosphorus', 'Potassium'];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      new Date(row.timestamp).toLocaleString(),
      row.moisture.toFixed(1),
      row.temperature.toFixed(1),
      row.ph.toFixed(2),
      row.ec.toFixed(0),
      row.nitrogen.toFixed(0),
      row.phosphorus.toFixed(0),
      row.potassium.toFixed(0),
    ].join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default database;
