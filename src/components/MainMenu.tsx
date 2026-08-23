import React from 'react';
import { motion } from 'motion/react';
import { Play, ShoppingBag, Settings, Sparkles, Heart, ShieldAlert, Award, Clock, Users, Swords, Shield, MessageSquare } from 'lucide-react';
import { GameState } from '../types';
import { soundManager } from '../utils/audio';

interface MainMenuProps {
  gameState: GameState;
  incomingRequestsCount?: number;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenFriends: () => void;
  onOpenClan: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  gameState,
  incomingRequestsCount = 0,
  onStartGame,
  onOpenShop,
  onOpenSettings,
  onOpenFriends,
  onOpenClan,
}) => {
  const isDark = gameState.theme === 'dark';
  const hasNoHearts = gameState.hearts <= 0;

  const handleStart = () => {
    soundManager.playClick();
    onStartGame();
  };

  const handleShop = () => {
    soundManager.playClick();
    onOpenShop();
  };

  const handleSettings = () => {
    soundManager.playClick();
    onOpenSettings();
  };

  const handleFriends = () => {
    soundManager.playClick();
    onOpenFriends();
  };

  const handleClan = () => {
    soundManager.playClick();
    onOpenClan();
  };


  return (
    <div className="flex flex-col items-center justify-between flex-1 w-full py-4 space-y-6">
      {/* Hero Banner / Game Title Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/30 shadow-xl text-center flex flex-col items-center"
      >
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <Sparkles className="w-24 h-24 text-amber-400" />
        </div>

        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-1 mb-3 shadow-lg shadow-orange-500/20 flex items-center justify-center"
        >
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Award className="w-10 h-10 text-amber-400" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-black text-white tracking-wide drop-shadow">
          کویـیز مسـتر هوشمند
        </h2>
        <p className="text-xs text-indigo-200 mt-1 font-medium max-w-xs">
          دانش خود را محک بزنید، رکورد بشکنید و جوایز ویژه بگیرید!
        </p>

        {/* Free Heart Notification Pill */}
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 border border-indigo-400/20 rounded-full text-[11px] text-indigo-300">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>هر ۱ ساعت، ۱ جان رایگان هدیه بگیرید</span>
        </div>
      </motion.div>

      {/* Out of Hearts Warning Card if 0 lives */}
      {hasNoHearts && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div className="text-right">
              <h4 className="text-xs font-black text-rose-300">جان‌های شما تمام شده!</h4>
              <p className="text-[11px] text-rose-200/80">برای بازی کردن جان بخرید یا منتظر بمانید.</p>
            </div>
          </div>
          <button
            onClick={handleShop}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            خرید جان
          </button>
        </motion.div>
      )}

      {/* Main Action Buttons */}
      <div className="w-full space-y-3">
        {/* START GAME BUTTON */}
        <motion.button
          id="btn_start_game"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-lg shadow-xl shadow-orange-500/25 border-t border-amber-300 flex items-center justify-center gap-3 cursor-pointer relative overflow-hidden group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <span className="tracking-wide">شـروع بـازی مـراحـل</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.button>

        {/* ONLINE DUEL & FRIENDS BUTTON */}
        <motion.button
          id="btn_open_friends"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleFriends}
          className={`w-full py-3.5 px-5 rounded-2xl border font-bold text-base flex items-center justify-between cursor-pointer transition-all shadow-md relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 hover:bg-slate-800/90 border-cyan-500/50 text-slate-100'
              : 'bg-cyan-50/70 hover:bg-cyan-100/70 border-cyan-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span>دوستان و مسابقات آنلاین</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-lg font-black flex items-center gap-1">
              <Swords className="w-3 h-3" />
              <span>دوئل زنده</span>
            </span>
            {incomingRequestsCount > 0 && (
              <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce">
                {incomingRequestsCount}
              </span>
            )}
          </div>
        </motion.button>

        {/* CLANS & GUILDS BUTTON (UP TO 30 MEMBERS + CHAT) */}
        <motion.button
          id="btn_open_clan"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleClan}
          className={`w-full py-3.5 px-5 rounded-2xl border font-bold text-base flex items-center justify-between cursor-pointer transition-all shadow-md relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:bg-slate-800/90 border-indigo-500/50 text-slate-100'
              : 'bg-indigo-50/70 hover:bg-indigo-100/70 border-indigo-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span>اتحاد و گروه‌ها (Clans)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold border border-indigo-500/40">
                  ۳۰ نفره
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow">
              <MessageSquare className="w-3 h-3" />
              <span>چت و عضویت</span>
            </span>
          </div>
        </motion.button>

        {/* SHOP BUTTON */}
        <motion.button
          id="btn_open_shop"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleShop}
          className={`w-full py-3.5 px-5 rounded-2xl border font-bold text-base flex items-center justify-between cursor-pointer transition-all shadow-md ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 text-slate-100'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <span>فروشگاه و صرافی الماس</span>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold">
            خرید سکه، جان و آواتار
          </span>
        </motion.button>

        {/* SETTINGS BUTTON */}
        <motion.button
          id="btn_open_settings"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSettings}
          className={`w-full py-3.5 px-5 rounded-2xl border font-bold text-base flex items-center justify-between cursor-pointer transition-all shadow-md ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 text-slate-100'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <span>تنظیمات و پروفایل من</span>
          </div>
          <span className="text-xs text-slate-400">تغییر نام، تم و آواتار</span>
        </motion.button>
      </div>


      {/* Footer Offline Badge */}
      <div className="w-full flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium pt-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>حالت کاملا آفلاین فعال است • بدون نیاز به اینترنت</span>
      </div>
    </div>
  );
};
