import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Sprout, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { register as registerService } from '../services/authService';

const fields = [
  { name: 'name',     label: 'Full Name',      type: 'text',     placeholder: 'Ravi Kumar',           autoComplete: 'name' },
  { name: 'email',    label: 'Email',           type: 'email',    placeholder: 'ravi@example.com',     autoComplete: 'email' },
  { name: 'phone',    label: 'Phone',           type: 'tel',      placeholder: '+91 98765 43210',      autoComplete: 'tel' },
  { name: 'location', label: 'Location / Farm', type: 'text',     placeholder: 'Punjab, India',        autoComplete: 'address-level1' },
];

const Register = () => {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', location: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const toast     = useToast();
  const navigate  = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerService(form);
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to AgriSmart AI.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Sprout size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join AgriSmart AI — it's free</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {fields.map(f => (
            <div key={f.name}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>
                {f.label}
              </label>
              <input
                type={f.type}
                name={f.name}
                className="input"
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                required
              />
            </div>
          ))}

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', lineHeight: 0,
                }}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Confirm Password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              name="confirmPassword"
              className="input"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '0.65rem', marginTop: 4, fontSize: '0.95rem' }}
          >
            {loading ? <><Loader2 size={17} className="animate-spin" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
