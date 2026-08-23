import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Award, ShieldCheck } from 'lucide-react';
import { LOADING_TIPS } from '../data/quizData';
import { soundManager } from '../utils/audio';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(1);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // 10 seconds = 10,000ms. Progress from 1 to 100
    const duration = 10000;
    const intervalTime = 100; // Update every 100ms
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            soundManager.playCorrect();
            onLoaded();
          }, 300);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Tip cycler
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [onLoaded]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white select-none overflow-hidden">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header branding */}
      <div className="w-full flex items-center justify-center pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-500/30 px-4 py-1.5 rounded-full backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-xs font-semibold tracking-wide text-indigo-200">کوییز مستر • نسخه آفلاین</span>
        </motion.div>
      </div>

      {/* Center animated hero icon & title */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 p-1 shadow-2xl shadow-orange-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center flex-col border border-white/10">
              <Brain className="w-14 h-14 text-amber-400 drop-shadow-md" />
              <div className="flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping delay-300" />
              </div>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-2 rounded-2xl shadow-lg border-2 border-slate-900"
          >
            <Award className="w-5 h-5 font-bold" />
          </motion.div>
        </motion.div>

        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-sm"
          >
            کویـیز مسـتر
          </motion.h1>
          <p className="text-sm text-slate-300 max-w-xs font-medium">
            چالش بزرگ هوش، دانستنی‌ها و اطلاعات عمومی
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Tips */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-4 pb-8">
        {/* Dynamic Tip */}
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[44px] flex items-center justify-center text-center px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-amber-200/90 font-medium"
        >
          {LOADING_TIPS[tipIndex]}
        </motion.div>

        {/* Percentage and label */}
        <div className="w-full flex justify-between items-center text-xs font-bold text-slate-300 px-1">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            در حال بارگذاری بازی...
          </span>
          <span className="font-mono text-amber-400 text-sm tracking-wider">
            {Math.min(100, Math.floor(progress))}%
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3.5 bg-slate-900/80 rounded-full p-0.5 border border-slate-800 shadow-inner overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full shadow-md transition-all duration-100 relative"
            style={{ width: `${Math.min(100, progress)}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 rounded-full blur-[1px] animate-pulse" />
          </motion.div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          آماده‌سازی دیتابیس سوالات و سیستم صوتی آفلاین
        </p>
      </div>
    </div>
  );
};
