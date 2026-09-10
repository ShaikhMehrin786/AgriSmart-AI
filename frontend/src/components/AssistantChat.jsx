import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';
import { sendAssistantQuery } from '../services/api';

export default function AssistantChat({ prediction, weather }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Namaste! I am your AgriSmart AI agronomist. Ask me anything about ${prediction?.crop || 'your crop'}, disease management, or spraying advice.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Can I spray fungicide today?',
    'What organic remedy works best?',
    'How do I prevent this next season?'
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendAssistantQuery(textToSend, prediction, weather);
      setMessages(prev => [...prev, { role: 'assistant', text: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '⚠️ Network connection issue. Please verify backend server is running.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '12px' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '8px', borderRadius: '8px' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Grounded AI Agronomist</h3>
            <p style={{ fontSize: '0.7rem', color: '#34d399' }}>● Grounded in active leaf scan & weather</p>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.05)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.85rem',
              whiteSpace: 'pre-line'
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Consulting agronomy database & weather forecast...
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0' }}>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '9999px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in English or Hindi (e.g., Kya spray karun?)..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0 16px' }} disabled={loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
