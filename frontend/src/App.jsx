import React from 'react';
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
