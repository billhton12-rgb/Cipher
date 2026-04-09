import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini upande wa Server (Siri yako inakaa hapa)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  // API 1: Fetch content kutoka URL (Ulishakuwa nayo)
  app.post("/api/fetch-content", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      $("script, style").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      res.json({ content: text.substring(0, 10000) });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch content from the URL." });
    }
  });

  // API 2: Generate Notes (Hapa ndipo AI inafanyia kazi kwa siri)
  app.post("/api/generate-notes", async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a smart, helpful student taking notes for a friend. 
      Summarize the following content into simple, student-friendly English notes.
      Style Requirements:
      - Use clear, simple English.
      - Use bullet points for key concepts.
      - Include a "Big Idea" summary at the top.
      - Use a friendly, encouraging tone.
      Content: ${content}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ notes: response.text() });
    } catch (error: any) {
      console.error("AI Error:", error.message);
      res.status(500).json({ error: "AI failed to generate notes." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
