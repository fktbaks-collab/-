import { GameState } from '../types';

const STORAGE_KEY = 'quiz_game_master_state_v1';
export const HEART_REGEN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour = 3600000 ms

export const DEFAULT_INITIAL_STATE: GameState = {
  playerName: 'بازیکن قهرمان',
  hasChangedNameOnce: false,
  coins: 30,
  diamonds: 2,
  timeFreezeCount: 1, // Start with 1 free freeze item to try
  fiftyFiftyCount: 1, // Start with 1 free 50:50 item to try
  shieldCount: 1, // Start with 1 free shield item to try
  hearts: 3,
  maxHearts: 5,
  lastHeartTimestamp: Date.now(),
  xp: 0,
  level: 1,
  trophies: 0,
  selectedAvatarId: 'avatar_default_1',
  ownedAvatarIds: ['avatar_default_1', 'avatar_default_2'],
  completedLevels: {},
  claimedDiamondMilestones: [],
  theme: 'dark',
  soundEnabled: true,
};

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INITIAL_STATE;
    const parsed = JSON.parse(raw);
    const state: GameState = {
      ...DEFAULT_INITIAL_STATE,
      ...parsed,
      diamonds: typeof parsed.diamonds === 'number' ? parsed.diamonds : DEFAULT_INITIAL_STATE.diamonds,
      timeFreezeCount: typeof parsed.timeFreezeCount === 'number' ? parsed.timeFreezeCount : DEFAULT_INITIAL_STATE.timeFreezeCount,
      fiftyFiftyCount: typeof parsed.fiftyFiftyCount === 'number' ? parsed.fiftyFiftyCount : DEFAULT_INITIAL_STATE.fiftyFiftyCount,
      shieldCount: typeof parsed.shieldCount === 'number' ? parsed.shieldCount : DEFAULT_INITIAL_STATE.shieldCount,
      hasChangedNameOnce: typeof parsed.hasChangedNameOnce === 'boolean' ? parsed.hasChangedNameOnce : false,
      claimedDiamondMilestones: Array.isArray(parsed.claimedDiamondMilestones) ? parsed.claimedDiamondMilestones : [],
    };
    return checkAndRegenHearts(state);
  } catch (err) {
    console.error('Error loading game state:', err);
    return DEFAULT_INITIAL_STATE;
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving game state:', err);
  }
}

export function checkAndRegenHearts(state: GameState): GameState {
  if (state.hearts >= state.maxHearts) {
    return {
      ...state,
      lastHeartTimestamp: Date.now(),
    };
  }

  const now = Date.now();
  const elapsed = now - (state.lastHeartTimestamp || now);
  const heartsToAdd = Math.floor(elapsed / HEART_REGEN_INTERVAL_MS);

  if (heartsToAdd > 0) {
    const newHearts = Math.min(state.maxHearts, state.hearts + heartsToAdd);
    const newTimestamp = now - (elapsed % HEART_REGEN_INTERVAL_MS);
    const updatedState: GameState = {
      ...state,
      hearts: newHearts,
      lastHeartTimestamp: newTimestamp,
    };
    saveGameState(updatedState);
    return updatedState;
  }

  return state;
}

export function getTimeUntilNextHeart(lastTimestamp: number): { minutes: number; seconds: number; totalSeconds: number } {
  const now = Date.now();
  const elapsed = now - (lastTimestamp || now);
  const remainingMs = Math.max(0, HEART_REGEN_INTERVAL_MS - (elapsed % HEART_REGEN_INTERVAL_MS));
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, totalSeconds };
}

export function calculateLevelFromXP(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  const xpPerLevel = 100;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  return { level, currentLevelXp, nextLevelXp, progressPercent };
}
