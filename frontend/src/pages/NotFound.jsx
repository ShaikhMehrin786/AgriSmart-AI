import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
       style={{ background: 'var(--bg-base)' }}>
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: 'var(--color-agri-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '1.5rem'
    }}>
      <Sprout size={36} color="var(--primary-600)" />
    </div>
    <h1 className="text-6xl font-extrabold mb-3" style={{ color: 'var(--primary-600)' }}>404</h1>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h2>
    <p className="text-gray-500 mb-8 max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" className="btn-primary" style={{ textDecoration: 'none', padding: '0.65rem 1.5rem' }}>
      <ArrowLeft size={16} /> Back to Home
    </Link>
  </div>
);

export default NotFound;
