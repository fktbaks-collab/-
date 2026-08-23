import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Coins,
  Shield,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, DuelMatch, Question } from '../types';
import { ALL_POOLED_QUESTIONS, AVATAR_LIST } from '../data/quizData';
import { soundManager } from '../utils/audio';
import { updateDuelMatch, subscribeToMatch } from '../services/multiplayerService';

interface DuelScreenProps {
  matchId: string;
  gameState: GameState;
  currentUserId: string;
  onFinishDuel: (won: boolean, coinsReward: number, trophyReward: number) => void;
  onExit: () => void;
}

export const DuelScreen: React.FC<DuelScreenProps> = ({
  matchId,
  gameState,
  currentUserId,
  onFinishDuel,
  onExit,
}) => {
  const isDark = gameState.theme === 'dark';
  const [matchData, setMatchData] = useState<DuelMatch | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [myScore, setMyScore] = useState(0);
  const [myFinished, setMyFinished] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);

  // Subscribe to live match updates from Firestore
  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (data) => {
      setMatchData(data);
      if (data && data.status === 'playing') {
        // Match started
      }
    });
    return () => unsub();
  }, [matchId]);

  const isHost = matchData?.hostUserId === currentUserId;
  const myName = isHost ? matchData?.hostName : matchData?.guestName;
  const myAvatarId = isHost ? matchData?.hostAvatarId : matchData?.guestAvatarId;
  const opponentName = isHost ? matchData?.guestName : matchData?.hostName;
  const opponentAvatarId = isHost ? matchData?.guestAvatarId : matchData?.hostAvatarId;
  const opponentScore = isHost ? matchData?.guestScore ?? 0 : matchData?.hostScore ?? 0;
  const opponentFinished = isHost ? matchData?.guestFinished : matchData?.hostFinished;

  // Retrieve match questions based on stored IDs
  const matchQuestions: Question[] = React.useMemo(() => {
    if (!matchData?.questionIds) return [];
    return matchData.questionIds
      .map((id) => ALL_POOLED_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
  }, [matchData?.questionIds]);

  const currentQuestion = matchQuestions[currentQIndex];

  // Auto Accept Match if Guest joins
  useEffect(() => {
    if (matchData && matchData.guestUserId === currentUserId && matchData.status === 'waiting') {
      updateDuelMatch(matchId, { status: 'playing' });
    }
  }, [matchData, currentUserId, matchId]);

  // Question Timer countdown
  useEffect(() => {
    if (matchData?.status !== 'playing' || myFinished || answerState !== 'idle') return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, matchData?.status, myFinished, answerState]);

  const handleTimeout = () => {
    soundManager.playWrong();
    setAnswerState('wrong');
    advanceToNextQuestion(myScore);
  };

  const handleSelectOption = (index: number) => {
    if (answerState !== 'idle' || !currentQuestion || myFinished) return;
    setSelectedOption(index);

    const isCorrect = index === currentQuestion.correctIndex;
    let newScore = myScore;

    if (isCorrect) {
      soundManager.playCorrect();
      setAnswerState('correct');
      // Score = 100 base + time bonus
      const earned = 100 + timeLeft * 10;
      newScore = myScore + earned;
      setMyScore(newScore);
    } else {
      soundManager.playWrong();
      setAnswerState('wrong');
    }

    // Sync score live to Firestore for opponent to see
    if (isHost) {
      updateDuelMatch(matchId, {
        hostScore: newScore,
        hostCurrentQ: currentQIndex + 1,
      });
    } else {
      updateDuelMatch(matchId, {
        guestScore: newScore,
        guestCurrentQ: currentQIndex + 1,
      });
    }

    advanceToNextQuestion(newScore);
  };

  const advanceToNextQuestion = (latestScore: number) => {
    setTimeout(() => {
      if (currentQIndex + 1 < matchQuestions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOption(null);
        setAnswerState('idle');
        setTimeLeft(12);
      } else {
        // I finished all questions
        setMyFinished(true);
        if (isHost) {
          updateDuelMatch(matchId, { hostFinished: true, hostScore: latestScore });
        } else {
          updateDuelMatch(matchId, { guestFinished: true, guestScore: latestScore });
        }
      }
    }, 1200);
  };

  // Evaluate winner when both players finish
  useEffect(() => {
    if (!matchData) return;
    if (myFinished && (opponentFinished || matchData.status === 'finished')) {
      setShowResultScreen(true);
      const won = myScore > opponentScore;
      if (won) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        soundManager.playLevelWin();
        onFinishDuel(true, 40, 3); // 40 coins, 3 trophies
      } else {
        soundManager.playWrong();
        onFinishDuel(false, 10, 0); // Consolation reward
      }

      updateDuelMatch(matchId, {
        status: 'finished',
        winnerId: won ? currentUserId : 'opponent',
      });
    }
  }, [myFinished, opponentFinished, matchData?.status]);

  const hostAvatar = AVATAR_LIST.find((a) => a.id === myAvatarId) || AVATAR_LIST[0];
  const oppAvatar = AVATAR_LIST.find((a) => a.id === opponentAvatarId) || AVATAR_LIST[0];

  // 1. Waiting for opponent screen
  if (matchData?.status === 'waiting' && isHost) {
    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
          <Swords className="w-9 h-9 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">در انتظار ورود {opponentName}...</h3>
          <p className="text-xs text-slate-400 mt-1">
            دعوت‌نامه برای رقیب شما ارسال شد. به محض پذیرش، مسابقه ۵ سوالی آغاز می‌شود.
          </p>
        </div>
        <div className="py-2 flex justify-center">
          <div className="flex gap-1.5 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce delay-100"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce delay-200"></span>
          </div>
        </div>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          انصراف و بازگشت
        </button>
      </div>
    );
  }

  // 2. Duel Results Screen
  if (showResultScreen) {
    const isWinner = myScore > opponentScore;
    const isDraw = myScore === opponentScore;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/60 text-center space-y-5 shadow-2xl"
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Trophy className="w-9 h-9 text-slate-950" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white">
            {isWinner ? '🎉 پیروزی در دوئل آنلاین!' : isDraw ? '🤝 مساوی هیجان‌انگیز!' : 'شکست در مسابقه'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isWinner
              ? 'تبریک! شما با سرعت و هوش بیشتر برنده این رقابت شدید.'
              : 'رقیب شما سریع‌تر بود. در دورهای بعد پیروز خواهید شد!'}
          </p>
        </div>

        {/* Score comparison card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-around">
          <div className="text-center space-y-1">
            <img
              src={hostAvatar.image}
              alt={myName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-emerald-500 mx-auto p-0.5"
            />
            <span className="text-xs font-bold text-slate-300 block">{myName} (شما)</span>
            <span className="text-base font-black text-emerald-400 font-mono">{myScore} امتیاز</span>
          </div>

          <span className="text-xs font-black text-slate-500">VS</span>

          <div className="text-center space-y-1">
            <img
              src={oppAvatar.image}
              alt={opponentName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-rose-500 mx-auto p-0.5"
            />
            <span className="text-xs font-bold text-slate-300 block">{opponentName}</span>
            <span className="text-base font-black text-rose-400 font-mono">{opponentScore} امتیاز</span>
          </div>
        </div>

        {/* Rewards earned */}
        {isWinner && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center gap-4 text-xs font-black text-amber-400">
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4 fill-amber-400" />
              +۴۰ سکه جایزه
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 fill-amber-400" />
              +۳ کاپ قهرمانی
            </span>
          </div>
        )}

        <button
          onClick={onExit}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          ادامه و بازگشت به منو
        </button>
      </motion.div>
    );
  }

  // 3. Waiting for opponent to finish questions
  if (myFinished && !opponentFinished) {
    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">شما به همه سوالات پاسخ دادید!</h3>
          <p className="text-xs text-slate-400 mt-1">
            امتیاز ثبت‌شده شما: <strong className="text-amber-400">{myScore}</strong>
          </p>
          <p className="text-[11px] text-cyan-300 mt-2">
            در حال دریافت پاسخ‌های نهایی {opponentName}...
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs">
        در حال بارگذاری سوالات مسابقه...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-10">
      {/* Top Duel Battle Header Bar */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-between shadow-lg">
        {/* You */}
        <div className="flex items-center gap-2">
          <img
            src={hostAvatar.image}
            alt={myName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl bg-slate-800 border border-cyan-400 p-0.5"
          />
          <div className="text-right">
            <span className="text-xs font-black text-white block">{myName}</span>
            <span className="text-xs font-mono font-black text-cyan-400">{myScore} pts</span>
          </div>
        </div>

        {/* Question Counter Badge */}
        <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-black text-amber-400 flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" />
          <span>سوال {currentQIndex + 1} از {matchQuestions.length}</span>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2">
          <div className="text-left">
            <span className="text-xs font-black text-white block">{opponentName}</span>
            <span className="text-xs font-mono font-black text-rose-400">{opponentScore} pts</span>
          </div>
          <img
            src={oppAvatar.image}
            alt={opponentName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl bg-slate-800 border border-rose-500 p-0.5"
          />
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-xs font-bold px-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            مهلت پاسخ دوئل:
          </span>
          <span className="font-mono text-sm font-black text-amber-400">{timeLeft} ثانیه</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
            style={{ width: `${(timeLeft / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-700 shadow-md text-right">
        <p className="text-sm font-black text-white leading-relaxed">{currentQuestion.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((option, idx) => {
          let btnStyle = 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200';

          if (answerState !== 'idle') {
            if (idx === currentQuestion.correctIndex) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
            } else if (selectedOption === idx) {
              btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={answerState !== 'idle'}
              className={`w-full p-3.5 rounded-2xl border text-xs text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${btnStyle}`}
            >
              <span>{option}</span>
              {answerState !== 'idle' && idx === currentQuestion.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {answerState !== 'idle' && selectedOption === idx && idx !== currentQuestion.correctIndex && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
