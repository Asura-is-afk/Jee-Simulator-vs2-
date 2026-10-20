import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Swords,
  FlaskConical,
  AlertTriangle,
  Menu,
  X,
  Zap,
  Flame,
  Trophy,
  Target,
  Calendar,
  Coins,
  ChevronRight,
  TrendingUp,
  Clock,
  BookOpen,
  Atom,
  Calculator,
  Beaker,
  Check,
  AlertOctagon,
  Terminal,
  XCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Bookmark,
  Plus,
  Trash2,
  PartyPopper,
  Skull,
  Timer,
  Star,
  AlertCircle,
  Upload,
  Play,
  FileText,
  Edit3,
  Save,
  ChevronUp,
  ChevronDown,
  Award,
  Percent,
  BarChart3,
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface UserStats {
  hunterName: string;
  level: number;
  rank: string;
  currentXp: number;
  nextLevelXp: number;
  streak: number;
  currency: number;
  lastCheckInDate: string;
}

interface Chapter {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Math';
  progress: number;
  totalQuestions: number;
  completedQuestions: number;
  unlocked: boolean;
}

interface BookmarkedChapter {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Math';
  addedAt: string;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  baseTarget: number;
  penaltyMultiplier: number;
}

interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  deadline: string;
}

interface MistakeEntry {
  id: string;
  questionId: string;
  chapterId: string;
  subject: 'Physics' | 'Chemistry' | 'Math';
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
  reviewed: boolean;
  notes: string;
  testName?: string;
}

interface TestHistoryEntry {
  id: string;
  testName: string;
  subject: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  date: string;
  rank?: number;
  xpEarned?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
}

interface TerminalLogEntry {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  xpChange?: number;
}

interface ExamQuestion {
  id: number;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  userAnswer?: 'A' | 'B' | 'C' | 'D';
}

interface ExamConfig {
  testName: string;
  subject: 'Physics' | 'Chemistry' | 'Math';
  numQuestions: number;
  totalMinutes: number;
  fileName?: string;
}

interface AppState {
  userStats: UserStats;
  activeTab: 'dashboard' | 'quests' | 'simulator' | 'mistakes';
  chapters: Chapter[];
  weeklyQuests: WeeklyQuest[];
  mistakeInventory: MistakeEntry[];
  testHistory: TestHistoryEntry[];
  checkedInDays: string[];
  terminalLog: TerminalLogEntry[];
  bookmarkedChapters: BookmarkedChapter[];
  weeklyChallenges: WeeklyChallenge[];
  weekStartDate: string;
}

type AppAction =
  | { type: 'SET_ACTIVE_TAB'; payload: AppState['activeTab'] }
  | { type: 'UPDATE_USER_STATS'; payload: Partial<UserStats> }
  | { type: 'UPDATE_CHAPTER'; payload: { id: string; updates: Partial<Chapter> } }
  | { type: 'UPDATE_QUEST'; payload: { id: string; updates: Partial<WeeklyQuest> } }
  | { type: 'ADD_MISTAKE'; payload: MistakeEntry }
  | { type: 'UPDATE_MISTAKE'; payload: { id: string; notes: string } }
  | { type: 'DELETE_MISTAKE'; payload: string }
  | { type: 'MARK_MISTAKE_REVIEWED'; payload: string }
  | { type: 'ADD_TEST_HISTORY'; payload: TestHistoryEntry }
  | { type: 'CHECK_IN_DAY'; payload: { date: string; xp: number; currency: number; streak: number } }
  | { type: 'APPLY_PENALTY'; payload: { xpPenalty: number; newStreak: number; newLevel?: number; newRank?: string; newXp?: number; nextLevelXp?: number } }
  | { type: 'ADD_TERMINAL_LOG'; payload: TerminalLogEntry }
  | { type: 'ADD_BOOKMARKED_CHAPTER'; payload: BookmarkedChapter }
  | { type: 'REMOVE_BOOKMARKED_CHAPTER'; payload: string }
  | { type: 'CLAIM_CHAPTER_MASTERED'; payload: { id: string; xp: number } }
  | { type: 'UPDATE_WEEKLY_CHALLENGE'; payload: { id: string; progress: number; completed?: boolean } }
  | { type: 'RESET_WEEKLY_CHALLENGES'; payload: { penaltyMultiplier: number; weekStartDate: string } }
  | { type: 'APPLY_WEEKLY_PENALTY'; payload: { xpPenalty: number } }
  | { type: 'COMPLETE_ALL_CHALLENGES'; payload: { xpBonus: number } };

// =============================================================================
// CONSTANTS
// =============================================================================

const RANK_THRESHOLDS = [
  { rank: 'Bronze V', minLevel: 1, minXp: 0 },
  { rank: 'Bronze IV', minLevel: 2, minXp: 1000 },
  { rank: 'Bronze III', minLevel: 3, minXp: 2000 },
  { rank: 'Bronze II', minLevel: 4, minXp: 3500 },
  { rank: 'Bronze I', minLevel: 5, minXp: 5000 },
  { rank: 'Silver V', minLevel: 6, minXp: 7500 },
  { rank: 'Silver IV', minLevel: 7, minXp: 10000 },
  { rank: 'Silver III', minLevel: 8, minXp: 13000 },
  { rank: 'Silver II', minLevel: 9, minXp: 16500 },
  { rank: 'Silver I', minLevel: 10, minXp: 20000 },
  { rank: 'Gold V', minLevel: 11, minXp: 25000 },
  { rank: 'Gold IV', minLevel: 12, minXp: 30000 },
  { rank: 'Gold III', minLevel: 13, minXp: 36000 },
  { rank: 'Gold II', minLevel: 14, minXp: 43000 },
  { rank: 'Gold I', minLevel: 15, minXp: 50000 },
  { rank: 'Platinum V', minLevel: 16, minXp: 60000 },
  { rank: 'Diamond V', minLevel: 20, minXp: 100000 },
  { rank: 'Master', minLevel: 25, minXp: 200000 },
  { rank: 'Grandmaster', minLevel: 30, minXp: 350000 },
  { rank: 'Challenger', minLevel: 40, minXp: 500000 },
];

