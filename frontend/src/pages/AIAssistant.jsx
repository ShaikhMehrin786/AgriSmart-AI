import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AgriSmart AI assistant. How can I help you with your farm today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setMessages([...newMsgs, { role: 'assistant', content: 'Based on your current crop data and local weather, I suggest reviewing your irrigation schedule. The recent soil moisture readings indicate adequate hydration.' }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-white rounded shadow">
      <div className="p-4 bg-agri-green text-white font-bold rounded-t flex items-center space-x-2">
        <Bot /> <span>AgriSmart Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-green-100 text-green-600 mr-2'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[70%]">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-2"><Bot size={20} /></div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-800 flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2 mb-2 overflow-x-auto">
          {["How can I treat Early Blight?", "Should I irrigate today?", "What's the weather like?"].map((q, i) => (
            <button key={i} onClick={() => setInput(q)} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-3 py-1 whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your crops..." className="flex-1 border p-2 rounded focus:outline-none focus:border-agri-green" />
          <button type="submit" disabled={!input.trim() || loading} className="bg-agri-green text-white p-2 rounded hover:bg-agri-dark">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default AIAssistant;