import React from 'react';
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
