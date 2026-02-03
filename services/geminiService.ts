
import { GoogleGenAI, Type } from "@google/genai";
import { DailyContent } from "../types";

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
  "motivation": "short motivational text here",
  "challenge": "short daily challenge here",
  "reflection": "a brief spiritual reflection or benefit of Istighfar"
}

You must provide the content in BOTH English and Bangla keys ('en' and 'bn').
`;

export interface EnhancedDailyContent extends DailyContent {
  reflection: string;
}

export interface LocalizedDailyContent {
  en: EnhancedDailyContent;
  bn: EnhancedDailyContent;
}

export const fetchDailyContent = async (): Promise<LocalizedDailyContent> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as LocalizedDailyContent;
  } catch (error) {
    console.error("Error fetching daily content:", error);
    const fallback = {
      motivation: "Seeking forgiveness opens the doors of mercy and brings tranquility to the soul.",
      challenge: "Try to say Istighfar 100 times with presence of heart today.",
      reflection: "Istighfar is not just for sins; it is a way to purify the heart and draw closer to the Creator."
    };
    const fallbackBn = {
      motivation: "ক্ষমা প্রার্থনা রহমতের দরজা খুলে দেয় এবং আত্মায় প্রশান্তি নিয়ে আসে।",
      challenge: "আজ হৃদয়ের উপস্থিতির সাথে ১০০ বার ইস্তিগফার বলার চেষ্টা করুন।",
      reflection: "ইস্তিগফার কেবল পাপের জন্য নয়; এটি হৃদয়কে শুদ্ধ করার এবং সৃষ্টিকর্তার নিকটবর্তী হওয়ার একটি উপায়।"
    };
    return { en: fallback, bn: fallbackBn };
  }
};
