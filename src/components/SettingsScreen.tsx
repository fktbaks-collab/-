import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Moon, Sun, Volume2, VolumeX, Check, ChevronRight, ShoppingBag, Edit3, ShieldAlert, Sparkles, Gem, AlertCircle, Info, Code2, X, Heart } from 'lucide-react';
import { GameState } from '../types';
import { AVATAR_LIST } from '../data/quizData';
import { soundManager } from '../utils/audio';

interface SettingsScreenProps {
  gameState: GameState;
  onUpdateName: (name: string) => void;
  onSelectAvatar: (avatarId: string) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenShop: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  gameState,
  onUpdateName,
  onSelectAvatar,
  onToggleTheme,
  onToggleSound,
  onOpenShop,
  onBack,
}) => {
  const [nameInput, setNameInput] = useState(gameState.playerName);
  const [savedNameNotice, setSavedNameNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const isDark = gameState.theme === 'dark';
  const isFirstChange = !gameState.hasChangedNameOnce;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (trimmed === gameState.playerName) {
      setErrorMessage('نام جدید مشابه نام فعلی است.');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    // Check diamond requirement if not first time
    if (!isFirstChange) {
      if ((gameState.diamonds ?? 0) < 1) {
        soundManager.playWrong();
        setErrorMessage('⚠️ برای تغییر مجدد نام به ۱ الماس نیاز دارید! الماس کافی ندارید.');
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
    }

    soundManager.playClick();
    onUpdateName(trimmed);
    setErrorMessage(null);
    setSavedNameNotice(isFirstChange ? '✓ نام شما به صورت رایگان تغییر یافت.' : '💎 نام شما با پرداخت ۱ الماس با موفقیت تغییر یافت.');
    setTimeout(() => setSavedNameNotice(null), 3000);
  };

  const handleSelectAvatarClick = (id: string) => {
    soundManager.playClick();
    onSelectAvatar(id);
  };

  // Avatars owned by player
  const ownedAvatars = AVATAR_LIST.filter((a) => gameState.ownedAvatarIds.includes(a.id));

  return (
    <div className="flex flex-col flex-1 w-full py-2 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn_settings_back"
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
          <span>بازگشت</span>
        </button>

        <div className="text-right">
          <h2 className="text-base font-black flex items-center gap-1.5 justify-end">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>تنظیمات و پروفایل</span>
          </h2>
          <p className="text-[11px] text-slate-400">شخصی‌سازی حساب و بازی</p>
        </div>
      </div>

      {/* SECTION 1: CHANGE PLAYER NAME */}
      <div
        className={`p-4 rounded-3xl border ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-400" />
            <span>تغییر نام بازیکن</span>
          </h3>

          {isFirstChange ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold">
              تغییر اول: رایگان
            </span>
          ) : (
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
              <Gem className="w-3 h-3 text-cyan-400" />
              <span>هزینه: ۱ الماس</span>
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          {isFirstChange
            ? 'اولین تغییر نام شما کاملاً رایگان است. برای تغییرات بعدی نیاز به ۱ الماس خواهید داشت.'
            : `برای تغییر مجدد نام باید ۱ الماس پرداخت کنید. (الماس فعلی شما: ${gameState.diamonds ?? 0})`}
        </p>

        <form onSubmit={handleSaveName} className="space-y-2.5">
          <div className="flex gap-2">
            <input
              id="input_player_name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="نام خود را وارد کنید..."
              maxLength={20}
              className={`flex-1 px-3.5 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              id="btn_save_player_name"
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isFirstChange ? 'ثبت رایگان' : 'پرداخت ۱ 💎 و ثبت'}</span>
            </button>
          </div>

          {errorMessage && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-rose-400 font-bold flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </motion.p>
          )}

          {savedNameNotice && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-emerald-400 font-semibold"
            >
              {savedNameNotice}
            </motion.p>
          )}
        </form>
      </div>

      {/* SECTION 2: OWNED AVATARS SELECTION */}
      <div
        className={`p-4 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>تصاویر پروفایل خریداری شده و فعال</span>
          </h3>
          <button
            onClick={onOpenShop}
            className="text-[11px] text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>خرید بیشتر</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          روی هر کدام از پروفایل‌های خریداری شده یا موجود ضربه بزنید تا به عنوان تصویر شما انتخاب شود:
        </p>

        {/* Owned Avatars Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {ownedAvatars.map((avatar) => {
            const isSelected = gameState.selectedAvatarId === avatar.id;
            return (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelectAvatarClick(avatar.id)}
                className={`p-3 rounded-2xl border text-right flex flex-col items-center gap-2 cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/15'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}

                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-slate-700 bg-slate-800 shadow-inner flex items-center justify-center">
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://api.dicebear.com/7.x/bottts/svg?seed=avatar';
                    }}
                  />
                </div>

                <div className="text-center w-full">
                  <span className="text-xs font-black block text-white truncate">
                    {avatar.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold mt-0.5 inline-block ${
                      isSelected ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ انتخاب شده' : 'برای انتخاب کلیک کنید'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: THEME & SOUND CONTROLS */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${
          isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
        }`}
      >
        <h3 className="text-xs font-black text-slate-300">تنظیمات ظاهری و صدا</h3>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <span className="text-xs font-bold block">حالت نمایش</span>
              <span className="text-[10px] text-slate-400">
                {isDark ? 'حالت تاریک (Dark Mode)' : 'حالت روشن (Light Mode)'}
              </span>
            </div>
          </div>

          <button
            id="btn_toggle_theme"
            onClick={() => {
              soundManager.playClick();
              onToggleTheme();
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {isDark ? 'تغییر به روشن ☀️' : 'تغییر به تاریک 🌙'}
          </button>
        </div>

        {/* Sound FX Toggle */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-2.5">
            {gameState.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
            <div>
              <span className="text-xs font-bold block">افکت‌های صوتی</span>
              <span className="text-[10px] text-slate-400">
                {gameState.soundEnabled ? 'صداهای بازی فعال است' : 'صداهای بازی قطع است'}
              </span>
            </div>
          </div>

          <button
            id="btn_toggle_sound"
            onClick={() => {
              soundManager.playClick();
              onToggleSound();
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              gameState.soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {gameState.soundEnabled ? 'صدا روشن 🔊' : 'صدا خاموش 🔇'}
          </button>
        </div>
      </div>

      {/* SECTION 4: DEVELOPER INFO (اطلاعات سازنده) */}
      <div
        className={`p-4 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold block">درباره و اطلاعات سازنده</span>
              <span className="text-[10px] text-slate-400">شناسنامه و توسعه‌دهنده بازی</span>
            </div>
          </div>

          <button
            id="btn_developer_info"
            onClick={() => {
              soundManager.playClick();
              setShowDeveloperModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer border border-indigo-400/30"
          >
            <Info className="w-3.5 h-3.5" />
            <span>اطلاعات سازنده</span>
          </button>
        </div>
      </div>

      {/* DEVELOPER INFO POPUP MODAL */}
      <AnimatePresence>
        {showDeveloperModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl relative text-center ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Close button */}
              <button
                id="btn_close_developer_modal"
                onClick={() => {
                  soundManager.playClick();
                  setShowDeveloperModal(false);
                }}
                className={`absolute top-4 left-4 p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Developer badge icon */}
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 p-0.5 mb-4 shadow-xl shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <h3 className="text-lg font-black mb-2">اطلاعات سازنده بازی</h3>

              <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right space-y-2">
                <p className="text-sm font-black text-amber-300 leading-relaxed text-center">
                  این بازی توسط <span className="text-white underline underline-offset-4 decoration-amber-400 font-extrabold">امید یاراحمدی</span> ساخته شده است.
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>طراحی و برنامه‌نویسی با افتخار برای شما</span>
                </div>
              </div>

              <button
                id="btn_confirm_developer_modal"
                onClick={() => {
                  soundManager.playClick();
                  setShowDeveloperModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer text-xs"
              >
                متوجه شدم (بستن)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
