/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, ActiveScreen, Level, AvatarItem, CoinPackage, OnlineUserProfile, FriendRequest, DuelMatch } from './types';
import {
  loadGameState,
  saveGameState,
  checkAndRegenHearts,
  calculateLevelFromXP,
} from './utils/storage';
import { soundManager } from './utils/audio';
import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { LevelsScreen } from './components/LevelsScreen';
import { QuizScreen } from './components/QuizScreen';
import { ShopScreen } from './components/ShopScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { FriendsScreen } from './components/FriendsScreen';
import { DuelScreen } from './components/DuelScreen';
import { ClanScreen } from './components/ClanScreen';
import { DiamondRewardModal } from './components/DiamondRewardModal';
import { ensureAuthUser } from './firebase';
import {
  syncUserProfile,
  subscribeToFriendRequests,
  subscribeToIncomingDuels,
  updateDuelMatch,
} from './services/multiplayerService';
import { Swords } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('loading');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [showDiamondModal, setShowDiamondModal] = useState(false);

  // Online Multiplayer States
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [onlineProfile, setOnlineProfile] = useState<OnlineUserProfile | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [activeDuelMatchId, setActiveDuelMatchId] = useState<string | null>(null);
  const [incomingDuelInvite, setIncomingDuelInvite] = useState<DuelMatch | null>(null);

  // Initialize Anonymous Firebase Auth & Online Profile
  useEffect(() => {
    let isMounted = true;
    ensureAuthUser().then((uid) => {
      if (!isMounted) return;
      setCurrentUserId(uid);
      syncUserProfile(
        uid,
        gameState.playerName,
        gameState.selectedAvatarId,
        gameState.trophies,
        gameState.level
      ).then((prof) => {
        if (isMounted) setOnlineProfile(prof);
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync profile data to cloud whenever player stats change
  useEffect(() => {
    if (!currentUserId) return;
    syncUserProfile(
      currentUserId,
      gameState.playerName,
      gameState.selectedAvatarId,
      gameState.trophies,
      gameState.level
    ).then((prof) => {
      setOnlineProfile(prof);
    });
  }, [currentUserId, gameState.playerName, gameState.selectedAvatarId, gameState.trophies, gameState.level]);

  // Subscribe to incoming friend requests & duels
  useEffect(() => {
    if (!currentUserId) return;

    const unsubReqs = subscribeToFriendRequests(currentUserId, (requests) => {
      setIncomingRequests(requests);
    });

    const unsubDuels = subscribeToIncomingDuels(currentUserId, (duels) => {
      if (duels.length > 0) {
        setIncomingDuelInvite(duels[0]);
      } else {
        setIncomingDuelInvite(null);
      }
    });

    return () => {
      unsubReqs();
      unsubDuels();
    };
  }, [currentUserId]);

  // Sync sound settings
  useEffect(() => {
    soundManager.setEnabled(gameState.soundEnabled);
  }, [gameState.soundEnabled]);


  // Save changes to localStorage
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Periodic check for 1-hour free heart regeneration
  useEffect(() => {
    const checkHearts = () => {
      setGameState((prev) => checkAndRegenHearts(prev));
    };

    const interval = setInterval(checkHearts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update Game State helper
  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      saveGameState(next);
      return next;
    });
  }, []);

  // Actions
  const handleLoadingComplete = () => {
    setActiveScreen('main_menu');
  };

  const handleOpenFriends = () => {
    setActiveScreen('friends');
  };

  const handleOpenClan = () => {
    setActiveScreen('clan');
  };

  const handleStartDuel = (matchId: string) => {
    setActiveDuelMatchId(matchId);
    setActiveScreen('duel');
  };

  const handleFinishDuel = (won: boolean, coinsReward: number, trophyReward: number) => {
    updateState((prev) => {
      const newCoins = prev.coins + coinsReward;
      const newTrophies = prev.trophies + trophyReward;
      const newXp = prev.xp + (won ? 80 : 25);
      const { level: newLevel } = calculateLevelFromXP(newXp);
      return {
        ...prev,
        coins: newCoins,
        trophies: newTrophies,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  const handleAcceptIncomingDuel = async (invite: DuelMatch) => {
    soundManager.playClick();
    await updateDuelMatch(invite.id, { status: 'playing' });
    setIncomingDuelInvite(null);
    setActiveDuelMatchId(invite.id);
    setActiveScreen('duel');
  };

  const handleDeclineIncomingDuel = async (invite: DuelMatch) => {
    soundManager.playClick();
    await updateDuelMatch(invite.id, { status: 'declined' });
    setIncomingDuelInvite(null);
  };


  const handleStartGame = () => {
    setActiveScreen('levels');
  };

  const handleOpenShop = () => {
    setActiveScreen('shop');
  };

  const handleOpenSettings = () => {
    setActiveScreen('settings');
  };

  const handleSelectLevel = (level: Level) => {
    setSelectedLevel(level);
    setActiveScreen('quiz');
  };

  const handleDeductHeart = () => {
    updateState((prev) => {
      const newHearts = Math.max(0, prev.hearts - 1);
      return {
        ...prev,
        hearts: newHearts,
        // If hearts drop below max for first time, initialize timestamp
        lastHeartTimestamp: prev.hearts === prev.maxHearts ? Date.now() : prev.lastHeartTimestamp,
      };
    });
  };

  const handleCompleteLevel = (
    levelId: number,
    correctCount: number,
    earnedCoins: number,
    earnedXp: number,
    earnedTrophies: number
  ) => {
    let earnedDiamondMilestone = false;

    updateState((prev) => {
      const stars = correctCount;
      const prevRecord = prev.completedLevels[levelId] || { stars: 0, highscore: 0 };
      const newStars = Math.max(prevRecord.stars, stars);

      const newCoins = prev.coins + earnedCoins;
      const newXp = prev.xp + earnedXp;
      const { level: newLevel } = calculateLevelFromXP(newXp);
      const newTrophies = prev.trophies + earnedTrophies;

      const updatedCompletedLevels: Record<number, { stars: number; highscore: number }> = {
        ...prev.completedLevels,
        [levelId]: {
          stars: newStars,
          highscore: Math.max(prevRecord.highscore, correctCount),
        },
      };

      // Check how many unique levels have stars > 0
      const completedCount = Object.values(updatedCompletedLevels).filter((rec) => rec.stars > 0).length;
      
      // Check 4-level milestones (every 4 completed levels: 4, 8, 12...)
      const currentMilestone = Math.floor(completedCount / 4);
      const claimedMilestones = prev.claimedDiamondMilestones || [];
      let extraDiamonds = 0;
      let newClaimedMilestones = [...claimedMilestones];

      if (currentMilestone > 0 && !claimedMilestones.includes(currentMilestone)) {
        extraDiamonds = 2; // User requested: "هربار که ۴ مرحله را برنده شویم ۲ عدد الماس به ما بدهد"
        newClaimedMilestones.push(currentMilestone);
        earnedDiamondMilestone = true;
      }

      return {
        ...prev,
        coins: newCoins,
        diamonds: (prev.diamonds ?? 0) + extraDiamonds,
        xp: newXp,
        level: newLevel,
        trophies: newTrophies,
        completedLevels: updatedCompletedLevels,
        claimedDiamondMilestones: newClaimedMilestones,
      };
    });

    if (earnedDiamondMilestone) {
      setShowDiamondModal(true);
    }

    setActiveScreen('levels');
    setSelectedLevel(null);
  };

  const handleBuyHeart = () => {
    const HEART_PRICE = 20;
    updateState((prev) => {
      if (prev.coins < HEART_PRICE) return prev;
      return {
        ...prev,
        coins: prev.coins - HEART_PRICE,
        hearts: prev.hearts + 1,
      };
    });
  };

  const handleBuyFreeze = () => {
    const FREEZE_PRICE = 25;
    updateState((prev) => {
      if (prev.coins < FREEZE_PRICE) return prev;
      return {
        ...prev,
        coins: prev.coins - FREEZE_PRICE,
        timeFreezeCount: (prev.timeFreezeCount ?? 0) + 1,
      };
    });
  };

  const handleUseFreeze = () => {
    updateState((prev) => {
      const currentCount = prev.timeFreezeCount ?? 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        timeFreezeCount: currentCount - 1,
      };
    });
  };

  const handleBuyFiftyFifty = () => {
    const FIFTY_FIFTY_PRICE = 30;
    updateState((prev) => {
      if (prev.coins < FIFTY_FIFTY_PRICE) return prev;
      return {
        ...prev,
        coins: prev.coins - FIFTY_FIFTY_PRICE,
        fiftyFiftyCount: (prev.fiftyFiftyCount ?? 0) + 1,
      };
    });
  };

  const handleUseFiftyFifty = () => {
    updateState((prev) => {
      const currentCount = prev.fiftyFiftyCount ?? 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        fiftyFiftyCount: currentCount - 1,
      };
    });
  };

  const handleBuyShield = () => {
    const SHIELD_PRICE = 20;
    updateState((prev) => {
      if (prev.coins < SHIELD_PRICE) return prev;
      return {
        ...prev,
        coins: prev.coins - SHIELD_PRICE,
        shieldCount: (prev.shieldCount ?? 0) + 1,
      };
    });
  };

  const handleUseShield = () => {
    updateState((prev) => {
      const currentCount = prev.shieldCount ?? 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        shieldCount: currentCount - 1,
      };
    });
  };

  const handleBuyCoinPackage = (pkg: CoinPackage) => {
    updateState((prev) => {
      const currentDiamonds = prev.diamonds ?? 0;
      if (currentDiamonds < pkg.diamondCost) return prev;
      return {
        ...prev,
        diamonds: currentDiamonds - pkg.diamondCost,
        coins: prev.coins + pkg.coins,
      };
    });
  };

  const handleBuyAvatar = (avatar: AvatarItem) => {
    updateState((prev) => {
      if (prev.coins < avatar.price || prev.ownedAvatarIds.includes(avatar.id)) return prev;
      return {
        ...prev,
        coins: prev.coins - avatar.price,
        ownedAvatarIds: [...prev.ownedAvatarIds, avatar.id],
        selectedAvatarId: avatar.id,
      };
    });
  };

  const handleSelectAvatar = (avatarId: string) => {
    updateState((prev) => {
      if (!prev.ownedAvatarIds.includes(avatarId)) return prev;
      return {
        ...prev,
        selectedAvatarId: avatarId,
      };
    });
  };

  const handleUpdateName = (name: string) => {
    updateState((prev) => {
      const isFirst = !prev.hasChangedNameOnce;
      if (isFirst) {
        return {
          ...prev,
          playerName: name,
          hasChangedNameOnce: true,
        };
      } else {
        const currentDiamonds = prev.diamonds ?? 0;
        if (currentDiamonds < 1) return prev;
        return {
          ...prev,
          playerName: name,
          diamonds: currentDiamonds - 1,
          hasChangedNameOnce: true,
        };
      }
    });
  };

  const handleToggleTheme = () => {
    updateState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleToggleSound = () => {
    updateState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const isDark = gameState.theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center transition-colors duration-300 ${
        isDark
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 10-Second Loading Screen */}
      {activeScreen === 'loading' ? (
        <LoadingScreen onLoaded={handleLoadingComplete} />
      ) : (
        /* Mobile-First App Viewport Frame */
        <div className="w-full max-w-md min-h-screen flex flex-col justify-between px-4 py-3 pb-6 relative">
          {/* Top Status Header */}
          <Header
            gameState={gameState}
            incomingRequestsCount={incomingRequests.length}
            onOpenSettings={handleOpenSettings}
            onOpenShop={handleOpenShop}
            onOpenFriends={handleOpenFriends}
            onOpenClan={handleOpenClan}
          />

          {/* Active Screen Transition */}
          <main className="flex-1 flex flex-col w-full my-2">
            <AnimatePresence mode="wait">
              {activeScreen === 'main_menu' && (
                <motion.div
                  key="main_menu"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <MainMenu
                    gameState={gameState}
                    incomingRequestsCount={incomingRequests.length}
                    onStartGame={handleStartGame}
                    onOpenShop={handleOpenShop}
                    onOpenSettings={handleOpenSettings}
                    onOpenFriends={handleOpenFriends}
                    onOpenClan={handleOpenClan}
                  />
                </motion.div>
              )}

              {activeScreen === 'levels' && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <LevelsScreen
                    gameState={gameState}
                    onSelectLevel={handleSelectLevel}
                    onBack={() => setActiveScreen('main_menu')}
                    onOpenShop={handleOpenShop}
                  />
                </motion.div>
              )}

              {activeScreen === 'clan' && (
                <motion.div
                  key="clan"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <ClanScreen
                    gameState={gameState}
                    currentUserId={currentUserId}
                    onlineProfile={onlineProfile}
                    onStartDuel={handleStartDuel}
                    onUpdateGameState={updateState}
                    onBack={() => setActiveScreen('main_menu')}
                  />
                </motion.div>
              )}

              {activeScreen === 'friends' && (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <FriendsScreen
                    gameState={gameState}
                    currentUserId={currentUserId}
                    onlineProfile={onlineProfile}
                    incomingRequests={incomingRequests}
                    onStartDuel={handleStartDuel}
                    onBack={() => setActiveScreen('main_menu')}
                  />
                </motion.div>
              )}

              {activeScreen === 'duel' && activeDuelMatchId && (
                <motion.div
                  key="duel"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <DuelScreen
                    matchId={activeDuelMatchId}
                    gameState={gameState}
                    currentUserId={currentUserId}
                    onFinishDuel={handleFinishDuel}
                    onExit={() => {
                      setActiveDuelMatchId(null);
                      setActiveScreen('friends');
                    }}
                  />
                </motion.div>
              )}

              {activeScreen === 'quiz' && selectedLevel && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <QuizScreen
                    level={selectedLevel}
                    gameState={gameState}
                    onDeductHeart={handleDeductHeart}
                    onUseFreeze={handleUseFreeze}
                    onUseFiftyFifty={handleUseFiftyFifty}
                    onUseShield={handleUseShield}
                    onCompleteLevel={handleCompleteLevel}
                    onExit={() => {
                      setActiveScreen('levels');
                      setSelectedLevel(null);
                    }}
                    onOpenShop={handleOpenShop}
                  />
                </motion.div>
              )}

              {activeScreen === 'shop' && (
                <motion.div
                  key="shop"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <ShopScreen
                    gameState={gameState}
                    onBuyHeart={handleBuyHeart}
                    onBuyFreeze={handleBuyFreeze}
                    onBuyFiftyFifty={handleBuyFiftyFifty}
                    onBuyShield={handleBuyShield}
                    onBuyAvatar={handleBuyAvatar}
                    onBuyCoinPackage={handleBuyCoinPackage}
                    onSelectAvatar={handleSelectAvatar}
                    onBack={() => setActiveScreen('main_menu')}
                  />
                </motion.div>
              )}

              {activeScreen === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <SettingsScreen
                    gameState={gameState}
                    onUpdateName={handleUpdateName}
                    onSelectAvatar={handleSelectAvatar}
                    onToggleTheme={handleToggleTheme}
                    onToggleSound={handleToggleSound}
                    onOpenShop={handleOpenShop}
                    onBack={() => setActiveScreen('main_menu')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Incoming 1v1 Duel Challenge Modal */}
          {incomingDuelInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border-2 border-amber-500 text-center space-y-4 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto animate-pulse">
                  <Swords className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">چالش مسابقه آنلاین ⚔️</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    کاربر <strong className="text-amber-400">{incomingDuelInvite.hostName}</strong> شما را به یک دوئل ۵ سوالی آنلاین دعوت کرده است!
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAcceptIncomingDuel(incomingDuelInvite)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer active:scale-95"
                  >
                    قبول چالش و ورود ⚔️
                  </button>
                  <button
                    onClick={() => handleDeclineIncomingDuel(incomingDuelInvite)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    رد
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 4-Level Diamond Reward Modal */}
          {showDiamondModal && (
            <DiamondRewardModal
              diamondsAwarded={2}
              onClose={() => setShowDiamondModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

