import React, { useState, useContext } from 'react';
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
export default Login;