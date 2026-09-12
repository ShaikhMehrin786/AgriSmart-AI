import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">AI-Powered Crop Health Intelligence</h1>
        <p className="text-xl text-gray-600 mb-10">Detect diseases, optimize irrigation, and get smart farming advice instantly with AgriSmart AI.</p>
        <div className="flex justify-center space-x-4">
          <Link to="/register" className="px-8 py-3 bg-agri-green text-white font-bold rounded-lg shadow-lg hover:bg-agri-dark">Analyze Your Crop</Link>
          <a href="#features" className="px-8 py-3 bg-white text-agri-green font-bold rounded-lg shadow border border-gray-200 hover:bg-gray-50">Learn More</a>
        </div>
      </div>
    </div>
  );
};
export default LandingPage;