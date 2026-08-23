import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag, Coins, Clock, Check, Sparkles, ChevronRight, Gem, ArrowLeft, Award, Zap, TrendingUp, PauseCircle, TimerOff, Snowflake, Wand2, ShieldCheck } from 'lucide-react';
import { GameState, AvatarItem, CoinPackage } from '../types';
import { AVATAR_LIST, COIN_PACKAGES } from '../data/quizData';
import { soundManager } from '../utils/audio';
import { getTimeUntilNextHeart } from '../utils/storage';

interface ShopScreenProps {
  gameState: GameState;
  onBuyHeart: () => void;
  onBuyFreeze: () => void;
  onBuyFiftyFifty: () => void;
  onBuyShield: () => void;
  onBuyAvatar: (avatar: AvatarItem) => void;
  onBuyCoinPackage: (pkg: CoinPackage) => void;
  onSelectAvatar: (avatarId: string) => void;
  onBack: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  gameState,
  onBuyHeart,
  onBuyFreeze,
  onBuyFiftyFifty,
  onBuyShield,
  onBuyAvatar,
  onBuyCoinPackage,
  onSelectAvatar,
  onBack,
}) => {
  const isDark = gameState.theme === 'dark';
  const HEART_PRICE = 20;
  const FREEZE_PRICE = 25; // 25 Coins
  const FIFTY_FIFTY_PRICE = 30; // 30 Coins (Removes 2 wrong options)
  const SHIELD_PRICE = 20; // 20 Coins (Protects heart from wrong answer)

  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0, totalSeconds: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const updateCountdown = () => {
      const { minutes, seconds, totalSeconds } = getTimeUntilNextHeart(gameState.lastHeartTimestamp);
      setTimeRemaining({ minutes, seconds, totalSeconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [gameState.lastHeartTimestamp]);

  const handleBuyHeart = () => {
    if (gameState.coins < HEART_PRICE) {
      soundManager.playWrong();
      showToast('⚠️ سکه کافی ندارید! می‌توانید با تبدیل الماس‌ها در بخش بالا سکه دریافت کنید.');
      return;
    }
    soundManager.playCoin();
    onBuyHeart();
    showToast('❤️ یک عدد جان با موفقیت خریداری و اضافه شد!');
  };

  const handleBuyFreezePowerup = () => {
    if (gameState.coins < FREEZE_PRICE) {
      soundManager.playWrong();
      showToast('⚠️ سکه کافی ندارید! می‌توانید با تبدیل الماس‌ها سکه دریافت کنید.');
      return;
    }
    soundManager.playCoin();
    onBuyFreeze();
    showToast('❄️ ۱ عدد آیتم توقف زمان با موفقیت خریداری شد!');
  };

  const handleBuyFiftyFiftyPowerup = () => {
    if (gameState.coins < FIFTY_FIFTY_PRICE) {
      soundManager.playWrong();
      showToast('⚠️ سکه کافی ندارید! می‌توانید با تبدیل الماس‌ها سکه دریافت کنید.');
      return;
    }
    soundManager.playCoin();
    onBuyFiftyFifty();
    showToast('🪄 ۱ عدد آیتم حذف دو گزینه با موفقیت خریداری شد!');
  };

  const handleBuyShieldPowerup = () => {
    if (gameState.coins < SHIELD_PRICE) {
      soundManager.playWrong();
      showToast('⚠️ سکه کافی ندارید! می‌توانید با تبدیل الماس‌ها سکه دریافت کنید.');
      return;
    }
    soundManager.playCoin();
    onBuyShield();
    showToast('🛡️ ۱ عدد آیتم سپر محافظ با موفقیت خریداری شد!');
  };

  const handleBuyCoinPackage = (pkg: CoinPackage) => {
    if ((gameState.diamonds ?? 0) < pkg.diamondCost) {
      soundManager.playWrong();
      showToast(`⚠️ الماس کافی ندارید! برای این بسته به ${pkg.diamondCost} الماس نیاز دارید. با بردن ۴ مرحله ۲ الماس دریافت کنید.`);
      return;
    }
    soundManager.playCoin();
    onBuyCoinPackage(pkg);
    showToast(`💎 با موفقیت ${pkg.coins} سکه با ${pkg.diamondCost} الماس خریداری شد!`);
  };

  const handleBuyAvatar = (avatar: AvatarItem) => {
    if (gameState.coins < avatar.price) {
      soundManager.playWrong();
      showToast(`⚠️ برای خرید این پروفایل به ${avatar.price} سکه نیاز دارید.`);
      return;
    }
    soundManager.playCoin();
    onBuyAvatar(avatar);
    showToast(`🎉 پروفایل «${avatar.name}» خریداری شد و به عنوان پروفایل شما فعال گردید!`);
  };

  // Filter avatars that require purchase
  const purchasableAvatars = AVATAR_LIST.filter((a) => !a.isDefault);

  return (
    <div className="flex flex-col flex-1 w-full py-2 space-y-5 pb-8">
      {/* Toast notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 left-4 right-4 z-50 p-3.5 rounded-2xl bg-slate-900 border-2 border-indigo-500 text-white text-xs font-bold text-center shadow-2xl"
        >
          {toastMessage}
        </motion.div>
      )}

      {/* Header with back */}
      <div className="flex items-center justify-between">
        <button
          id="btn_shop_back"
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
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>فروشگاه و صرافی الماس</span>
          </h2>
          <p className="text-[11px] text-slate-400">خرید سکه با الماس، جان و آواتارها</p>
        </div>
      </div>

      {/* SECTION 1: DIAMOND TO COIN EXCHANGE (ECONOMY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span>خرید بسته سکه با الماس</span>
          </h3>
          <div className="flex items-center gap-1 text-[11px] bg-slate-900 border border-cyan-500/50 px-2.5 py-1 rounded-xl text-cyan-300 font-bold">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span>الماس شما: {gameState.diamonds ?? 0}</span>
          </div>
        </div>

        {/* Info banner about Diamonds value */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 text-[11px] text-cyan-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>الماس باارزش‌ترین واحد بازی است. با هر ۴ برد در مراحل، ۲ الماس دریافت می‌کنید!</span>
        </div>

        {/* 4 Coin Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COIN_PACKAGES.map((pkg) => {
            const canAfford = (gameState.diamonds ?? 0) >= pkg.diamondCost;

            return (
              <div
                key={pkg.id}
                className={`p-3.5 rounded-2xl border relative flex flex-col justify-between transition-colors ${
                  pkg.popular
                    ? 'bg-slate-900 border-cyan-500'
                    : isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                {pkg.bonusTag && (
                  <div className="absolute -top-2.5 left-3 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full">
                    {pkg.bonusTag}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-amber-400 fill-amber-400" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-white">{pkg.name}</h4>
                        <span className="text-xs font-black font-mono text-amber-400 block">
                          +{pkg.coins} سکه طلا
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 text-right">
                    {pkg.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-black text-cyan-300">
                    <Gem className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{pkg.diamondCost} الماس</span>
                  </div>

                  <button
                    id={`btn_buy_pkg_${pkg.id}`}
                    onClick={() => handleBuyCoinPackage(pkg)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1 ${
                      canAfford
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span>خرید با الماس</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LIVES & POWERUPS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>آیتم‌های کمکی و جان</span>
          </h3>
          <span className="text-[11px] text-amber-400 font-bold">
            سکه شما: {gameState.coins}
          </span>
        </div>

        {/* 1. FIFTY-FIFTY (حذف ۲ گزینه) */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark ? 'bg-slate-900 border-indigo-500/50 shadow-md' : 'bg-white border-indigo-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">آیتم حذف دو گزینه</h4>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2 py-0.2 rounded-md font-bold">
                    موجودی: {gameState.fiftyFiftyCount ?? 0} عدد
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  حذف دو گزینه نادرست از چهار گزینه در سوال جاری برای افزایش شانس برد
                </p>
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 mt-1">
                  <Coins className="w-3.5 h-3.5 fill-amber-400" />
                  <span>قیمت: {FIFTY_FIFTY_PRICE} سکه</span>
                </div>
              </div>
            </div>

            <button
              id="btn_buy_fifty_fifty_powerup"
              onClick={handleBuyFiftyFiftyPowerup}
              disabled={gameState.coins < FIFTY_FIFTY_PRICE}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 ${
                gameState.coins >= FIFTY_FIFTY_PRICE
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>خرید آیتم</span>
            </button>
          </div>
        </div>

        {/* 2. PROTECTION SHIELD (سپر محافظ) */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark ? 'bg-slate-900 border-amber-500/50 shadow-md' : 'bg-white border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">آیتم سپر محافظ</h4>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-md font-bold">
                    موجودی: {gameState.shieldCount ?? 0} عدد
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  جلوگیری کامل از کسر جان در صورت انتخاب گزینه اشتباه در سوال جاری
                </p>
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 mt-1">
                  <Coins className="w-3.5 h-3.5 fill-amber-400" />
                  <span>قیمت: {SHIELD_PRICE} سکه</span>
                </div>
              </div>
            </div>

            <button
              id="btn_buy_shield_powerup"
              onClick={handleBuyShieldPowerup}
              disabled={gameState.coins < SHIELD_PRICE}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 ${
                gameState.coins >= SHIELD_PRICE
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:opacity-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>خرید آیتم</span>
            </button>
          </div>
        </div>

        {/* 3. TIME FREEZE POWERUP CARD */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark ? 'bg-slate-900 border-cyan-500/50 shadow-md' : 'bg-white border-cyan-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Snowflake className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">آیتم توقف زمان</h4>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.2 rounded-md font-bold">
                    موجودی: {gameState.timeFreezeCount ?? 0} عدد
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  متوقف کردن مهلت ۱۵ ثانیه‌ای سوال در حین بازی بدون اضطراب
                </p>
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 mt-1">
                  <Coins className="w-3.5 h-3.5 fill-amber-400" />
                  <span>قیمت: {FREEZE_PRICE} سکه</span>
                </div>
              </div>
            </div>

            <button
              id="btn_buy_freeze_powerup"
              onClick={handleBuyFreezePowerup}
              disabled={gameState.coins < FREEZE_PRICE}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 ${
                gameState.coins >= FREEZE_PRICE
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>خرید آیتم</span>
            </button>
          </div>
        </div>

        {/* Buy Life Card */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">خرید ۱ عدد جان</h4>
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded-md font-bold">
                    موجودی: {gameState.hearts} جان
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">شارژ فوری برای ادامه مسابقه</p>
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 mt-1">
                  <Coins className="w-3.5 h-3.5 fill-amber-400" />
                  <span>قیمت: {HEART_PRICE} سکه</span>
                </div>
              </div>
            </div>

            <button
              id="btn_buy_heart"
              onClick={handleBuyHeart}
              disabled={gameState.coins < HEART_PRICE}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 ${
                gameState.coins >= HEART_PRICE
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:opacity-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              خرید جان
            </button>
          </div>

          {/* 1-Hour Auto Free Heart Timer Card */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-300 block">
                  سیستم جان رایگان خودکار
                </span>
                <span className="text-[10px] text-slate-500">هر ۱ ساعت ۱ جان رایگان هدیه داده می‌شود</span>
              </div>
            </div>

            <div className="text-left font-mono font-black text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              {String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROFILE PICTURES / AVATARS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>خرید پروفایل‌های اختصاصی</span>
          </h3>
          <span className="text-[11px] text-amber-400 font-bold">
            سکه شما: {gameState.coins}
          </span>
        </div>

        <div className="space-y-3">
          {purchasableAvatars.map((avatar) => {
            const isOwned = gameState.ownedAvatarIds.includes(avatar.id);
            const isSelected = gameState.selectedAvatarId === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`p-4 rounded-2xl border transition-colors ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500'
                    : isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar Image preview */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-400/80 bg-slate-800 shadow-md flex items-center justify-center shrink-0">
                      <img
                        src={avatar.image}
                        alt={avatar.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://api.dicebear.com/7.x/bottts/svg?seed=useravatar';
                        }}
                      />
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-white">{avatar.name}</h4>
                        {avatar.id === 'avatar_user_exclusive' && (
                          <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                            ویژه
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        پروفایل انحصاری و باکیفیت
                      </p>

                      <div className="flex items-center gap-1 text-xs font-black text-amber-400 mt-1">
                        <Coins className="w-3.5 h-3.5 fill-amber-400" />
                        <span>قیمت: {avatar.price} سکه</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Buy / Owned / Select */}
                  <div>
                    {isOwned ? (
                      isSelected ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-black">
                          <Check className="w-3.5 h-3.5" />
                          <span>فعال</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onSelectAvatar(avatar.id);
                            showToast(`پروفایل «${avatar.name}» فعال شد.`);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-transform active:scale-95 shadow"
                        >
                          انتخاب
                        </button>
                      )
                    ) : (
                      <button
                        id={`btn_buy_avatar_${avatar.id}`}
                        onClick={() => handleBuyAvatar(avatar)}
                        disabled={gameState.coins < avatar.price}
                        className={`px-4 py-2 rounded-2xl font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                          gameState.coins >= avatar.price
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-95'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>خرید ({avatar.price} سکه)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
