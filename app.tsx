import { useState, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
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

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
      // 1. Fetch content from the URL via our backend
      const fetchResponse = await fetch("/api/fetch-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!fetchResponse.ok) {
        const errData = await fetchResponse.json();
        throw new Error(errData.error || "Failed to fetch content");
      }

      const { content } = await fetchResponse.json();

      // 2. Use Gemini to generate notes
      const prompt = `
        You are a smart, helpful student taking notes for a friend. 
        Summarize the following content into simple, student-friendly English notes.
        
        Style Requirements:
        - Use clear, simple English.
        - Use bullet points for key concepts.
        - Include a "Big Idea" summary at the top.
        - Use a friendly, encouraging tone.
        - Keep it concise but comprehensive.
        
        Content to summarize:
        ${content}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const generatedText = response.text;
      if (!generatedText) throw new Error("AI failed to generate notes.");

      setNotes(generatedText);
      
      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-deep rounded-xl flex items-center justify-center shadow-lg shadow-brand-soft">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-deep">
              br1te0n <span className="text-brand-light">ai</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-brand-deep transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
          >
            Turn any link into <span className="text-brand-light italic">perfect notes</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Paste an article or video link below. Our AI will create student-friendly, 
            simplified notes just for you.
          </motion.p>
        </div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-xl shadow-brand-soft/50 border border-brand-soft mb-12"
        >
          <form onSubmit={generateNotes} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <LinkIcon className="text-slate-400 w-5 h-5" />
              </div>
              <input
                type="url"
                required
                placeholder="Paste article or video URL here..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition-all text-slate-800"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg",
                loading 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-brand-deep text-white hover:bg-blue-900 hover:shadow-brand-light/20 active:scale-[0.98]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Notes
                </>
              )}
            </button>
          </form>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2"
            >
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {notes && (
            <motion.div 
              ref={resultRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-6 pb-20"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-brand-deep font-bold">
                  <BookOpen className="w-5 h-5" />
                  <span>Your Study Notes</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-brand-deep hover:border-brand-deep transition-all shadow-sm active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm font-medium">Copy Notes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notebook Paper */}
              <div className="notebook-paper group">
                <div className="notebook-content">
                  <ReactMarkdown 
                    components={{
                      h1: ({children}) => <h1 className="text-3xl font-bold mb-6 text-brand-deep underline decoration-brand-light/30">{children}</h1>,
                      h2: ({children}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-deep">{children}</h2>,
                      p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc mb-6 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="ml-4">{children}</li>,
                      strong: ({children}) => <strong className="text-brand-deep font-bold">{children}</strong>,
                    }}
                  >
                    {notes}
                  </ReactMarkdown>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-12 h-12 text-brand-deep" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm italic">
                  Notes generated by br1te0n ai • Based on: 
                  <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand-light hover:underline inline-flex items-center gap-1">
                    Source Link <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!notes && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <BookOpen className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium">Your notes will appear here</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} br1te0n ai. Built for students, by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
