import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
      setResult(null);
    }
  };

  const analyzeImage = () => {
    setAnalyzing(true);
    // Mock API Call
    setTimeout(() => {
      setResult({
        disease: 'Early Blight',
        confidence: 96.5,
        status: 'Diseased',
        severity: 'Moderate',
        recommendation: 'Apply copper-based fungicide.'
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crop Disease Detection</h1>
      
      {!result ? (
        <div className="bg-white p-8 rounded shadow text-center border-2 border-dashed border-gray-300">
          {selectedImage ? (
            <div className="mb-4">
              <img src={selectedImage} alt="Crop" className="max-h-64 mx-auto rounded" />
              <div className="mt-4 flex justify-center space-x-4">
                <button onClick={() => setSelectedImage(null)} className="px-4 py-2 border rounded">Remove</button>
                <button onClick={analyzeImage} disabled={analyzing} className="px-4 py-2 bg-agri-green text-white rounded">
                  {analyzing ? 'Analyzing...' : 'Analyze Crop'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop an image of the leaf here, or click to browse.</p>
              <input type="file" id="file" onChange={handleImageChange} className="hidden" accept="image/*" />
              <label htmlFor="file" className="px-4 py-2 bg-agri-green text-white rounded cursor-pointer">Browse Image</label>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow flex flex-col md:flex-row gap-6">
           <img src={selectedImage} alt="Crop" className="w-full md:w-1/2 rounded object-cover" />
           <div className="flex-1">
             <h2 className="text-2xl font-bold text-red-500 mb-2">{result.disease}</h2>
             <div className="bg-gray-50 p-4 rounded mb-4">
               <p><strong>Status:</strong> {result.status}</p>
               <p><strong>Confidence:</strong> {result.confidence}%</p>
               <p><strong>Severity:</strong> {result.severity}</p>
             </div>
             <div>
               <h3 className="font-bold">Recommendation</h3>
               <p className="text-gray-700">{result.recommendation}</p>
             </div>
             <button onClick={() => { setSelectedImage(null); setResult(null); }} className="mt-6 px-4 py-2 bg-gray-200 rounded">Analyze Another Image</button>
           </div>
        </div>
      )}
    </div>
  );
};
export default DiseaseDetection;