export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  iconName: string;
  requiredTrophies: number;
  coinReward: number;
  xpReward: number;
  trophyReward: number;
  questions: Question[];
}

export interface AvatarItem {
  id: string;
  name: string;
  image: string;
  price: number;
  isDefault?: boolean;
}

export interface CoinPackage {
  id: string;
  name: string;
  description: string;
  coins: number;
  diamondCost: number;
  bonusTag?: string;
  popular?: boolean;
}

export interface GameState {
  playerName: string;
  hasChangedNameOnce?: boolean; // First name change is free, subsequent costs 1 diamond
  coins: number;
  diamonds: number;
  timeFreezeCount?: number; // Count of "توقف زمان" powerups
  fiftyFiftyCount?: number; // Count of "حذف دو گزینه" powerups
  shieldCount?: number; // Count of "سپر محافظ" powerups
  hearts: number;
  maxHearts: number;
  lastHeartTimestamp: number; // Unix epoch ms
  xp: number;
  level: number;
  trophies: number;
  selectedAvatarId: string;
  ownedAvatarIds: string[];
  completedLevels: Record<number, { stars: number; highscore: number }>;
  claimedDiamondMilestones?: number[]; // To track 4-level completions
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  clanId?: string | null;
}

export interface Clan {
  id: string;
  name: string;
  badge: string;
  description: string;
  minTrophies: number;
  leaderId: string;
  leaderName: string;
  memberCount: number; // max 30
  totalTrophies: number;
  createdAt: number;
}

export interface ClanMember {
  id: string;
  clanId: string;
  userId: string;
  playerName: string;
  avatarId: string;
  trophies: number;
  level: number;
  role: 'leader' | 'elder' | 'member';
  joinedAt: number;
}

export interface ClanMessage {
  id: string;
  clanId: string;
  senderId: string;
  senderName: string;
  senderAvatarId?: string;
  senderRole?: string;
  text: string;
  type: 'chat' | 'system';
  createdAt: number;
}

export interface OnlineUserProfile {
  userId: string;
  friendCode: string;
  playerName: string;
  avatarId: string;
  trophies: number;
  level: number;
  isOnline: boolean;
  lastSeen: number;
  clanId?: string | null;
  clanName?: string | null;
  updatedAt?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatarId: string;
  fromTrophies: number;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface DuelMatch {
  id: string;
  hostUserId: string;
  hostName: string;
  hostAvatarId: string;
  hostScore: number;
  hostCurrentQ: number;
  hostFinished: boolean;
  guestUserId: string;
  guestName: string;
  guestAvatarId: string;
  guestScore: number;
  guestCurrentQ: number;
  guestFinished: boolean;
  status: 'waiting' | 'playing' | 'finished' | 'declined';
  questionIds: string[];
  winnerId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type ActiveScreen = 'loading' | 'main_menu' | 'levels' | 'quiz' | 'shop' | 'settings' | 'friends' | 'duel' | 'clan';

