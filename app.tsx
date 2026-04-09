import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Copy, Check, Sparkles, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './index.css';

// Hapa ndipo Logic ya App yako inapoanza
function App() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const generateNotes = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setNotes(data.notes);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error("Error generating notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-2 flex items-center justify-center gap-3">
          <Sparkles className="text-blue-600" /> br1te0n ai
        </h1>
        <p className="text-gray-600">Badilisha link yoyote kuwa Study Notes za kueleweka</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-3 text-gray-400 size-5" />
              <input 
                type="text" 
                placeholder="Paste link hapa (mfano: Wikipedia...)" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button 
              onClick={generateNotes}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "Inachakata..." : "Tengeneza"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {notes && (
            <motion.div 
              ref={resultRef} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="notebook-paper p-8 bg-white border-l-8 border-blue-600 shadow-lg min-h-[400px] rounded-r-xl"
            >
               <div className="flex justify-between mb-4 border-b pb-4">
                  <span className="font-bold text-blue-900 flex items-center gap-2"><BookOpen /> Study Notes</span>
                  <button onClick={copyToClipboard} className="text-sm text-blue-600 flex items-center gap-1 font-medium">
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                  </button>
               </div>
               <div className="prose prose-blue max-w-none">
                 <ReactMarkdown>{notes}</ReactMarkdown>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// HII NDIYO SEHEMU MUHIMU ILIYOKUWA INAKOSEKANA:
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
