import React from 'react';
import { Leaf } from 'lucide-react';

const Sustainability = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Farm Sustainability Score</h1>
      
      <div className="bg-white p-8 rounded shadow mb-8 text-center flex flex-col items-center justify-center">
        <div className="w-48 h-48 rounded-full border-8 border-agri-green flex items-center justify-center mb-4">
          <span className="text-5xl font-extrabold text-agri-green">85</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Excellent</h2>
        <p className="text-gray-500 mt-2 max-w-md">Your farm is utilizing resources efficiently. Minimal chemical treatments and optimized water usage detected.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <h3 className="font-bold text-gray-700">Water Efficiency</h3>
          <p className="text-2xl font-bold text-blue-600">92%</p>
          <p className="text-sm text-gray-500">Optimized via smart irrigation</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <h3 className="font-bold text-gray-700">Disease Management</h3>
          <p className="text-2xl font-bold text-green-600">78%</p>
          <p className="text-sm text-gray-500">Early detection reducing chemical usage</p>
        </div>
      </div>
    </div>
  );
};
export default Sustainability;