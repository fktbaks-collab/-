import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Heart, CheckCircle2, XCircle, ChevronLeft, Award, Sparkles, AlertTriangle, ArrowLeft, Snowflake, PauseCircle, Wand2, ShieldCheck, ShieldAlert, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Level, Question, GameState } from '../types';
import { soundManager } from '../utils/audio';

interface QuizScreenProps {
  level: Level;
  gameState: GameState;
  onDeductHeart: () => void;
  onUseFreeze: () => void;
  onUseFiftyFifty: () => void;
  onUseShield: () => void;
  onCompleteLevel: (levelId: number, score: number, coins: number, xp: number, trophies: number) => void;
  onExit: () => void;
  onOpenShop: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  level,
  gameState,
  onDeductHeart,
  onUseFreeze,
  onUseFiftyFifty,
  onUseShield,
  onCompleteLevel,
  onExit,
  onOpenShop,
}) => {
  const isAlreadyWon = (gameState.completedLevels[level.id]?.stars ?? 0) > 0;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFrozen, setIsFrozen] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldSavedHeart, setShieldSavedHeart] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong' | 'timeout'>('idle');
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [showLevelSummary, setShowLevelSummary] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const question: Question = level.questions[currentQuestionIndex];
  const isDark = gameState.theme === 'dark';
  const freezeCount = gameState.timeFreezeCount ?? 0;
  const fiftyFiftyCount = gameState.fiftyFiftyCount ?? 0;
  const shieldCount = gameState.shieldCount ?? 0;

  // Handle timeout (no heart loss if shield is active or level was already won previously!)
  const handleTimeout = useCallback(() => {
    setAnswerState('timeout');
    if (isShieldActive) {
      soundManager.playShieldBlock();
      setShieldSavedHeart(true);
    } else {
      soundManager.playWrong();
      if (!isAlreadyWon) {
        soundManager.playHeartLoss();
        onDeductHeart();
      }
    }
  }, [isShieldActive, isAlreadyWon, onDeductHeart]);

  // 15-second countdown timer (pauses if isFrozen or showExitConfirm is true)
  useEffect(() => {
    if (answerState !== 'idle' || showLevelSummary || isFrozen || showExitConfirm) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 4 && prev > 1) {
          soundManager.playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answerState, showLevelSummary, isFrozen, showExitConfirm, handleTimeout]);

  // Activate Time Freeze powerup (disabled in already won levels)
  const handleActivateFreeze = () => {
    if (isAlreadyWon || isFrozen || answerState !== 'idle') return;
    if (freezeCount <= 0) {
      soundManager.playWrong();
      onOpenShop();
      return;
    }
    soundManager.playFreeze();
    setIsFrozen(true);
    onUseFreeze();
  };

  // Activate Fifty-Fifty powerup (eliminates 2 wrong options) (disabled in already won levels)
  const handleActivateFiftyFifty = () => {
    if (isAlreadyWon || eliminatedOptions.length > 0 || answerState !== 'idle') return;
    if (fiftyFiftyCount <= 0) {
      soundManager.playWrong();
      onOpenShop();
      return;
    }

    // Identify incorrect options
    const wrongOptionIndices = question.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== question.correctIndex);

    // Shuffle and pick 2 incorrect indices to eliminate
    const shuffled = [...wrongOptionIndices].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);

    soundManager.playFiftyFifty();
    setEliminatedOptions(toEliminate);
    onUseFiftyFifty();
  };

  // Activate Protection Shield powerup (prevents heart loss for current question) (disabled in already won levels)
  const handleActivateShield = () => {
    if (isAlreadyWon || isShieldActive || answerState !== 'idle') return;
    if (shieldCount <= 0) {
      soundManager.playWrong();
      onOpenShop();
      return;
    }

    soundManager.playShield();
    setIsShieldActive(true);
    onUseShield();
  };

  // Option selection handler
  const handleSelectOption = (index: number) => {
    if (answerState !== 'idle' || showLevelSummary || eliminatedOptions.includes(index)) return;

    setSelectedOption(index);
    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      setAnswerState('correct');
      soundManager.playCorrect();
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      setAnswerState('wrong');
      if (isShieldActive) {
        soundManager.playShieldBlock();
        setShieldSavedHeart(true);
      } else {
        soundManager.playWrong();
        // If user previously won this level, do NOT deduct hearts!
        if (!isAlreadyWon) {
          soundManager.playHeartLoss();
          onDeductHeart();
        }
      }
    }
  };

  // Next question or complete level
  const handleNext = () => {
    soundManager.playClick();
    if (currentQuestionIndex + 1 < level.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswerState('idle');
      setTimeLeft(15);
      setIsFrozen(false);
      setEliminatedOptions([]);
      setIsShieldActive(false);
      setShieldSavedHeart(false);
    } else {
      // Finished all questions in this level
      setShowLevelSummary(true);
      if (correctAnswersCount + (answerState === 'correct' ? 1 : 0) > 0) {
        soundManager.playLevelWin();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas context issue
        }
      }
    }
  };

  const handleFinishLevel = () => {
    const finalCorrect = correctAnswersCount;
    // Smart economy: If level was already won, 0 coins, 0 XP, 0 trophies awarded!
    const earnedCoins = isAlreadyWon ? 0 : finalCorrect * Math.floor(level.coinReward / 2);
    const earnedXp = isAlreadyWon ? 0 : finalCorrect * Math.floor(level.xpReward / 2);
    const earnedTrophies = isAlreadyWon ? 0 : (finalCorrect === level.questions.length ? level.trophyReward : 0);

    onCompleteLevel(level.id, finalCorrect, earnedCoins, earnedXp, earnedTrophies);
  };

  // Timer Color calculation
  const timerColor = isFrozen
    ? 'from-cyan-400 to-blue-500 text-cyan-400'
    : timeLeft > 8
    ? 'from-emerald-500 to-teal-500 text-emerald-400'
    : timeLeft > 4
    ? 'from-amber-500 to-yellow-500 text-amber-400'
    : 'from-rose-500 to-red-600 text-rose-500 animate-pulse';

  const timerPercentage = (timeLeft / 15) * 100;

  // Render Level Victory / Summary Modal
  if (showLevelSummary) {
    const finalScore = correctAnswersCount;
    const isPassed = finalScore > 0;

    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-sm p-6 rounded-3xl border text-center shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 p-1 mb-4 shadow-lg shadow-orange-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
              <Award className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-black text-white">
            {isPassed ? 'آفرین! مرحله به پایان رسید' : 'نیاز به تلاش بیشتر!'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            پاسخ‌های صحیح شما: {finalScore} از {level.questions.length} سوال
          </p>

          {isAlreadyWon && (
            <div className="mt-3 p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-[11px] text-cyan-300 font-bold">
              ⚡ این مرحله قبلاً فتح شده (حالت تمرینی بدون کسر جان و بدون جوایز مجدد)
            </div>
          )}

          {/* Reward Badges */}
          <div className="grid grid-cols-3 gap-2 my-5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-[10px] text-amber-400 font-bold block">سکه دریافتی</span>
              <span className="text-sm font-black font-mono text-amber-400">
                +{isAlreadyWon ? 0 : finalScore * Math.floor(level.coinReward / 2)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <span className="text-[10px] text-indigo-400 font-bold block">امتیاز XP</span>
              <span className="text-sm font-black font-mono text-indigo-400">
                +{isAlreadyWon ? 0 : finalScore * Math.floor(level.xpReward / 2)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-center">
              <span className="text-[10px] text-yellow-400 font-bold block">کاپ / جام</span>
              <span className="text-sm font-black font-mono text-yellow-400">
                +{isAlreadyWon ? 0 : (finalScore === level.questions.length ? level.trophyReward : 0)}
              </span>
            </div>
          </div>

          <button
            id="btn_finish_level"
            onClick={handleFinishLevel}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-2xl shadow-lg cursor-pointer hover:opacity-95 transition-all"
          >
            ادامه و بازگشت به نقشه مراحل
          </button>
        </motion.div>
      </div>
    );
  }

  // Exit handlers
  const handleExitClick = () => {
    soundManager.playClick();
    if (isAlreadyWon) {
      onExit();
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmExit = () => {
    soundManager.playClick();
    if (!isAlreadyWon) {
      soundManager.playHeartLoss();
      onDeductHeart();
    }
    setShowExitConfirm(false);
    onExit();
  };

  const handleCancelExit = () => {
    soundManager.playClick();
    setShowExitConfirm(false);
  };

  return (
    <div className="flex flex-col justify-between flex-1 w-full py-2 space-y-4">
      {/* Top Header info during quiz */}
      <div className="flex items-center justify-between">
        {/* Exit button */}
        <button
          id="btn_quiz_exit"
          onClick={handleExitClick}
          className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700'
          }`}
          title="خروج از مرحله"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Level & Question Step */}
        <div className="text-center">
          <span className="text-[11px] font-bold text-slate-400 block">{level.title}</span>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs font-black text-amber-400">
              سوال {currentQuestionIndex + 1} از {level.questions.length}
            </span>
            {isAlreadyWon && (
              <span className="text-[9px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-1.5 py-0.2 rounded-full font-bold">
                حالت بدون کسر جان
              </span>
            )}
          </div>
        </div>

        {/* Live Hearts and Active Shield Status */}
        <div className="flex items-center gap-1.5">
          {isShieldActive && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded-xl text-amber-300 font-bold text-[11px] shadow-sm animate-pulse"
              title="سپر محافظ فعال است"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>سپر فعال</span>
            </motion.div>
          )}

          <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-xl text-rose-400 font-black text-xs">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="font-mono">{gameState.hearts}</span>
          </div>
        </div>
      </div>

      {/* 15-second Timer Bar and Active Item Indicators */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs font-bold px-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">زمان پاسخ:</span>
            {isFrozen && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-cyan-400" />
                <span>زمان متوقف شد ❄️</span>
              </span>
            )}
          </div>
          <span className={`font-mono text-sm font-black ${timerColor.split(' ')[2]}`}>
            {timeLeft} ثانیه
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5 shadow-inner">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${timerColor.split(' ')[0]} ${timerColor.split(' ')[1]} transition-all duration-300`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>

        {/* POWERUPS ACTION TOOLBAR (3 ITEMS) */}
        {answerState === 'idle' && (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-3 gap-1.5">
              {/* Item 1: حذف دو گزینه */}
              <button
                id="btn_activate_fifty_fifty"
                onClick={handleActivateFiftyFifty}
                disabled={isAlreadyWon || eliminatedOptions.length > 0}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-black transition-all border text-center ${
                  isAlreadyWon
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : eliminatedOptions.length > 0
                    ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300 opacity-90 cursor-default'
                    : fiftyFiftyCount > 0
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25 active:scale-95 cursor-pointer shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer'
                }`}
                title={isAlreadyWon ? 'در مرحله فتح شده غیرفعال است' : 'حذف دو گزینه نادرست'}
              >
                <div className="flex items-center gap-1">
                  <Wand2 className={`w-3.5 h-3.5 ${isAlreadyWon ? 'text-slate-600' : 'text-indigo-400'}`} />
                  <span className="truncate">حذف ۲ گزینه</span>
                </div>
                <span className="text-[9px] mt-0.5 opacity-80">
                  {isAlreadyWon
                    ? 'غیرفعال'
                    : eliminatedOptions.length > 0
                    ? 'اعمال شد'
                    : fiftyFiftyCount > 0
                    ? `موجودی: ${fiftyFiftyCount}`
                    : 'خرید (فروشگاه)'}
                </span>
              </button>

              {/* Item 2: سپر محافظ */}
              <button
                id="btn_activate_shield"
                onClick={handleActivateShield}
                disabled={isAlreadyWon || isShieldActive}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-black transition-all border text-center ${
                  isAlreadyWon
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : isShieldActive
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 opacity-90 cursor-default shadow-md'
                    : shieldCount > 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 active:scale-95 cursor-pointer shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer'
                }`}
                title={isAlreadyWon ? 'در مرحله فتح شده غیرفعال است' : 'محافظت از جان'}
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isAlreadyWon ? 'text-slate-600' : 'text-amber-400'}`} />
                  <span className="truncate">سپر محافظ</span>
                </div>
                <span className="text-[9px] mt-0.5 opacity-80">
                  {isAlreadyWon
                    ? 'غیرفعال'
                    : isShieldActive
                    ? 'سپر فعال'
                    : shieldCount > 0
                    ? `موجودی: ${shieldCount}`
                    : 'خرید (فروشگاه)'}
                </span>
              </button>

              {/* Item 3: توقف زمان */}
              <button
                id="btn_activate_freeze"
                onClick={handleActivateFreeze}
                disabled={isAlreadyWon || isFrozen}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-black transition-all border text-center ${
                  isAlreadyWon
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : isFrozen
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 opacity-90 cursor-default shadow-md'
                    : freezeCount > 0
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 active:scale-95 cursor-pointer shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer'
                }`}
                title={isAlreadyWon ? 'در مرحله فتح شده غیرفعال است' : 'توقف تایمر ۱۵ ثانیه‌ای'}
              >
                <div className="flex items-center gap-1">
                  <Snowflake className={`w-3.5 h-3.5 ${isAlreadyWon ? 'text-slate-600' : 'text-cyan-400'} ${isFrozen ? 'animate-spin' : ''}`} />
                  <span className="truncate">توقف زمان</span>
                </div>
                <span className="text-[9px] mt-0.5 opacity-80">
                  {isAlreadyWon
                    ? 'غیرفعال'
                    : isFrozen
                    ? 'زمان متوقف'
                    : freezeCount > 0
                    ? `موجودی: ${freezeCount}`
                    : 'خرید (فروشگاه)'}
                </span>
              </button>
            </div>

            {isAlreadyWon && (
              <p className="text-[10px] text-slate-500 text-center font-bold">
                ⚠️ استفاده از آیتم‌های کمکی در مراحل فتح‌شده غیرفعال است.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Question Card */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full p-5 rounded-3xl border shadow-lg relative overflow-hidden ${
          isDark
            ? 'bg-slate-900/90 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="text-right">
          <h3 className="text-base sm:text-lg font-black leading-relaxed">
            {question.text}
          </h3>
        </div>
      </motion.div>

      {/* 4 Options Grid */}
      <div className="w-full space-y-2.5">
        {question.options.map((optionText, idx) => {
          const isEliminated = eliminatedOptions.includes(idx);
          let btnStyle = isDark
            ? 'bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800';

          let icon = null;

          if (isEliminated) {
            btnStyle = 'opacity-20 pointer-events-none line-through bg-slate-900/30 border-dashed border-slate-800 text-slate-500';
          } else if (answerState !== 'idle') {
            if (idx === question.correctIndex) {
              btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30 scale-[1.01]';
              icon = <CheckCircle2 className="w-5 h-5 text-white shrink-0" />;
            } else if (idx === selectedOption) {
              btnStyle = 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30';
              icon = <XCircle className="w-5 h-5 text-white shrink-0" />;
            } else {
              btnStyle = 'opacity-40 bg-slate-900/50 border-slate-800 text-slate-400';
            }
          }

          const optionLabels = ['الف', 'ب', 'ج', 'د'];

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: answerState === 'idle' && !isEliminated ? 0.98 : 1 }}
              onClick={() => handleSelectOption(idx)}
              disabled={answerState !== 'idle' || isEliminated}
              className={`w-full p-3.5 rounded-2xl border font-bold text-sm text-right flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-black/20 flex items-center justify-center font-bold text-xs text-center shrink-0">
                  {optionLabels[idx]}
                </span>
                <span className="leading-snug">{optionText}</span>
              </div>
              {isEliminated ? (
                <span className="text-[10px] bg-rose-950/60 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-md font-bold shrink-0">
                  حذف شد ✖
                </span>
              ) : (
                icon
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation and Next Button Bar */}
      <AnimatePresence>
        {answerState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-3 pt-2"
          >
            {/* Shield protection notification */}
            {shieldSavedHeart && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 bg-gradient-to-r from-amber-950/90 to-amber-900/70 border-2 border-amber-500/80 rounded-2xl text-xs text-amber-200 flex items-center gap-2.5 shadow-lg shadow-amber-500/20"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <span className="font-bold">
                  🛡️ سپر محافظ فعال بود! با وجود پاسخ نادرست، هیچ جانی از شما کم نشد.
                </span>
              </motion.div>
            )}

            {/* Explanation box */}
            {question.explanation && (
              <div className="p-3 bg-indigo-950/70 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-right">{question.explanation}</p>
              </div>
            )}

            {/* Out of hearts alert */}
            {gameState.hearts <= 0 ? (
              <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>جان‌های شما تمام شد! برای ادامه جان بخرید.</span>
                </div>
                <button
                  onClick={onOpenShop}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  فروشگاه
                </button>
              </div>
            ) : (
              <button
                id="btn_quiz_next"
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/20 text-sm cursor-pointer hover:opacity-95 transition-transform active:scale-98"
              >
                {currentQuestionIndex + 1 < level.questions.length ? 'سوال بعدی' : 'مشاهده نتیجه مرحله'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`w-full max-w-xs p-5 rounded-3xl border shadow-2xl relative text-center ${
                isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-300 text-slate-900'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
              </div>

              <h3 className="text-base font-black mb-1.5">خروج از مرحله ناتمام؟</h3>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                در صورت خروج از این مرحله ناتمام، <span className="text-rose-400 font-bold underline decoration-rose-500/50">۱ عدد جان</span> از شما کسر خواهد شد. آیا خارج می‌شوید؟
              </p>

              <div className="space-y-2">
                <button
                  id="btn_confirm_exit_deduct_heart"
                  onClick={handleConfirmExit}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج و کسر ۱ جان</span>
                </button>

                <button
                  id="btn_cancel_exit"
                  onClick={handleCancelExit}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  انصراف و ادامه بازی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
