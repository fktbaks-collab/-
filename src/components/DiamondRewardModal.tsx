import React from 'react';
import { motion } from 'motion/react';
import { Gem, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

interface DiamondRewardModalProps {
  diamondsAwarded: number;
  onClose: () => void;
}

export const DiamondRewardModal: React.FC<DiamondRewardModalProps> = ({
  diamondsAwarded,
  onClose,
}) => {
  React.useEffect(() => {
    soundManager.playLevelWin();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border-2 border-cyan-400 text-center shadow-2xl shadow-cyan-500/20"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-1 mb-4 shadow-lg shadow-cyan-500/40 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
            <Gem className="w-10 h-10 text-cyan-300 animate-bounce" />
          </div>
        </div>

        <span className="text-[11px] bg-cyan-500/20 text-cyan-300 font-black px-2.5 py-1 rounded-full border border-cyan-400/40">
          دستاورد بزرگ: فتح ۴ مرحله
        </span>

        <h2 className="text-xl font-black text-white mt-3">
          تبریک! جایزه الماس دریافت کردید
        </h2>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          شما موفق شدید ۴ مرحله بازی را با پیروزی پشت سر بگذارید و پاداش ارزشمند الماس به حساب شما اضافه شد:
        </p>

        <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-400/50 flex items-center justify-center gap-3">
          <Gem className="w-8 h-8 text-cyan-300 fill-cyan-400/40" />
          <span className="text-2xl font-black font-mono text-cyan-300">
            +{diamondsAwarded} الماس ارزشمند
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-5">
          می‌توانید در فروشگاه با این الماس‌ها بسته‌های بزرگ سکه طلا تهیه کنید.
        </p>

        <button
          id="btn_claim_diamonds_close"
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/25 cursor-pointer hover:opacity-95 transition-all"
        >
          دریافت و ادامه
        </button>
      </motion.div>
    </div>
  );
};
