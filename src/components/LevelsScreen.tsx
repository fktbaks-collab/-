import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Lock,
  Play,
  Star,
  Trophy,
  Sparkles,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { GameState, Level } from '../types';
import { QUIZ_LEVELS } from '../data/quizData';
import { soundManager } from '../utils/audio';

interface LevelsScreenProps {
  gameState: GameState;
  onSelectLevel: (level: Level) => void;
  onBack: () => void;
  onOpenShop: () => void;
}

const LEVELS_PER_PAGE = 20;

export const LevelsScreen: React.FC<LevelsScreenProps> = ({
  gameState,
  onSelectLevel,
  onBack,
  onOpenShop,
}) => {
  const isDark = gameState.theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculate highest unlocked level
  const highestUnlockedLevelId = useMemo(() => {
    let maxUnlocked = 1;
    for (const level of QUIZ_LEVELS) {
      const prevCompleted = level.id === 1 || !!gameState.completedLevels[level.id - 1];
      const hasTrophies = gameState.trophies >= level.requiredTrophies;
      if (level.id === 1 || prevCompleted || hasTrophies) {
        if (level.id > maxUnlocked) {
          maxUnlocked = level.id;
        }
      }
    }
    return maxUnlocked;
  }, [gameState.completedLevels, gameState.trophies]);

  // Initial page based on current highest unlocked level
  const initialPage = Math.floor((highestUnlockedLevelId - 1) / LEVELS_PER_PAGE) + 1;
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Total won levels count
  const completedCount = useMemo(() => {
    return Object.values(gameState.completedLevels || {}).filter(
      (l: { stars?: number; highscore?: number } | undefined) => (l?.stars ?? 0) > 0
    ).length;
  }, [gameState.completedLevels]);

  // Filtered levels
  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return QUIZ_LEVELS;
    const query = searchQuery.trim().toLowerCase();
    return QUIZ_LEVELS.filter(
      (lvl) =>
        lvl.id.toString() === query ||
        lvl.title.toLowerCase().includes(query) ||
        lvl.subtitle.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredLevels.length / LEVELS_PER_PAGE);

  // Current page levels
  const displayedLevels = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredLevels.slice(0, 50); // Show top 50 matches if searching
    }
    const start = (currentPage - 1) * LEVELS_PER_PAGE;
    return filteredLevels.slice(start, start + LEVELS_PER_PAGE);
  }, [filteredLevels, currentPage, searchQuery]);

  const handleLevelClick = (level: Level, isUnlocked: boolean) => {
    if (!isUnlocked) {
      soundManager.playWrong();
      return;
    }

    const isAlreadyWon = (gameState.completedLevels[level.id]?.stars ?? 0) > 0;

    if (gameState.hearts <= 0 && !isAlreadyWon) {
      soundManager.playWrong();
      onOpenShop();
      return;
    }

    soundManager.playClick();
    onSelectLevel(level);
  };

  const jumpToLatestUnlocked = () => {
    soundManager.playClick();
    setSearchQuery('');
    const targetPage = Math.floor((highestUnlockedLevelId - 1) / LEVELS_PER_PAGE) + 1;
    setCurrentPage(targetPage);
  };

  return (
    <div className="flex flex-col flex-1 w-full py-2 space-y-3">
      {/* Top bar with back button & Title */}
      <div className="flex items-center justify-between">
        <button
          id="btn_levels_back"
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
          <span>بازگشت به منو</span>
        </button>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
              ۵۰۰ مرحله
            </span>
            <h2 className="text-base font-black">انتخاب مرحله</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            {completedCount} از {QUIZ_LEVELS.length} مرحله برنده شده
          </p>
        </div>
      </div>

      {/* Out of Hearts banner if 0 hearts */}
      {gameState.hearts <= 0 && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>برای شروع مرحله به حداقل ۱ جان نیاز دارید.</span>
          </div>
          <button
            onClick={onOpenShop}
            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
          >
            خرید جان
          </button>
        </div>
      )}

      {/* Quick Jump and Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره مرحله یا موضوع..."
            className={`w-full pr-8 pl-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors ${
              isDark
                ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
            }`}
          />
        </div>

        <button
          onClick={jumpToLatestUnlocked}
          title="رفتن به آخرین مرحله فعال"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>مرحله {highestUnlockedLevelId}</span>
        </button>
      </div>

      {/* Pagination Bar (when not searching) */}
      {!searchQuery.trim() && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              soundManager.playClick();
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${
              currentPage === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-200 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>قبلی</span>
          </button>

          {/* Quick Page Picker Range */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <span>
              مراحل {(currentPage - 1) * LEVELS_PER_PAGE + 1} تا{' '}
              {Math.min(currentPage * LEVELS_PER_PAGE, QUIZ_LEVELS.length)}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400">
              صفحه {currentPage} از {totalPages}
            </span>
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              soundManager.playClick();
              setCurrentPage((p) => Math.min(totalPages, p + 1));
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${
              currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-200 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <span>بعدی</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Levels List */}
      <div className="space-y-2.5 pb-6">
        {displayedLevels.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            مرحله‌ای با این عنوان یافت نشد.
          </div>
        ) : (
          displayedLevels.map((level, index) => {
            const prevCompleted = level.id === 1 || !!gameState.completedLevels[level.id - 1];
            const hasTrophies = gameState.trophies >= level.requiredTrophies;
            const isUnlocked = level.id === 1 || prevCompleted || hasTrophies;

            const levelProgress = gameState.completedLevels[level.id];
            const stars = levelProgress?.stars || 0;

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 10) * 0.03 }}
                className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 ${
                  !isUnlocked
                    ? 'opacity-60 bg-slate-900/40 border-slate-800'
                    : isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-700/80 shadow-md'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Level Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                        !isUnlocked
                          ? 'bg-slate-800 text-slate-500'
                          : stars > 0
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                          : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
                      }`}
                    >
                      {!isUnlocked ? <Lock className="w-4 h-4 text-slate-500" /> : level.id}
                    </div>

                    <div className="text-right truncate">
                      <div className="flex items-center gap-1.5 justify-start">
                        <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                          {level.title}
                        </h3>
                        {stars > 0 && (
                          <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                            تکمیل
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {level.subtitle}
                      </p>

                      {/* Stars and Rewards indicator */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= stars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Reward tags */}
                        {stars > 0 ? (
                          <span className="text-[9px] text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            حالت تمرینی (بدون ریسک جان)
                          </span>
                        ) : (
                          <>
                            <span className="text-[9px] text-amber-400 font-mono font-bold">
                              +{level.coinReward} سکه
                            </span>
                            <span className="text-[9px] text-indigo-400 font-mono font-bold">
                              +{level.trophyReward} کاپ
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Play / Lock Button */}
                  <div className="shrink-0">
                    {isUnlocked ? (
                      <button
                        id={`btn_play_level_${level.id}`}
                        onClick={() => handleLevelClick(level, isUnlocked)}
                        className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md ${
                          stars > 0
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-700">
                        {level.requiredTrophies} کاپ
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