function getLevelFromXp(xp: number): { level: number; rank: string; nextLevelXp: number } {
  let currentLevel = 1;
  let currentRank = 'Bronze V';
  let nextLevelXp = 1000;

  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXp) {
      currentLevel = RANK_THRESHOLDS[i].minLevel + Math.floor((xp - RANK_THRESHOLDS[i].minXp) / 1000);
      currentRank = RANK_THRESHOLDS[i].rank;
      if (i < RANK_THRESHOLDS.length - 1) {
        nextLevelXp = RANK_THRESHOLDS[i + 1].minXp;
      } else {
        nextLevelXp = xp + 1000;
      }
      break;
    }
  }

  return { level: Math.max(1, currentLevel), rank: currentRank, nextLevelXp };
}

function getNextSundayMidnight(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() + daysUntilSunday);
  sunday.setHours(23, 59, 59, 999);
  if (daysUntilSunday === 0 && now.getHours() >= 23 && now.getMinutes() >= 59) {
    sunday.setDate(sunday.getDate() + 7);
  }
  return sunday;
}

function generateMockQuestions(count: number, subject: string): ExamQuestion[] {
  const questionTemplates: Record<string, string[]> = {
    Physics: [
      'A particle moves in a straight line with constant acceleration. If it covers distances of 10m and 20m in consecutive seconds, find the acceleration.',
      'Two bodies of masses m1 and m2 are connected by a light string passing over a smooth pulley. Find the acceleration of the system.',
      'A body is projected vertically upward with velocity u. Find the time to reach maximum height.',
      'Calculate the work done in moving a charge around a closed path in an electric field.',
      'A stone is dropped from the top of a tower. Find the time to reach the ground.',
      'The escape velocity from Earth is 11.2 km/s. What is the escape velocity from a planet with twice the radius and same density?',
      'A simple pendulum has time period T on Earth. What is the period on a planet with 2g gravity?',
      'Calculate the focal length of a convex lens when object is placed at 2f.',
      'Find the intensity of electric field due to a point charge at distance r.',
      'A gas is compressed adiabatically. What happens to its temperature?',
    ],
    Chemistry: [
      'The rate constant for a first order reaction is 2.3 x 10^-3 s^-1. Calculate t1/2.',
      'Which of the following has the highest ionization enthalpy?',
      'The pH of 0.001 M HCl solution is:',
      'In the reaction 2A + B -> Products, if concentration of A is doubled, rate becomes 4 times. What is the order with respect to A?',
      'Which of the following is strongest oxidizing agent?',
      'Calculate the bond order of O2 molecule.',
      'Identify the hybridization of carbon in acetylene.',
      'Which of the following shows maximum paramagnetic character?',
      'The IUPAC name of CH3-CH(OH)-CH3 is:',
      'Which of the following is a secondary alcohol?',
    ],
    Math: [
      'If A is a 3x3 matrix with |A| = 5, find |adj A|.',
      'The number of bijective functions from a set A to itself is 120. Find |A|.',
      'Evaluate: integral of sin^2(x) dx from 0 to pi/2.',
      'If f(x) = x^3 - 3x + 2, find the point of local minima.',
      'The probability that A speaks truth is 0.6 and B speaks truth is 0.8. Find the probability that they contradict each other.',
      'Solve: log2(x) + log2(x-2) = 3.',
      'Find the sum of series: 1 + 2 + 4 + 8 + ... + 2^n.',
      'If the lines x/1 = y/2 = z/3 and x/(k+1) = y/(k+2) = z/(k+3) intersect, find k.',
      'The area enclosed by the parabola y^2 = 4x and line x = 3 is:',
      'Find the coefficient of x^5 in the expansion of (1 + x + x^2)^10.',
    ],
  };

  const templates = questionTemplates[subject] || questionTemplates.Math;
  const questions: ExamQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    questions.push({
      id: i + 1,
      text: `Q${i + 1}: ${template}`,
      options: {
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D',
      },
      correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as 'A' | 'B' | 'C' | 'D',
    });
  }

  return questions;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialUserStats: UserStats = {
  hunterName: 'SOLO_LEVELER_JEE',
  level: 3,
  rank: 'Bronze III',
  currentXp: 1450,
  nextLevelXp: 3500,
  streak: 5,
  currency: 350,
  lastCheckInDate: '2026-06-25',
};

const initialChapters: Chapter[] = [
  {
    id: 'phy-units',
    name: 'Units & Dimensions',
    subject: 'Physics',
    progress: 35,
    totalQuestions: 120,
    completedQuestions: 42,
    unlocked: true,
  },
  {
    id: 'chem-goc',
    name: 'GOC',
    subject: 'Chemistry',
    progress: 12,
    totalQuestions: 150,
    completedQuestions: 18,
    unlocked: true,
  },
  {
    id: 'math-matrices',
    name: 'Matrices',
    subject: 'Math',
    progress: 0,
    totalQuestions: 100,
    completedQuestions: 0,
    unlocked: true,
  },
];

const initialWeeklyQuests: WeeklyQuest[] = [
  {
    id: 'quest-1',
    title: 'Physics Warm-Up',
    description: 'Complete 25 Physics questions',
    reward: 50,
    progress: 18,
    target: 25,
    completed: false,
    deadline: '2026-06-28',
  },
  {
    id: 'quest-2',
    title: 'Daily Grind',
    description: 'Maintain a 7-day streak',
    reward: 100,
    progress: 5,
    target: 7,
    completed: false,
    deadline: '2026-06-29',
  },
  {
    id: 'quest-3',
    title: 'Chemistry Master',
    description: 'Score 80%+ on a Chemistry test',
    reward: 75,
    progress: 0,
    target: 1,
    completed: false,
    deadline: '2026-06-30',
  },
];

const initialWeeklyChallenges: WeeklyChallenge[] = [
  {
    id: 'challenge-1',
    title: 'Solve 50 Math PYQs',
    description: 'Complete 50 Previous Year Questions from Mathematics',
    progress: 0,
    target: 50,
    completed: false,
    baseTarget: 50,
    penaltyMultiplier: 1,
  },
  {
    id: 'challenge-2',
    title: 'Finish GOC Revision',
    description: 'Complete full revision of General Organic Chemistry',
    progress: 0,
    target: 1,
    completed: false,
    baseTarget: 1,
    penaltyMultiplier: 1,
  },
  {
    id: 'challenge-3',
    title: 'Revise Physics Formula Sheets',
    description: 'Review and memorize all Physics formula sheets',
    progress: 0,
    target: 1,
    completed: false,
    baseTarget: 1,
    penaltyMultiplier: 1,
  },
];

