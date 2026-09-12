import React, { useContext } from 'react';
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
export default Profile;