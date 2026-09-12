import React from 'react';
import { Link } from 'react-router-dom';

const History = () => {
  const mockHistory = [
    { id: 1, date: '2026-09-10', crop: 'Tomato', disease: 'Healthy', confidence: 99.1 },
    { id: 2, date: '2026-09-08', crop: 'Potato', disease: 'Late Blight', confidence: 94.2 },
    { id: 3, date: '2026-09-05', crop: 'Wheat', disease: 'Rust', confidence: 88.5 },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Prediction History</h1>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-4">Date</th>
              <th className="p-4">Crop</th>
              <th className="p-4">Result</th>
              <th className="p-4">Confidence</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{item.date}</td>
                <td className="p-4">{item.crop}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.disease === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.disease}
                  </span>
                </td>
                <td className="p-4">{item.confidence}%</td>
                <td className="p-4">
                  <Link to={`/dashboard/history/${item.id}`} className="text-blue-500 hover:underline">View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default History;