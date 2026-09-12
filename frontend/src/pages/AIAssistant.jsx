import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import api from '../services/api';

const QUICK = [
  'How can I treat Early Blight?',
  'Best organic fungicide for tomatoes?',
  'Should I irrigate today?',
  'How to prevent Late Blight next season?',
  'Signs of Nitrogen deficiency?',
];

const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AgriSmart AI agronomist. Ask me anything about crop diseases, irrigation, pesticides, or farming best practices.',
      time: new Date(),
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', { message: msg });
      const reply = res.data?.data?.reply || res.data?.data?.answer || 'Sorry, I couldn\'t get a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m having trouble reaching the server. Please make sure the backend is running.',
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      time: new Date(),
    }]);
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="card" style={{
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        padding: '0.9rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AgriSmart AI Assistant</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>● Online · Agricultural Expert</div>
          </div>
        </div>
        <button className="btn-secondary" onClick={clearChat} style={{ fontSize: '0.8rem' }}>
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem',
        background: '#f8fafc',
        border: '1px solid var(--border-subtle)',
        borderTop: 'none', borderBottom: 'none',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: isUser ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 9,
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: isUser ? '#2563eb' : 'var(--primary-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isUser ? '#2563eb' : '#fff',
                  color: isUser ? '#fff' : 'var(--text-main)',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                <div style={{
                  fontSize: '0.7rem', color: 'var(--text-light)',
                  marginTop: 4,
                  textAlign: isUser ? 'right' : 'left',
                }}>
                  {fmt(msg.time)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{
              padding: '10px 16px', borderRadius: '14px 14px 14px 4px',
              background: '#fff', border: '1px solid var(--border-subtle)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0,1,2].map(j => (
                <span key={j} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--text-light)',
                  display: 'inline-block',
                  animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts + input */}
      <div className="card" style={{
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'var(--bg-card)',
      }}>
        {/* Quick chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              style={{
                flexShrink: 0, background: '#f0fdf4', border: '1px solid #bbf7d0',
                color: 'var(--primary-700)', fontSize: '0.75rem', fontWeight: 500,
                padding: '4px 12px', borderRadius: 9999, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); send(); }}
          style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask about diseases, irrigation, pesticides…"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim() || loading}
            style={{ padding: '0 1rem', flexShrink: 0 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