const initialTestHistory: TestHistoryEntry[] = [
  {
    id: 'test-001',
    testName: 'Units & Dimensions - Chapter Test',
    subject: 'Physics',
    score: 32,
    totalQuestions: 40,
    timeTaken: 45,
    date: '2026-06-25',
    rank: 156,
    xpEarned: 160,
    correctAnswers: 8,
    incorrectAnswers: 0,
  },
];

const initialTerminalLogs: TerminalLogEntry[] = [
  {
    id: 'log-001',
    message: 'System initialized. Hunter profile loaded.',
    type: 'info',
    timestamp: '2026-06-26T08:00:00',
  },
  {
    id: 'log-002',
    message: 'Welcome back, SOLO_LEVELER_JEE.',
    type: 'success',
    timestamp: '2026-06-26T08:00:01',
  },
];

const initialState: AppState = {
  userStats: initialUserStats,
  activeTab: 'dashboard',
  chapters: initialChapters,
  weeklyQuests: initialWeeklyQuests,
  mistakeInventory: [],
  testHistory: initialTestHistory,
  checkedInDays: ['2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'],
  terminalLog: initialTerminalLogs,
  bookmarkedChapters: [],
  weeklyChallenges: initialWeeklyChallenges,
  weekStartDate: new Date().toISOString().split('T')[0],
};

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

const STORAGE_KEY = 'solo_leveler_app_state';

const loadStateFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppState;
      return {
        userStats: { ...initialUserStats, ...parsed.userStats },
        activeTab: parsed.activeTab || initialState.activeTab,
        chapters: parsed.chapters?.length ? parsed.chapters : initialState.chapters,
        weeklyQuests: parsed.weeklyQuests?.length ? parsed.weeklyQuests : initialState.weeklyQuests,
        mistakeInventory: parsed.mistakeInventory || [],
        testHistory: parsed.testHistory?.length ? parsed.testHistory : initialState.testHistory,
        checkedInDays: parsed.checkedInDays?.length ? parsed.checkedInDays : initialState.checkedInDays,
        terminalLog: parsed.terminalLog?.length ? parsed.terminalLog : initialState.terminalLog,
        bookmarkedChapters: parsed.bookmarkedChapters || [],
        weeklyChallenges: parsed.weeklyChallenges?.length ? parsed.weeklyChallenges : initialState.weeklyChallenges,
        weekStartDate: parsed.weekStartDate || initialState.weekStartDate,
      };
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return initialState;
};

