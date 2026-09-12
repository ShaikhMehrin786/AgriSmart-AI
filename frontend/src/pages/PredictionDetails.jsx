import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PredictionDetails = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/dashboard/history" className="flex items-center text-gray-500 hover:text-agri-green mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back to History
      </Link>
      <h1 className="text-3xl font-bold mb-6">Scan Details #{id}</h1>
      
      <div className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           {/* Mock image placeholder */}
           <div className="bg-gray-200 w-full h-64 rounded flex items-center justify-center text-gray-400 mb-2">Original Image</div>
           <div className="bg-gray-200 w-full h-64 rounded flex items-center justify-center text-gray-400">Grad-CAM Heatmap</div>
           <p className="text-sm text-center text-gray-500 mt-2">Highlighted regions show the parts of the leaf that influenced the AI prediction.</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Late Blight</h2>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <p><strong>Crop:</strong> Potato</p>
            <p><strong>Confidence:</strong> 94.2%</p>
            <p><strong>Date:</strong> 2026-09-08</p>
          </div>
          
          <h3 className="font-bold mb-1">Symptoms</h3>
          <p className="text-gray-700 mb-4 text-sm">Dark, water-soaked spots on leaves that rapidly enlarge.</p>
          
          <h3 className="font-bold mb-1">Treatment</h3>
          <p className="text-gray-700 mb-4 text-sm">Apply fungicides containing chlorothalonil or copper immediately.</p>
        </div>
      </div>
    </div>
  );
};
export default PredictionDetails;