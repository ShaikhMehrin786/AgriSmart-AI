import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import HistoryView from './pages/HistoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState('detect');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'detect' && <Dashboard />}
      {activeTab === 'advisory' && <Dashboard />}
      {activeTab === 'history' && <HistoryView />}
    </div>
  );
}
