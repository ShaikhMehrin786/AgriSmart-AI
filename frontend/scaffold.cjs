const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirs = [
  'components',
  'pages',
  'layouts',
  'services',
  'hooks',
  'context',
  'utils',
  'assets',
  'styles'
];

dirs.forEach(d => {
  const p = path.join(srcDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// Configure Tailwind
fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-green': '#2ecc71',
        'agri-dark': '#27ae60',
      }
    },
  },
  plugins: [],
}`);

fs.writeFileSync(path.join(srcDir, 'index.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 font-sans;
  }
}
`);

// Mock api config
fs.writeFileSync(path.join(srcDir, 'services', 'api.js'), `import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`);

// Mock auth service
fs.writeFileSync(path.join(srcDir, 'services', 'authService.js'), `import api from './api';

// MOCK SERVICES
export const login = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-jwt-token', user: { id: 1, name: 'Farmer John', email, location: 'California' } } });
    }, 1000);
  });
};

export const register = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { token: 'mock-jwt-token', user: { id: 1, ...userData } } });
    }, 1000);
  });
};
`);

// Auth Context
fs.writeFileSync(path.join(srcDir, 'context', 'AuthContext.jsx'), `import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
`);

// Layouts
fs.writeFileSync(path.join(srcDir, 'layouts', 'MainLayout.jsx'), `import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-agri-green">AgriSmart AI</Link>
          <div className="space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-agri-green">Login</Link>
            <Link to="/register" className="bg-agri-green text-white px-4 py-2 rounded shadow hover:bg-agri-dark">Register</Link>
          </div>
        </div>
      </nav>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>&copy; {new Date().getFullYear()} AgriSmart AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
`);

fs.writeFileSync(path.join(srcDir, 'layouts', 'DashboardLayout.jsx'), `import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Droplets, Cloud, User, Leaf, History, Bot, LogOut } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Disease Detection', path: '/dashboard/detect', icon: <Leaf size={20} /> },
    { name: 'Weather', path: '/dashboard/weather', icon: <Cloud size={20} /> },
    { name: 'Smart Irrigation', path: '/dashboard/irrigation', icon: <Droplets size={20} /> },
    { name: 'Sustainability', path: '/dashboard/sustainability', icon: <Leaf size={20} /> }, // Replace with chart icon
    { name: 'AI Assistant', path: '/dashboard/assistant', icon: <Bot size={20} /> },
    { name: 'History', path: '/dashboard/history', icon: <History size={20} /> },
    { name: 'Profile', path: '/dashboard/profile', icon: <User size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col hidden md:flex">
        <div className="p-6 border-b">
          <Link to="/" className="text-2xl font-bold text-agri-green">AgriSmart AI</Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex items-center space-x-3 p-3 rounded text-gray-700 hover:bg-green-50 hover:text-agri-green transition-colors">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center space-x-3 text-red-500 hover:text-red-700 w-full p-2">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
            <span className="font-bold text-xl text-agri-green">AgriSmart AI</span>
            <button className="p-2 bg-gray-200 rounded">Menu</button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
`);


// Pages
const pages = {
  'LandingPage.jsx': `import React from 'react';
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
export default LandingPage;`,

  'Login.jsx': `import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login as loginService } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('farmer@agrismart.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginService(email, password);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 w-full border rounded" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-agri-green text-white p-2 rounded hover:bg-agri-dark">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center">Don't have an account? <Link to="/register" className="text-agri-green">Register</Link></p>
      </div>
    </div>
  );
};
export default Login;`,

  'Dashboard.jsx': `import React, { useContext } from 'react';
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
export default Dashboard;`,

  'DiseaseDetection.jsx': `import React, { useState } from 'react';
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
export default DiseaseDetection;`,
};

Object.keys(pages).forEach(page => {
  fs.writeFileSync(path.join(srcDir, 'pages', page), pages[page]);
});

// App.jsx
fs.writeFileSync(path.join(srcDir, 'App.jsx'), `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DiseaseDetection from './pages/DiseaseDetection';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            {/* Add Register page later */}
            <Route path="/register" element={<Navigate to="/login" />} />
          </Route>
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="detect" element={<DiseaseDetection />} />
            {/* Mock other routes pointing to dashboard for now */}
            <Route path="*" element={<div className="p-8">Page under construction (Placeholder)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
`);

// main.jsx
fs.writeFileSync(path.join(srcDir, 'main.jsx'), `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`);

console.log('Scaffolding complete.');