const saveStateToStorage = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// =============================================================================
// STATE CONTEXT & REDUCER
// =============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'UPDATE_USER_STATS':
      return { ...state, userStats: { ...state.userStats, ...action.payload } };
    case 'UPDATE_CHAPTER':
      return {
        ...state,
        chapters: state.chapters.map((ch) =>
          ch.id === action.payload.id ? { ...ch, ...action.payload.updates } : ch
        ),
      };
    case 'UPDATE_QUEST':
      return {
        ...state,
        weeklyQuests: state.weeklyQuests.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };
    case 'ADD_MISTAKE':
      return { ...state, mistakeInventory: [...state.mistakeInventory, action.payload] };
    case 'UPDATE_MISTAKE':
      return {
        ...state,
        mistakeInventory: state.mistakeInventory.map((m) =>
          m.id === action.payload.id ? { ...m, notes: action.payload.notes } : m
        ),
      };
    case 'DELETE_MISTAKE':
      return {
        ...state,
        mistakeInventory: state.mistakeInventory.filter((m) => m.id !== action.payload),
      };
    case 'MARK_MISTAKE_REVIEWED':
      return {
        ...state,
        mistakeInventory: state.mistakeInventory.map((m) =>
          m.id === action.payload ? { ...m, reviewed: true } : m
        ),
      };
    case 'ADD_TEST_HISTORY':
      return { ...state, testHistory: [action.payload, ...state.testHistory] };
    case 'CHECK_IN_DAY':
      return {
        ...state,
        userStats: {
          ...state.userStats,
          currentXp: state.userStats.currentXp + action.payload.xp,
          currency: state.userStats.currency + action.payload.currency,
          streak: action.payload.streak,
          lastCheckInDate: action.payload.date,
        },
        checkedInDays: [...state.checkedInDays, action.payload.date],
      };
    case 'APPLY_PENALTY':
      return {
        ...state,
        userStats: {
          ...state.userStats,
          currentXp: action.payload.newXp ?? Math.max(0, state.userStats.currentXp + action.payload.xpPenalty),
          streak: action.payload.newStreak,
          level: action.payload.newLevel ?? state.userStats.level,
          rank: action.payload.newRank ?? state.userStats.rank,
          nextLevelXp: action.payload.nextLevelXp ?? state.userStats.nextLevelXp,
        },
      };
    case 'ADD_TERMINAL_LOG':
      return {
        ...state,
        terminalLog: [action.payload, ...state.terminalLog].slice(0, 50),
      };
    case 'ADD_BOOKMARKED_CHAPTER':
      return {
        ...state,
        bookmarkedChapters: [...state.bookmarkedChapters, action.payload],
      };
    case 'REMOVE_BOOKMARKED_CHAPTER':
      return {
        ...state,
        bookmarkedChapters: state.bookmarkedChapters.filter((ch) => ch.id !== action.payload),
      };
    case 'CLAIM_CHAPTER_MASTERED':
      return {
        ...state,
        bookmarkedChapters: state.bookmarkedChapters.filter((ch) => ch.id !== action.payload.id),
        userStats: {
          ...state.userStats,
          currentXp: state.userStats.currentXp + action.payload.xp,
        },
      };
    case 'UPDATE_WEEKLY_CHALLENGE':
      return {
        ...state,
        weeklyChallenges: state.weeklyChallenges.map((c) =>
          c.id === action.payload.id
            ? { ...c, progress: action.payload.progress, completed: action.payload.completed ?? c.completed }
            : c
        ),
      };
    case 'RESET_WEEKLY_CHALLENGES':
      return {
        ...state,
        weeklyChallenges: state.weeklyChallenges.map((c) => ({
          ...c,
          progress: 0,
          completed: false,
          target: c.baseTarget * action.payload.penaltyMultiplier,
          penaltyMultiplier: action.payload.penaltyMultiplier,
        })),
        weekStartDate: action.payload.weekStartDate,
      };
    case 'APPLY_WEEKLY_PENALTY':
      return {
        ...state,
        userStats: {
          ...state.userStats,
          currentXp: Math.max(0, state.userStats.currentXp + action.payload.xpPenalty),
        },
      };
    case 'COMPLETE_ALL_CHALLENGES':
      return {
        ...state,
        userStats: {
          ...state.userStats,
          currentXp: state.userStats.currentXp + action.payload.xpBonus,
        },
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setActiveTab: (tab: AppState['activeTab']) => void;
  addTerminalLog: (message: string, type: TerminalLogEntry['type'], xpChange?: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = React.useReducer(appReducer, undefined, loadStateFromStorage);

  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  const setActiveTab = useCallback((tab: AppState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const addTerminalLog = useCallback((message: string, type: TerminalLogEntry['type'], xpChange?: number) => {
    const logEntry: TerminalLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      xpChange,
    };
    dispatch({ type: 'ADD_TERMINAL_LOG', payload: logEntry });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, setActiveTab, addTerminalLog }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

function StatBar({ value, max, label, showNumbers = true }: { value: number; max: number; label: string; showNumbers?: boolean }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-cyber-muted uppercase tracking-wider">{label}</span>
        {showNumbers && (
          <span className="text-cyber-green font-mono">
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        )}
      </div>
      <div className="stat-bar-bg">
        <div className="stat-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SubjectIcon({ subject, className = '' }: { subject: string; className?: string }) {
  const iconClass = `w-4 h-4 ${className}`;
  switch (subject) {
    case 'Physics':
      return <Atom className={iconClass} />;
    case 'Chemistry':
      return <Beaker className={iconClass} />;
    case 'Math':
      return <Calculator className={iconClass} />;
    default:
      return <BookOpen className={iconClass} />;
  }
}

function getSubjectColor(subject: string): string {
  switch (subject) {
    case 'Physics':
      return 'text-blue-400';
    case 'Chemistry':
      return 'text-purple-400';
    case 'Math':
      return 'text-cyber-cyan';
    default:
      return 'text-cyber-muted';
  }
}
// =============================================================================
// CONFETTI MODAL
// =============================================================================

function ConfettiModal({ isOpen, onClose, xpGained }: { isOpen: boolean; onClose: () => void; xpGained: number }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative cyber-panel border-2 border-cyber-green max-w-md w-full p-8 text-center animate-fade-in overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#00ff88', '#00f0ff', '#ffff00', '#ff00ff'][i % 4],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyber-green/20 flex items-center justify-center">
            <PartyPopper className="w-12 h-12 text-cyber-green animate-bounce" />
          </div>
          <h2 className="font-arcade text-2xl text-cyber-green mb-2 neon-text-green tracking-wider">
            CONFETTI EXPLOSION!
          </h2>
          <p className="font-arcade text-4xl text-yellow-500 mb-4">+{xpGained} XP</p>
          <p className="text-cyber-muted text-sm mb-6">Chapter Mastered! Great work, Hunter!</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-arcade text-sm rounded hover:bg-cyber-green/30 transition-colors"
          >
            AWESOME!
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MISSION FAILED MODAL
// =============================================================================

function MissionFailedModal({ isOpen, onClose, xpPenalty, nextMultiplier }: { isOpen: boolean; onClose: () => void; xpPenalty: number; nextMultiplier: number }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative cyber-panel border-2 border-red-500 max-w-md w-full p-8 text-center animate-fade-in">
        <div className="absolute inset-0 bg-red-500/5" />
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <Skull className="w-14 h-14 text-red-500" />
          </div>
          <h2 className="font-arcade text-2xl text-red-500 mb-2 neon-text-red tracking-wider">
            MISSION FAILED
          </h2>
          <p className="font-arcade text-red-400 mb-4">// TIME HAS EXPIRED //</p>
          <div className="cyber-panel-inset p-4 mb-4 text-left space-y-2 border border-red-500/30">
            <p className="text-red-400 font-mono text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {xpPenalty} XP Penalty Applied
            </p>
            <p className="text-red-400 font-mono text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Next week targets DOUBLED!
            </p>
            <p className="text-yellow-500 font-mono text-sm flex items-center gap-2">
              <Star className="w-4 h-4" />
              Penalty Multiplier: x{nextMultiplier}
            </p>
          </div>
          <p className="text-cyber-muted text-xs mb-6">
            Your weekly challenges were incomplete. The system has penalized your profile.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-500/20 border border-red-500 text-red-500 font-arcade text-sm rounded hover:bg-red-500/30 transition-colors"
          >
            ACCEPT FATE
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STREAK BROKEN MODAL
// =============================================================================

function StreakBrokenModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative cyber-panel border-2 border-red-500 max-w-md w-full p-6 text-center animate-fade-in">
        <div className="absolute inset-0 bg-red-500/5" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="font-arcade text-xl text-red-500 mb-2 neon-text-red tracking-wider">
            STREAK BROKEN
          </h2>
          <p className="font-arcade text-sm text-red-400 mb-4">// SYSTEM REBOOT //</p>
          <div className="cyber-panel-inset p-4 mb-4 text-left space-y-2 border border-red-500/30">
            <p className="text-red-400 font-mono text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              -200 XP Penalty Applied
            </p>
            <p className="text-red-400 font-mono text-sm flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak Reset to 0
            </p>
            <p className="text-red-400 font-mono text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Level/Rank Recalculated
            </p>
          </div>
          <p className="text-cyber-muted text-xs mb-4">
            You missed a day. Your hunter profile has been penalized. Rise again.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-500/20 border border-red-500 text-red-500 font-arcade text-sm rounded hover:bg-red-500/30 transition-colors"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXAM PORTAL (FULL SCREEN MOCK INTERFACE)
// =============================================================================

interface ExamPortalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  onComplete: (results: { score: number; correct: number; incorrect: number; questions: ExamQuestion[] }) => void;
}

function ExamPortal({ isOpen, onClose, config, onComplete }: ExamPortalProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.totalMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuestions(generateMockQuestions(config.numQuestions, config.subject));
      setCurrentQuestion(0);
      setTimeLeft(config.totalMinutes * 60);
      setIsSubmitted(false);
    }
  }, [isOpen, config]);

  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === currentQuestion + 1 ? { ...q, userAnswer: answer } : q))
    );
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      if (q.userAnswer) {
        if (q.userAnswer === q.correctAnswer) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const score = (correct * 4) - (incorrect * 1);
    onComplete({ score: Math.max(0, score), correct, incorrect, questions });
  };

  const answeredCount = questions.filter((q) => q.userAnswer).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-cyber-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="border-b border-cyber-border bg-cyber-dark p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-cyber-cyan" />
            <div>
              <h1 className="font-arcade text-lg text-cyber-green neon-text-green">{config.testName}</h1>
              <p className="text-xs text-cyber-muted">{config.subject} | {config.numQuestions} Questions</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-cyber-muted uppercase">Answered</p>
              <p className="font-mono text-lg text-cyber-cyan">{answeredCount}/{config.numQuestions}</p>
            </div>
            <div className={`cyber-panel-inset px-4 py-2 ${timeLeft < 60 ? 'border-2 border-red-500' : ''}`}>
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-cyber-green'}`} />
                <span className={`font-arcade text-xl ${timeLeft < 60 ? 'text-red-500 neon-text-red' : 'text-cyber-green neon-text-green'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            {timeLeft < 60 && (
              <span className="text-red-500 text-xs font-mono animate-pulse">TIME LOW!</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigator Sidebar */}
        <div className="w-64 border-r border-cyber-border bg-cyber-dark/50 p-4 overflow-y-auto">
          <h3 className="text-xs text-cyber-muted uppercase tracking-wider mb-3">Question Grid</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded flex items-center justify-center text-xs font-mono transition-all ${
                  currentQuestion === idx
                    ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan text-cyber-cyan'
                    : q.userAnswer
                    ? 'bg-cyber-green/20 border border-cyber-green text-cyber-green'
                    : 'bg-cyber-dark border border-cyber-border text-cyber-muted hover:border-cyber-cyan'
                }`}
              >
                {q.id}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-cyber-border space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-cyber-green/20 border border-cyber-green" />
              <span className="text-cyber-muted">Answered</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-cyber-dark border border-cyber-border" />
              <span className="text-cyber-muted">Not Answered</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-cyber-cyan/20 border-2 border-cyber-cyan" />
              <span className="text-cyber-muted">Current</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="w-full mt-4 py-3 bg-cyber-green/20 border-2 border-cyber-green text-cyber-green font-arcade text-sm rounded hover:bg-cyber-green/30 transition-colors disabled:opacity-50"
          >
            SUBMIT TEST
          </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {questions[currentQuestion] && (
            <div className="max-w-2xl mx-auto">
              <div className="cyber-panel p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="cyber-panel-inset px-3 py-1 font-arcade text-sm text-cyber-cyan">
                    Q{questions[currentQuestion].id}
                  </span>
                  <SubjectIcon subject={config.subject} className="text-cyber-green" />
                </div>
                <p className="text-white text-lg leading-relaxed">
                  {questions[currentQuestion].text}
                </p>
              </div>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4 ${
                      questions[currentQuestion].userAnswer === option
                        ? 'bg-cyber-green/20 border-2 border-cyber-green text-cyber-green'
                        : 'bg-cyber-dark border border-cyber-border text-white hover:border-cyber-cyan'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-arcade text-sm ${
                      questions[currentQuestion].userAnswer === option
                        ? 'bg-cyber-green text-cyber-black'
                        : 'bg-cyber-border text-white'
                    }`}>
                      {option}
                    </span>
                    <span className="text-sm">{questions[currentQuestion].options[option]}</span>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 bg-cyber-border/30 border border-cyber-border text-white font-mono text-sm rounded hover:bg-cyber-border/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                  className="px-6 py-2 bg-cyber-border/30 border border-cyber-border text-white font-mono text-sm rounded hover:bg-cyber-border/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXAM RESULTS MODAL
// =============================================================================

interface ExamResultsProps {
  isOpen: boolean;
  onClose: () => void;
  results: { score: number; correct: number; incorrect: number; questions: ExamQuestion[] } | null;
  config: ExamConfig;
  xpEarned: number;
}

function ExamResultsModal({ isOpen, onClose, results, config, xpEarned }: ExamResultsProps) {
  if (!isOpen || !results) return null;

  const percentage = Math.round((results.correct / config.numQuestions) * 100);
  const grade = percentage >= 90 ? 'S' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative cyber-panel border-2 border-cyber-green max-w-lg w-full p-8 text-center animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyber-green/20 flex items-center justify-center">
            <Award className="w-12 h-12 text-cyber-green" />
          </div>
          <h2 className="font-arcade text-2xl text-cyber-green mb-2 neon-text-green tracking-wider">
            EXAM COMPLETE
          </h2>
          <p className="font-arcade text-4xl text-yellow-500 mb-2">{grade}</p>
          <p className="text-cyber-muted text-sm mb-6">{percentage}% Score</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="cyber-panel-inset p-4">
              <p className="font-mono text-2xl text-cyber-green">{results.correct}</p>
              <p className="text-xs text-cyber-muted uppercase">Correct</p>
              <p className="text-[10px] text-cyber-green">+4 each</p>
            </div>
            <div className="cyber-panel-inset p-4">
              <p className="font-mono text-2xl text-red-400">{results.incorrect}</p>
              <p className="text-xs text-cyber-muted uppercase">Incorrect</p>
              <p className="text-[10px] text-red-400">-1 each</p>
            </div>
            <div className="cyber-panel-inset p-4">
              <p className="font-mono text-2xl text-cyber-cyan">{results.score}</p>
              <p className="text-xs text-cyber-muted uppercase">Score</p>
              <p className="text-[10px] text-cyber-cyan">Net Marks</p>
            </div>
          </div>

          <div className="cyber-panel-inset p-4 mb-6 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <span className="font-arcade text-xl text-yellow-500">+{xpEarned} XP Earned</span>
            </div>
          </div>

          <p className="text-cyber-muted text-xs mb-4">
            {results.incorrect > 0 ? `${results.incorrect} incorrect questions added to Mistake Inventory for review.` : 'Perfect! No mistakes to review.'}
          </p>

          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-arcade text-sm rounded hover:bg-cyber-green/30 transition-colors"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DAILY ATTENDANCE CALENDAR
// =============================================================================

function DailyAttendanceCalendar() {
  const { state, dispatch, addTerminalLog } = useApp();
  const { checkedInDays, userStats } = state;
  const [showStreakBroken, setShowStreakBroken] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const hasCheckedInToday = checkedInDays.includes(todayStr);

  useEffect(() => {
    const lastCheckIn = userStats.lastCheckInDate;
    const lastDate = new Date(lastCheckIn);
    const todayDate = new Date(todayStr);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1 && userStats.streak > 0) {
      handleApplyPenalty();
    }
  }, []);

  const handleCheckIn = () => {
    if (hasCheckedInToday) return;

    const newStreak = userStats.streak + 1;
    const xpReward = 150;
    const currencyReward = 50;

    dispatch({
      type: 'CHECK_IN_DAY',
      payload: {
        date: todayStr,
        xp: xpReward,
        currency: currencyReward,
        streak: newStreak,
      },
    });

    addTerminalLog(`+${xpReward} XP: Daily Attendance Claimed`, 'success', xpReward);
    addTerminalLog(`+${currencyReward} Credits: Streak Bonus`, 'success');

    const newXp = userStats.currentXp + xpReward;
    const { level, rank, nextLevelXp } = getLevelFromXp(newXp);
    if (level !== userStats.level || rank !== userStats.rank) {
      dispatch({
        type: 'UPDATE_USER_STATS',
        payload: { level, rank, nextLevelXp },
      });
      addTerminalLog(`LEVEL UP! Now Level ${level} - ${rank}`, 'warning');
    }
  };

  const handleApplyPenalty = () => {
    const xpPenalty = -200;
    const newXp = Math.max(0, userStats.currentXp + xpPenalty);
    const { level, rank, nextLevelXp } = getLevelFromXp(newXp);

    dispatch({
      type: 'APPLY_PENALTY',
      payload: {
        xpPenalty,
        newStreak: 0,
        newXp,
        newLevel: level,
        newRank: rank,
        nextLevelXp,
      },
    });

    addTerminalLog(`-200 XP: Missed Check-In Penalty`, 'error', -200);
    addTerminalLog(`STREAK RESET: Back to 0`, 'error');
    addTerminalLog(`Level adjusted to ${level} - ${rank}`, 'warning');

    setShowStreakBroken(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckedIn = checkedInDays.includes(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = new Date(dateStr) > today;

      days.push(
        <div
          key={day}
          className={`aspect-square flex items-center justify-center rounded-md text-xs font-mono transition-all duration-200 ${
            isCheckedIn
              ? 'bg-cyber-green/20 border-2 border-cyber-green neon-border-green text-cyber-green'
              : isToday
              ? 'bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan'
              : isFuture
              ? 'bg-cyber-dark/50 border border-cyber-border/30 text-cyber-muted/50'
              : 'bg-cyber-dark/30 border border-cyber-border/50 text-cyber-muted'
          }`}
        >
          {isCheckedIn ? <Check className="w-4 h-4" /> : day}
        </div>
      );
    }

    return days;
  };

  return (
    <>
      <StreakBrokenModal isOpen={showStreakBroken} onClose={() => setShowStreakBroken(false)} />

      <div className="cyber-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-arcade text-sm text-cyber-green flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Attendance
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-cyber-border/30 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-cyber-muted" />
            </button>
            <span className="font-mono text-sm text-cyber-cyan min-w-[120px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-cyber-border/30 rounded transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 text-cyber-muted" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[10px] font-mono text-cyber-muted uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-6">
          {renderCalendarDays()}
        </div>

        <div className="flex items-center gap-4 mb-6 text-xs justify-center">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-cyber-green/20 border-2 border-cyber-green" />
            <span className="text-cyber-muted">Checked In</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-cyber-cyan/10 border border-cyber-cyan" />
            <span className="text-cyber-muted">Today</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCheckIn}
            disabled={hasCheckedInToday}
            className={`w-full py-3 px-4 rounded-lg font-arcade text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              hasCheckedInToday
                ? 'bg-cyber-muted/20 border border-cyber-muted/30 text-cyber-muted cursor-not-allowed'
                : 'bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/30 neon-border-green animate-pulse-neon'
            }`}
          >
            {hasCheckedInToday ? (
              <>
                <Check className="w-5 h-5" />
                REWARD CLAIMED
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                CLAIM DAILY REWARD STREAK (+150 XP)
              </>
            )}
          </button>

          <button
            onClick={() => handleApplyPenalty()}
            className="w-full py-2 px-4 rounded-lg font-mono text-xs transition-all border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2"
          >
            <AlertOctagon className="w-4 h-4" />
            SIMULATE MISSED DAY PENALTY
          </button>
        </div>
      </div>
    </>
  );
}
// =============================================================================
// HACKER TERMINAL LOG
// =============================================================================

function HackerTerminalLog() {
  const { state } = useApp();
  const terminalRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLogColor = (type: TerminalLogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-cyber-green';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-cyber-cyan';
    }
  };

  const getLogPrefix = (type: TerminalLogEntry['type']) => {
    switch (type) {
      case 'success':
        return '[OK]';
      case 'error':
        return '[ERR]';
      case 'warning':
        return '[WARN]';
      case 'info':
      default:
        return '[INFO]';
    }
  };

  return (
    <div className="cyber-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border">
        <Terminal className="w-4 h-4 text-cyber-green" />
        <span className="font-mono text-xs text-cyber-green uppercase tracking-wider">Telemetry Feed</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[10px] text-cyber-muted">LIVE</span>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="h-64 md:h-80 overflow-y-auto space-y-1 font-mono text-xs cyber-panel-inset p-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {state.terminalLog.map((log) => (
          <div key={log.id} className="flex items-start gap-2 animate-fade-in">
            <span className="text-cyber-muted shrink-0">[{formatTimestamp(log.timestamp)}]</span>
            <span className={`${getLogColor(log.type)} shrink-0`}>{getLogPrefix(log.type)}</span>
            <span className={`${getLogColor(log.type)}`}>
              {log.message}
              {log.xpChange !== undefined && (
                <span className={`ml-2 ${log.xpChange > 0 ? 'text-cyber-green' : 'text-red-400'}`}>
                  ({log.xpChange > 0 ? '+' : ''}{log.xpChange} XP)
                </span>
              )}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-cyber-muted">
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WEEKLY COUNTDOWN TIMER
// =============================================================================

function WeeklyCountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const sundayMidnight = getNextSundayMidnight();
      const diff = sundayMidnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-panel-inset p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Timer className="w-5 h-5 text-red-500 animate-pulse" />
        <span className="font-arcade text-xs text-red-500 uppercase tracking-wider">Weekly Reset</span>
      </div>
      <div className="flex items-center justify-center gap-2 font-mono text-lg">
        <div className="cyber-panel-inset px-3 py-2">
          <span className="text-cyber-cyan">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-cyber-muted text-xs ml-1">D</span>
        </div>
        <span className="text-cyber-muted">:</span>
        <div className="cyber-panel-inset px-3 py-2">
          <span className="text-cyber-cyan">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-cyber-muted text-xs ml-1">H</span>
        </div>
        <span className="text-cyber-muted">:</span>
        <div className="cyber-panel-inset px-3 py-2">
          <span className="text-cyber-cyan">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-cyber-muted text-xs ml-1">M</span>
        </div>
        <span className="text-cyber-muted">:</span>
        <div className="cyber-panel-inset px-3 py-2">
          <span className="text-cyber-green">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-cyber-muted text-xs ml-1">S</span>
        </div>
      </div>
      <p className="text-[10px] text-cyber-muted mt-2 uppercase tracking-wider">Until Sunday Midnight</p>
    </div>
  );
}

// =============================================================================
// MOBILE HEADER
// =============================================================================

function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { state } = useApp();
  const { userStats } = state;

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 cyber-panel border-t-0 border-l-0 border-r-0 rounded-none px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-cyber-border/30 rounded transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-cyber-cyan" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyber-green animate-pulse-neon" />
          <span className="font-arcade text-cyber-green text-sm neon-text-green tracking-wider">
            SOLO LEVELER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-mono">{userStats.streak}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 font-mono">{userStats.currency}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// MOBILE BOTTOM NAVIGATION
// =============================================================================

function MobileBottomNav() {
  const { state, setActiveTab } = useApp();

  const tabs: { id: AppState['activeTab']; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'HUD' },
    { id: 'quests', icon: Swords, label: 'Quests' },
    { id: 'simulator', icon: FlaskConical, label: 'Sim' },
    { id: 'mistakes', icon: AlertTriangle, label: 'Mistakes' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 cyber-panel border-b-0 border-l-0 border-r-0 rounded-none">
      <div className="flex items-center justify-around py-2 px-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
              state.activeTab === id
                ? 'bg-cyber-green/10 border border-cyber-green/50 neon-border-green'
                : 'hover:bg-cyber-border/30'
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                state.activeTab === id ? 'text-cyber-green' : 'text-cyber-muted'
              }`}
            />
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                state.activeTab === id ? 'text-cyber-green neon-text-green' : 'text-cyber-muted'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// =============================================================================
// DESKTOP SIDEBAR HUD
// =============================================================================

function DesktopSidebar() {
  const { state, setActiveTab } = useApp();
  const { userStats, chapters } = state;

  const tabs: { id: AppState['activeTab']; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'quests', icon: Swords, label: 'Quest Board' },
    { id: 'simulator', icon: FlaskConical, label: 'Test Simulator' },
    { id: 'mistakes', icon: AlertTriangle, label: 'Mistake Vault' },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 fixed left-0 top-0 bottom-0 border-r border-cyber-border bg-cyber-dark scanline overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-50" />
      <div className="relative flex flex-col h-full">
        <div className="p-6 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-10 h-10 text-cyber-green animate-pulse-neon" />
              <div className="absolute inset-0 blur-md bg-cyber-green/30" />
            </div>
            <div>
              <h1 className="font-arcade text-lg text-cyber-green neon-text-green tracking-widest">
                SOLO LEVELER
              </h1>
              <p className="text-[10px] text-cyber-muted uppercase tracking-widest">
                JEE Edition v1.0
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-cyber-muted uppercase tracking-wider">Hunter ID</p>
              <p className="font-arcade text-sm text-cyber-cyan neon-text-cyan">{userStats.hunterName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-cyber-muted uppercase tracking-wider">Rank</p>
              <div className="flex items-center gap-1 justify-end">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-mono text-yellow-500">{userStats.rank}</span>
              </div>
            </div>
          </div>

          <div className="cyber-panel-inset p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-muted uppercase">Level</span>
              <span className="font-arcade text-2xl text-cyber-green neon-text-green">
                {userStats.level}
              </span>
            </div>
            <StatBar value={userStats.currentXp} max={userStats.nextLevelXp} label="XP Progress" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="cyber-panel-inset p-2 text-center">
              <Flame className="w-5 h-5 mx-auto text-orange-500" />
              <p className="font-mono text-lg text-orange-500 mt-1">{userStats.streak}</p>
              <p className="text-[9px] text-cyber-muted uppercase tracking-wider">Streak</p>
            </div>
            <div className="cyber-panel-inset p-2 text-center">
              <Coins className="w-5 h-5 mx-auto text-yellow-500" />
              <p className="font-mono text-lg text-yellow-500 mt-1">{userStats.currency}</p>
              <p className="text-[9px] text-cyber-muted uppercase tracking-wider">Credits</p>
            </div>
            <div className="cyber-panel-inset p-2 text-center">
              <Target className="w-5 h-5 mx-auto text-cyber-cyan" />
              <p className="font-mono text-lg text-cyber-cyan mt-1">
                {userStats.lastCheckInDate === new Date().toISOString().split('T')[0] ? 'YES' : 'NO'}
              </p>
              <p className="text-[9px] text-cyber-muted uppercase tracking-wider">Check-In</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-cyber-border space-y-3 flex-1 overflow-y-auto">
          <p className="text-xs text-cyber-muted uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Active Chapters
          </p>
          {chapters.map((chapter) => (
            <div key={chapter.id} className="cyber-panel-inset p-3 space-y-2">
              <div className="flex items-center gap-2">
                <SubjectIcon subject={chapter.subject} className="text-cyber-cyan" />
                <span className="text-sm text-white flex-1 truncate">{chapter.name}</span>
                <span className="text-xs text-cyber-green font-mono">{chapter.progress}%</span>
              </div>
              <StatBar
                value={chapter.completedQuestions}
                max={chapter.totalQuestions}
                label=""
                showNumbers={false}
              />
            </div>
          ))}
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                state.activeTab === id
                  ? 'bg-cyber-green/10 border border-cyber-green neon-border-green'
                  : 'hover:bg-cyber-border/30 border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${state.activeTab === id ? 'text-cyber-green' : 'text-cyber-muted'}`}
              />
              <span
                className={`font-mono text-sm ${
                  state.activeTab === id ? 'text-cyber-green' : 'text-cyber-muted'
                }`}
              >
                {label}
              </span>
              {state.activeTab === id && <ChevronRight className="w-4 h-4 text-cyber-green ml-auto" />}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// =============================================================================
// MOBILE DRAWER
// =============================================================================

function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, setActiveTab } = useApp();

  const tabs: { id: AppState['activeTab']; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'quests', icon: Swords, label: 'Quest Board' },
    { id: 'simulator', icon: FlaskConical, label: 'Test Simulator' },
    { id: 'mistakes', icon: AlertTriangle, label: 'Mistake Vault' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <div
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-80 cyber-panel border-r border-cyber-border transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyber-green" />
            <span className="font-arcade text-cyber-green neon-text-green">SOLO LEVELER</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cyber-border/30 rounded">
            <X className="w-5 h-5 text-cyber-muted" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                state.activeTab === id
                  ? 'bg-cyber-green/10 border border-cyber-green'
                  : 'hover:bg-cyber-border/30'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${state.activeTab === id ? 'text-cyber-green' : 'text-cyber-muted'}`}
              />
              <span
                className={`font-mono text-sm ${
                  state.activeTab === id ? 'text-cyber-green' : 'text-cyber-muted'
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// VIEW COMPONENTS - DASHBOARD
// =============================================================================

function DashboardView() {
  const { state } = useApp();
  const { userStats, chapters, testHistory } = state;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="cyber-panel p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-cyber-green animate-pulse-neon" />
            <div>
              <p className="text-cyber-muted text-sm uppercase tracking-wider">Welcome back,</p>
              <h2 className="font-arcade text-xl text-cyber-cyan neon-text-cyan">{userStats.hunterName}</h2>
            </div>
          </div>
          <p className="text-cyber-muted text-sm">
            Your journey to JEE mastery continues. Complete quests, level up, and dominate the ranks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-panel p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto text-yellow-500" />
          <p className="font-mono text-lg text-yellow-500 mt-2">{userStats.rank}</p>
          <p className="text-xs text-cyber-muted uppercase">Current Rank</p>
        </div>
        <div className="cyber-panel p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto text-cyber-green" />
          <p className="font-mono text-2xl text-cyber-green mt-2">Lv.{userStats.level}</p>
          <p className="text-xs text-cyber-muted uppercase">Level</p>
        </div>
        <div className="cyber-panel p-4 text-center">
          <Flame className="w-6 h-6 mx-auto text-orange-500" />
          <p className="font-mono text-2xl text-orange-500 mt-2">{userStats.streak}</p>
          <p className="text-xs text-cyber-muted uppercase">Day Streak</p>
        </div>
        <div className="cyber-panel p-4 text-center">
          <Coins className="w-6 h-6 mx-auto text-yellow-400" />
          <p className="font-mono text-2xl text-yellow-400 mt-2">{userStats.currency}</p>
          <p className="text-xs text-cyber-muted uppercase">Credits</p>
        </div>
      </div>

      <div className="cyber-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-arcade text-sm text-cyber-cyan">XP TELEMETRY</span>
          <span className="font-mono text-cyber-green text-lg">{userStats.currentXp.toLocaleString()} XP</span>
        </div>
        <StatBar value={userStats.currentXp} max={userStats.nextLevelXp} label="Next Level" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyAttendanceCalendar />
        <HackerTerminalLog />
      </div>

      <div className="cyber-panel p-6">
        <h3 className="font-arcade text-sm text-cyber-green mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Active Chapters
        </h3>
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="cyber-panel-inset p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SubjectIcon subject={chapter.subject} className="text-cyber-cyan" />
                  <span className="text-white font-medium">{chapter.name}</span>
                </div>
                <span className="text-cyber-green font-mono text-sm">{chapter.progress}%</span>
              </div>
              <StatBar
                value={chapter.completedQuestions}
                max={chapter.totalQuestions}
                label=""
                showNumbers={false}
              />
              <p className="text-xs text-cyber-muted mt-2">
                {chapter.completedQuestions} / {chapter.totalQuestions} questions completed
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="cyber-panel p-6">
        <h3 className="font-arcade text-sm text-cyber-cyan mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Tests
        </h3>
        {testHistory.length > 0 ? (
          <div className="space-y-3">
            {testHistory.slice(0, 3).map((test) => (
              <div key={test.id} className="cyber-panel-inset p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{test.testName}</p>
                  <p className="text-xs text-cyber-muted">{test.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-cyber-green">
                    {test.correctAnswers ?? test.score}/{test.totalQuestions}
                  </p>
                  <p className="text-xs text-cyber-muted">{Math.round((test.score / (test.totalQuestions * 4)) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-cyber-muted text-sm">No tests completed yet.</p>
        )}
      </div>
    </div>
  );
}

