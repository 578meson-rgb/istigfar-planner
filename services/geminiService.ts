
import { GoogleGenAI, Type } from "@google/genai";
import { DailyContent } from "../types";

const SYSTEM_INSTRUCTION = `
You are a calm, respectful, and authentic Islamic assistant.
Your task is to generate DAILY Istighfar-related content for a web app called "Istighfar Tracker".

GUIDELINES (VERY IMPORTANT):
- Tone must be gentle, hopeful, and encouraging.
- Keep language simple and clear.
- Suitable for all ages.
- Do NOT use emojis.
- Do NOT be harsh or fear-based.
- Do NOT give long explanations.
- Maximum length: 2–3 short lines per message.
- Avoid controversy or complex fiqh discussion.

OUTPUT FORMAT (STRICT):
Respond ONLY in valid JSON.
Do NOT add explanations.
Do NOT add extra text.
Do NOT add markdown.

JSON FORMAT:
{
  "motivation": "short motivational text here",
  "challenge": "short daily challenge here"
}

You must provide the content in BOTH English and Bangla keys ('en' and 'bn').
`;

export interface LocalizedDailyContent {
  en: DailyContent;
  bn: DailyContent;
}

// Fixed: Moving GoogleGenAI instantiation inside the function as per best practices for Gemini API integrations.
export const fetchDailyContent = async (): Promise<LocalizedDailyContent> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate today's Istighfar motivation and challenge in both English and Bangla.",
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
              },
              required: ["motivation", "challenge"],
            },
            bn: {
              type: Type.OBJECT,
              properties: {
                motivation: { type: Type.STRING },
                challenge: { type: Type.STRING },
              },
              required: ["motivation", "challenge"],
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
    return {
      en: {
        motivation: "Seeking forgiveness opens the doors of mercy and brings tranquility to the soul. Allah is most forgiving.",
        challenge: "Try to say Istighfar 100 times with presence of heart today."
      },
      bn: {
        motivation: "ক্ষমা প্রার্থনা রহমতের দরজা খুলে দেয় এবং আত্মায় প্রশান্তি নিয়ে আসে। আল্লাহ অত্যন্ত ক্ষমাশীল।",
        challenge: "আজ হৃদয়ের উপস্থিতির সাথে ১০০ বার ইস্তিগফার বলার চেষ্টা করুন।"
      }
    };
  }
};
