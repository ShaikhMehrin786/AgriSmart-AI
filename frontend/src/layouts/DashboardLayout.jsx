import React, { useContext } from 'react';
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
