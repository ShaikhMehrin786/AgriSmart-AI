import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Leaf, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const PAGE_SIZE = 10;

const Skeleton = () => (
  <tr>
    {[1,2,3,4,5].map(i => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ height: 16, borderRadius: 4 }} />
      </td>
    ))}
  </tr>
);

const History = () => {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');   // 'all' | 'healthy' | 'diseased'
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    api.get('/predictions/history')
      .then(r => { if (r.data.success) setHistory(r.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(item => {
    const matchSearch =
      item.disease?.toLowerCase().includes(search.toLowerCase()) ||
      item.crop?.toLowerCase().includes(search.toLowerCase());
    const isHealthy = item.disease?.toLowerCase().includes('healthy');
    const matchFilter =
      filter === 'all' ||
      (filter === 'healthy'  && isHealthy) ||
      (filter === 'diseased' && !isHealthy);
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [search, filter]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Prediction History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All your past crop scans and diagnoses.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search size={15} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="input"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search crop or disease…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all',      label: 'All' },
            { id: 'healthy',  label: 'Healthy' },
            { id: 'diseased', label: 'Diseased' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: filter === f.id ? 'var(--primary-600)' : '#fff',
                color:      filter === f.id ? '#fff' : 'var(--text-muted)',
                borderColor: filter === f.id ? 'var(--primary-600)' : 'var(--border-subtle)',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-subtle)' }}>
                {['Date', 'Crop', 'Diagnosis', 'Confidence', 'Details'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1,2,3,4,5].map(i => <Skeleton key={i} />)
                : paged.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Leaf size={32} style={{ margin: '0 auto 10px', opacity: 0.35, display: 'block' }} />
                        {search || filter !== 'all'
                          ? 'No records match your filter.'
                          : <>No scans yet. <Link to="/dashboard/detect" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>Scan your first crop →</Link></>
                        }
                      </td>
                    </tr>
                  )
                  : paged.map((item, i) => {
                      const healthy = item.disease?.toLowerCase().includes('healthy');
                      return (
                        <tr key={item.id || i}
                          style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '13px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '13px 16px', fontWeight: 600 }}>{item.crop}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span className={`badge ${healthy ? 'badge-low' : 'badge-high'}`}>{item.disease}</span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ fontWeight: 700, color: item.confidence >= 85 ? '#16a34a' : '#d97706' }}>
                              {item.confidence}%
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <Link to={`/dashboard/history/${item.id}`}
                              style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}>
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.82rem', color: 'var(--text-muted)',
          }}>
            <span>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '4px 10px' }}>
                <ChevronLeft size={15} />
              </button>
              <button className="btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '4px 10px' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
