import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome back, {user?.name || 'Farmer'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold text-gray-700 mb-2">Crop Health Status</h2>
          <p className="text-3xl text-green-500 font-bold">Good</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold text-gray-700 mb-2">Today's Weather</h2>
          <p className="text-3xl text-blue-500 font-bold">24°C, Sunny</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold text-gray-700 mb-2">Sustainability Score</h2>
          <p className="text-3xl text-agri-green font-bold">85/100</p>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;