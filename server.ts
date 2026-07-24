import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a calm, respectful, and authentic Islamic assistant.
Your task is to generate DAILY Istighfar-related content for a web app called "Istighfar Tracker".

GUIDELINES (VERY IMPORTANT):
- Tone must be gentle, hopeful, and encouraging.
- Keep language simple and clear.
- Do NOT use emojis.
- Do NOT be harsh or fear-based.
- Do NOT give long explanations.
- Maximum length: 2–3 short lines per message.

OUTPUT FORMAT (STRICT):
Respond ONLY in valid JSON.

JSON FORMAT:
{
  "en": {
    "motivation": "short motivational text here",
    "challenge": "short daily challenge here",
    "reflection": "a brief spiritual reflection or benefit of Istighfar"
  },
  "bn": {
    "motivation": "short motivational text here in Bengali",
    "challenge": "short daily challenge here in Bengali",
    "reflection": "a brief spiritual reflection or benefit of Istighfar in Bengali"
  }
}
`;

const fallbackContent = {
  en: {
    motivation: "Seeking forgiveness opens the doors of mercy and brings tranquility to the soul.",
    challenge: "Try to say Istighfar 100 times with presence of heart today.",
    reflection: "Istighfar is not just for sins; it is a way to purify the heart and draw closer to the Creator."
  },
  bn: {
    motivation: "ক্ষমা প্রার্থনা রহমতের দরজা খুলে দেয় এবং আত্মায় প্রশান্তি নিয়ে আসে।",
    challenge: "আজ হৃদয়ের উপস্থিতির সাথে ১০০ বার ইস্তিগফার বলার চেষ্টা করুন।",
    reflection: "ইস্তিগফার কেবল পাপের জন্য নয়; এটি হৃদয়কে শুদ্ধ করার এবং সৃষ্টিকর্তার নিকটবর্তী হওয়ার একটি উপায়।"
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for daily content
  app.get("/api/daily-content", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY or API_KEY found. Using fallback daily content.");
      return res.json(fallbackContent);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate today's Istighfar motivation, challenge, and reflection in both English and Bangla.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              en: {
                type: Type.OBJECT,
                properties: {
                  motivation: { type: Type.STRING },
                  challenge: { type: Type.STRING },
                  reflection: { type: Type.STRING },
                },
                required: ["motivation", "challenge", "reflection"],
              },
              bn: {
                type: Type.OBJECT,
                properties: {
                  motivation: { type: Type.STRING },
                  challenge: { type: Type.STRING },
                  reflection: { type: Type.STRING },
                },
                required: ["motivation", "challenge", "reflection"],
              },
            },
            required: ["en", "bn"],
          },
        },
      });

      const jsonStr = response.text?.trim() || "";
      const parsed = JSON.parse(jsonStr);
      return res.json(parsed);
    } catch (error) {
      console.error("Error generating daily content with Gemini:", error);
      return res.json(fallbackContent);
    }
  });

  // Vite middleware or static serve
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
