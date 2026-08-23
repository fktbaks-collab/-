import React, { useEffect, useState } from 'react';
import { Heart, Coins, Trophy, Zap, Clock, Gem, Users, Swords } from 'lucide-react';
import { GameState } from '../types';
import { AVATAR_LIST } from '../data/quizData';
import { calculateLevelFromXP, getTimeUntilNextHeart } from '../utils/storage';

interface HeaderProps {
  gameState: GameState;
  incomingRequestsCount?: number;
  onOpenSettings?: () => void;
  onOpenShop?: () => void;
  onOpenFriends?: () => void;
  onOpenClan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  incomingRequestsCount = 0,
  onOpenSettings,
  onOpenShop,
  onOpenFriends,
  onOpenClan,
}) => {
  const currentAvatar = AVATAR_LIST.find((a) => a.id === gameState.selectedAvatarId) || AVATAR_LIST[0];
  const { level, currentLevelXp, nextLevelXp, progressPercent } = calculateLevelFromXP(gameState.xp);

  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      if (gameState.hearts < gameState.maxHearts) {
        const { minutes, seconds } = getTimeUntilNextHeart(gameState.lastHeartTimestamp);
        setTimeRemaining({ minutes, seconds });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [gameState.hearts, gameState.maxHearts, gameState.lastHeartTimestamp]);

  const isDark = gameState.theme === 'dark';

  return (
    <header
      id="game_header"
      className={`w-full px-3 py-2.5 rounded-2xl border transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-lg shadow-slate-950/50'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-md shadow-slate-200/50'
      }`}
    >
      {/* Top Row: Profile & Name + Stats Chips */}
      <div className="flex items-center justify-between gap-1.5">
        {/* Profile Avatar & Name */}
        <button
          id="btn_header_profile"
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-right group cursor-pointer shrink-0"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-amber-400/80 bg-slate-800 shadow-inner flex items-center justify-center">
              <img
                src={currentAvatar.image}
                alt={gameState.playerName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://api.dicebear.com/7.x/bottts/svg?seed=fallback';
                }}
              />
            </div>
            {/* Level badge overlapping avatar */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
              {level}
            </div>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-xs font-bold truncate max-w-[70px] sm:max-w-[90px] leading-tight">
              {gameState.playerName || 'بازیکن'}
            </span>
            <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-semibold">
              <Zap className="w-2.5 h-2.5 fill-amber-500" />
              <span>سطح {level}</span>
            </div>
          </div>
        </button>

        {/* Stats Row: Hearts, Diamonds, Coins, Friends, Trophies */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Online Friends & Duels Button */}
          <button
            id="btn_header_friends"
            onClick={onOpenFriends}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-black relative transition-all cursor-pointer ${
              isDark
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100'
            }`}
            title="دوستان و مسابقات آنلاین"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline text-[10px]">آنلاین</span>
            {incomingRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Hearts (Lives) */}
          <button
            id="btn_header_hearts"
            onClick={onOpenShop}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-black transition-all ${
              gameState.hearts === 0
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 animate-pulse ring-1 ring-rose-500/30'
                : isDark
                ? 'bg-slate-800/80 border-slate-700/80 text-rose-400 hover:border-rose-500/40'
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/70'
            }`}
            title="تعداد جان‌ها (برای خرید جان کلیک کنید)"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="font-mono text-xs">{gameState.hearts}</span>
            {gameState.hearts < gameState.maxHearts && (
              <span className="text-[8px] text-rose-400/80 font-mono hidden xs:inline flex items-center gap-0.5">
                <Clock className="w-2 h-2" />
                {String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
              </span>
            )}
          </button>

          {/* Diamonds (الماس) */}
          <button
            id="btn_header_diamonds"
            onClick={onOpenShop}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-black transition-colors ${
              isDark
                ? 'bg-slate-800 border-cyan-500/50 text-cyan-300 hover:bg-slate-700'
                : 'bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100'
            }`}
            title="الماس‌های شما (با بردن ۴ مرحله ۲ الماس دریافت می‌کنید)"
          >
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-xs">{gameState.diamonds ?? 0}</span>
          </button>

          {/* Coins */}
          <button
            id="btn_header_coins"
            onClick={onOpenShop}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-black transition-all ${
              isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
            }`}
            title="سکه شما"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-mono text-xs">{gameState.coins}</span>
          </button>

          {/* Trophies (کاپ / جام) */}
          <div
            id="badge_header_trophies"
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-black ${
              isDark
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}
            title="جام‌های کسب شده"
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/30" />
            <span className="font-mono text-xs">{gameState.trophies}</span>
          </div>
        </div>
      </div>


      {/* Bottom Row: XP Progress to next Level */}
      <div className="mt-2 pt-1.5 border-t border-slate-700/30 flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/40 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
          <span className="font-mono text-amber-400">{currentLevelXp}</span> / <span className="font-mono">{nextLevelXp}</span> XP
        </div>
      </div>
    </header>
  );
};
