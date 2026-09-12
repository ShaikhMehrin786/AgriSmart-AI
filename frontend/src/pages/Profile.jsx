import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, MapPin, Phone, Save, X, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Profile = () => {
  const { user: ctxUser, logout, login } = useContext(AuthContext);
  const toast = useToast();

  const [profile,   setProfile]   = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form,      setForm]      = useState({ name: '', phone: '', location: '' });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState(false);

  useEffect(() => {
    // First: immediately populate from cached AuthContext so page is never blank
    if (ctxUser) {
      setProfile(ctxUser);
      setForm({
        name:     ctxUser.name     || '',
        phone:    ctxUser.phone    || '',
        location: ctxUser.location || '',
      });
      setLoading(false); // show cached data instantly
    }

    // Then: refresh from API in background
    api.get('/auth/profile')
      .then(r => {
        if (r.data.success && r.data.user) {
          setProfile(r.data.user);
          setForm({
            name:     r.data.user.name     || '',
            phone:    r.data.user.phone    || '',
            location: r.data.user.location || '',
          });
          setApiError(false);
        }
      })
      .catch(() => {
        // If we already have cached data, just show a soft warning
        if (!ctxUser) {
          setApiError(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      if (res.data.success) {
        setProfile(res.data.user);
        const token = localStorage.getItem('token');
        login(token, res.data.user);
        setIsEditing(false);
        toast.success('Profile updated!');
      } else {
        toast.error(res.data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Only show full-screen loader if we have nothing at all yet
  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
        Loading profile…
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // No data at all — not even cached
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Could not load profile.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
          Your session may have expired. Please log out and sign in again.
        </p>
        <button onClick={logout} className="btn-danger">
          <LogOut size={15} /> Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Profile</h1>

      {/* Soft warning if API was unreachable but we have cached data */}
      {apiError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: '#fef9c3', border: '1px solid #fde68a',
          fontSize: '0.82rem', color: '#854d0e',
        }}>
          <AlertTriangle size={15} />
          Showing cached profile — backend may be offline. Changes may not save.
        </div>
      )}

      {/* Avatar + name */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 800,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          {isEditing ? (
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full Name"
              style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}
            />
          ) : (
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{profile.name}</h2>
          )}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <MapPin size={13} />
            {isEditing ? (
              <input
                className="input"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Location / Farm"
                style={{ fontSize: '0.82rem', flex: 1 }}
              />
            ) : (
              <span>{profile.location || 'Location not set'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{
          fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4,
        }}>
          Account Details
        </h3>

        {/* Email — read-only */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', background: '#f9fafb', borderRadius: 'var(--radius-sm)',
        }}>
          <Mail size={16} color="var(--text-muted)" />
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{profile.email}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontStyle: 'italic' }}>read-only</span>
        </div>

        {/* Phone */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', background: '#f9fafb', borderRadius: 'var(--radius-sm)',
        }}>
          <Phone size={16} color="var(--text-muted)" />
          {isEditing ? (
            <input
              className="input"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
              style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, fontSize: '0.875rem', boxShadow: 'none', outline: 'none' }}
            />
          ) : (
            <span style={{ fontSize: '0.875rem' }}>{profile.phone || 'Phone not set'}</span>
          )}
        </div>

        {/* Member since */}
        {profile.createdAt && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', background: '#f9fafb', borderRadius: 'var(--radius-sm)',
          }}>
            <User size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Member since{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {saving
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Save size={15} /> Save Changes</>}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setForm({ name: profile.name || '', phone: profile.phone || '', location: profile.location || '' });
              }}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <X size={15} /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <User size={15} /> Edit Profile
            </button>
            <button
              onClick={logout}
              className="btn-danger"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <LogOut size={15} /> Logout
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Profile;
