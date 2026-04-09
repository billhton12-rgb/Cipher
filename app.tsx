import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' /
// Ondoa import ya @google/genai hapa kwa usalama
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  BookOpen, 
  ExternalLink,
  Github
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const generateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setNotes(null);

    try {
      // 1. Fetch content kutoka URL kupitia backend
      const fetchResponse = await fetch("/api/fetch-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!fetchResponse.ok) throw new Error("Failed to fetch content");
      const { content } = await fetchResponse.json();

      // 2. Tuma content kwenda kwenye backend yetu ili ipate notes (API KEY IKO SIRI KULE)
      const aiResponse = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!aiResponse.ok) throw new Error("AI processing failed");
      const data = await aiResponse.json();

      setNotes(data.notes);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* KODI ZAKO ZA UI (Header, Hero, Input, Results) ZIBEKI VILE VILE HAPA CHINI */}
      {/* ... (Nakili UI uliyokuwa nayo awali hapa) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-900">
              br1te0n <span className="text-blue-500">ai</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
           <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Turn any link into <span className="text-blue-500 italic">perfect notes</span>
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 mb-12">
          <form onSubmit={generateNotes} className="space-y-4">
            <div className="relative">
              <input
                type="url"
                required
                placeholder="Paste article or video URL here..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <LinkIcon className="absolute left-4 top-5 text-slate-400 w-5 h-5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Generating Notes..." : "Generate Notes"}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {notes && (
            <motion.div ref={resultRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="notebook-paper p-8 bg-white border-l-8 border-blue-600 shadow-lg min-h-[400px]">
               <div className="flex justify-between mb-4">
                  <span className="font-bold text-blue-900 flex items-center gap-2"><BookOpen /> Study Notes</span>
                  <button onClick={copyToClipboard} className="text-sm text-blue-600 flex items-center gap-1">
                    {copied ? <Check /> : <Copy />} {copied ? "Copied!" : "Copy"}
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
