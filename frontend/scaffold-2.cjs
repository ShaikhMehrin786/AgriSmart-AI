const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

const pages = {
  'Register.jsx': `import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { register as registerService } from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await registerService(formData);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-8">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input name="name" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" name="phone" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input name="location" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" name="confirmPassword" onChange={handleChange} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-agri-green text-white p-2 rounded hover:bg-agri-dark">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center">Already have an account? <Link to="/login" className="text-agri-green">Login</Link></p>
      </div>
    </div>
  );
};
export default Register;`,

  'Weather.jsx': `import React from 'react';
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
export default Weather;`,

  'SmartIrrigation.jsx': `import React, { useState } from 'react';
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
export default SmartIrrigation;`,

  'AIAssistant.jsx': `import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AgriSmart AI assistant. How can I help you with your farm today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setMessages([...newMsgs, { role: 'assistant', content: 'Based on your current crop data and local weather, I suggest reviewing your irrigation schedule. The recent soil moisture readings indicate adequate hydration.' }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-white rounded shadow">
      <div className="p-4 bg-agri-green text-white font-bold rounded-t flex items-center space-x-2">
        <Bot /> <span>AgriSmart Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`flex items-start max-w-[70%] \${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}\`}>
              <div className={\`p-2 rounded-full \${msg.role === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-green-100 text-green-600 mr-2'}\`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={\`p-3 rounded-lg \${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}\`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[70%]">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-2"><Bot size={20} /></div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-800 flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2 mb-2 overflow-x-auto">
          {["How can I treat Early Blight?", "Should I irrigate today?", "What's the weather like?"].map((q, i) => (
            <button key={i} onClick={() => setInput(q)} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-3 py-1 whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your crops..." className="flex-1 border p-2 rounded focus:outline-none focus:border-agri-green" />
          <button type="submit" disabled={!input.trim() || loading} className="bg-agri-green text-white p-2 rounded hover:bg-agri-dark">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default AIAssistant;`,

  'Sustainability.jsx': `import React from 'react';
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
export default Sustainability;`,

  'Profile.jsx': `import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, MapPin, Phone } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Farmer Profile</h1>
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-agri-green rounded-full flex items-center justify-center text-white text-4xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500 flex items-center mt-1"><MapPin size={16} className="mr-1" /> {user.location}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <Mail className="text-gray-400" />
            <span className="text-gray-700">{user.email}</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <Phone className="text-gray-400" />
            <span className="text-gray-700">+1 234 567 8900</span>
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <button className="px-4 py-2 bg-agri-green text-white rounded hover:bg-agri-dark">Edit Profile</button>
          <button onClick={logout} className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50">Logout</button>
        </div>
      </div>
    </div>
  );
};
export default Profile;`,

  'History.jsx': `import React from 'react';
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
                  <span className={\`px-2 py-1 rounded text-xs font-bold \${item.disease === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                    {item.disease}
                  </span>
                </td>
                <td className="p-4">{item.confidence}%</td>
                <td className="p-4">
                  <Link to={\`/dashboard/history/\${item.id}\`} className="text-blue-500 hover:underline">View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default History;`,

  'PredictionDetails.jsx': `import React from 'react';
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
export default PredictionDetails;`
};

Object.keys(pages).forEach(page => {
  fs.writeFileSync(path.join(srcDir, 'pages', page), pages[page]);
});

// Update App.jsx to include the new routes
const appCode = `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DiseaseDetection from './pages/DiseaseDetection';
import Weather from './pages/Weather';
import SmartIrrigation from './pages/SmartIrrigation';
import Sustainability from './pages/Sustainability';
import AIAssistant from './pages/AIAssistant';
import History from './pages/History';
import PredictionDetails from './pages/PredictionDetails';
import Profile from './pages/Profile';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="detect" element={<DiseaseDetection />} />
            <Route path="weather" element={<Weather />} />
            <Route path="irrigation" element={<SmartIrrigation />} />
            <Route path="sustainability" element={<Sustainability />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="history" element={<History />} />
            <Route path="history/:id" element={<PredictionDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
`;
fs.writeFileSync(path.join(srcDir, 'App.jsx'), appCode);

console.log('Phase 2 Scaffolding complete.');
