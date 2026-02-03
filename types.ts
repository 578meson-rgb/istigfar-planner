
export interface DailyContent {
  motivation: string;
  challenge: string;
  reflection?: string;
}

export interface LogEntry {
  date: string; // ISO format YYYY-MM-DD
  count: number;
  target: number;
}

export interface PlannedTarget {
  date: string;
  target: number;
}

export type Theme = 'light' | 'dark';
export type View = 'home' | 'analytics' | 'planner';
export type Language = 'en' | 'bn';

export interface AppState {
  logs: LogEntry[];
  plannedTargets: PlannedTarget[];
  todayCount: number;
  todayTarget: number | null;
  dailyContent: DailyContent | null;
  isLoadingContent: boolean;
  theme: Theme;
  language: Language;
  currentView: View;
  error: string | null;
}
