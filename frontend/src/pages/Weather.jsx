import React from 'react';
import { CloudRain, Wind, Thermometer, Droplets } from 'lucide-react';

const Weather = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Agricultural Weather</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow flex flex-col items-center">
          <Thermometer className="text-red-500 mb-2" size={32} />
          <span className="text-gray-500">Temperature</span>
          <span className="text-2xl font-bold">24°C</span>
        </div>
        <div className="bg-white p-6 rounded shadow flex flex-col items-center">
          <Droplets className="text-blue-500 mb-2" size={32} />
          <span className="text-gray-500">Humidity</span>
          <span className="text-2xl font-bold">65%</span>
        </div>
        <div className="bg-white p-6 rounded shadow flex flex-col items-center">
          <CloudRain className="text-gray-500 mb-2" size={32} />
          <span className="text-gray-500">Rain Prob.</span>
          <span className="text-2xl font-bold">30%</span>
        </div>
        <div className="bg-white p-6 rounded shadow flex flex-col items-center">
          <Wind className="text-teal-500 mb-2" size={32} />
          <span className="text-gray-500">Wind Speed</span>
          <span className="text-2xl font-bold">12 km/h</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border-l-4 border-agri-green">
        <h2 className="text-xl font-bold mb-2">Farming Recommendation</h2>
        <p className="text-gray-700">Conditions are currently favorable for spraying. However, monitor the 30% rain probability for this evening to ensure treatments aren't washed away. Soil moisture evaporation is low today.</p>
      </div>
    </div>
  );
};
export default Weather;