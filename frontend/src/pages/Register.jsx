import React, { useState, useContext } from 'react';
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
export default Register;