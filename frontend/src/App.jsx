import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Protected pages
import Dashboard from './pages/Dashboard';
import DiseaseDetection from './pages/DiseaseDetection';
import Weather from './pages/Weather';
import SmartIrrigation from './pages/SmartIrrigation';
import Sustainability from './pages/Sustainability';
import AIAssistant from './pages/AIAssistant';
import History from './pages/History';
import PredictionDetails from './pages/PredictionDetails';
import Profile from './pages/Profile';

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ── */}
          <Route element={<MainLayout />}>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* ── Protected dashboard ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<Dashboard />} />
            <Route path="detect"        element={<DiseaseDetection />} />
            <Route path="weather"       element={<Weather />} />
            <Route path="irrigation"    element={<SmartIrrigation />} />
            <Route path="sustainability" element={<Sustainability />} />
            <Route path="assistant"     element={<AIAssistant />} />
            <Route path="history"       element={<History />} />
            <Route path="history/:id"   element={<PredictionDetails />} />
            <Route path="profile"       element={<Profile />} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
