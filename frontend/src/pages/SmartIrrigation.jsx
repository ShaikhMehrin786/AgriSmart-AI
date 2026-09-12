import React, { useState } from 'react';
import { Droplets } from 'lucide-react';

const SmartIrrigation = () => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const getRecommendation = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setRecommendation({
        action: 'Delay Irrigation',
        reason: 'Soil moisture is sufficient (60%) and rainfall probability is high in the next 24 hours.',
        waterRequired: '0 L/m²'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Smart Irrigation Planner</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow">
          <form onSubmit={getRecommendation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Crop Type</label>
              <select className="mt-1 p-2 w-full border rounded">
                <option>Wheat</option>
                <option>Corn</option>
                <option>Tomato</option>
                <option>Rice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Growth Stage</label>
              <select className="mt-1 p-2 w-full border rounded">
                <option>Vegetative</option>
                <option>Flowering</option>
                <option>Fruiting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Soil Moisture (%)</label>
              <input type="number" defaultValue="60" className="mt-1 p-2 w-full border rounded" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              {loading ? 'Calculating...' : 'Get Recommendation'}
            </button>
          </form>
        </div>

        <div>
          {recommendation ? (
            <div className="bg-white p-6 rounded shadow border-t-4 border-blue-500 h-full flex flex-col justify-center text-center">
              <Droplets className="mx-auto text-blue-500 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{recommendation.action}</h2>
              <p className="text-xl text-blue-600 font-semibold mb-4">Water Required: {recommendation.waterRequired}</p>
              <p className="text-gray-600 italic">"{recommendation.reason}"</p>
            </div>
          ) : (
             <div className="bg-gray-100 p-6 rounded border-2 border-dashed border-gray-300 h-full flex items-center justify-center text-gray-500">
               Fill the form to get an AI-powered irrigation recommendation.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SmartIrrigation;