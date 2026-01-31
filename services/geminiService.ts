
import { GoogleGenAI, Type } from "@google/genai";
import { DailyContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a calm, respectful, and authentic Islamic assistant.
Your task is to generate DAILY Istighfar-related content for a web app called "Istighfar Tracker".

GUIDELINES:
- Tone must be gentle, hopeful, and encouraging.
- Keep language simple and clear.
- Suitable for all ages.
- Do NOT use emojis.
- Do NOT be harsh or fear-based.
- Do NOT give long explanations.
- Maximum length: 2–3 short lines per message.
- Avoid controversy or complex fiqh discussion.

CONTENT REQUIRED:
1) A short Istighfar MOTIVATION focused on Allah's mercy, forgiveness, or peace.
2) A short DAILY CHALLENGE that is simple and achievable.
`;

export const fetchDailyContent = async (): Promise<DailyContent> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate today's Istighfar motivation and challenge.",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: {
              type: Type.STRING,
              description: "A short motivational text about Istighfar.",
            },
            challenge: {
              type: Type.STRING,
              description: "A short daily challenge related to Istighfar.",
            },
          },
          required: ["motivation", "challenge"],
        },
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as DailyContent;
  } catch (error) {
    console.error("Error fetching daily content:", error);
    // Fallback content in case of API failure
    return {
      motivation: "Seeking forgiveness opens the doors of mercy and brings tranquility to the soul. Allah is most forgiving.",
      challenge: "Try to say Istighfar 100 times with presence of heart today."
    };
  }
};
