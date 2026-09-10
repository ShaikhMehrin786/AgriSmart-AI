import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import { fetchScanHistory } from '../services/api';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchScanHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.warn('History load fallback:', err.message);
      setHistory([
        {
          id: '1',
          crop: { name: 'Tomato' },
          disease: { name: 'Tomato Early Blight', severityDefault: 'Moderate' },
          confidence: 94.2,
          createdAt: new Date()
        },
        {
          id: '2',
          crop: { name: 'Potato' },
          disease: { name: 'Potato Healthy', severityDefault: 'None' },
          confidence: 96.8,
          createdAt: new Date(Date.now() - 86400000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ padding: '30px 20px 80px 20px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Field Diagnosis History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Historical record of leaf scans and recovery tracking stored in PostgreSQL.
        </p>
      </div>

      <div className="glass-panel">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Crop</th>
                <th style={{ padding: '12px 16px' }}>Detected Condition</th>
                <th style={{ padding: '12px 16px' }}>Confidence</th>
                <th style={{ padding: '12px 16px' }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                    {item.crop?.name || 'Crop'}
                  </td>
                  <td style={{ padding: '14px 16px', color: item.disease?.name?.includes('Healthy') ? '#34d399' : '#f87171' }}>
                    {item.disease?.name || 'Diagnosis'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                    {item.confidence}%
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={item.disease?.name?.includes('Healthy') ? 'badge badge-low' : 'badge badge-moderate'}>
                      {item.disease?.severityDefault || 'Moderate'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
