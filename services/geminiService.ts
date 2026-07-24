import { DailyContent } from "../types";

export interface EnhancedDailyContent extends DailyContent {
  reflection: string;
}

export interface LocalizedDailyContent {
  en: EnhancedDailyContent;
  bn: EnhancedDailyContent;
}

const fallback: LocalizedDailyContent = {
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

export const fetchDailyContent = async (): Promise<LocalizedDailyContent> => {
  try {
    const res = await fetch("/api/daily-content");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.en && data.bn) {
      return data as LocalizedDailyContent;
    }
    return fallback;
  } catch (error) {
    console.error("Error fetching daily content from backend:", error);
    return fallback;
  }
};
