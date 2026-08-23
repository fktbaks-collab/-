import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  UserPlus,
  Swords,
  Check,
  X,
  Trophy,
  Copy,
  Sparkles,
  Shield,
  Clock,
  Radio,
  Flame,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { GameState, OnlineUserProfile, FriendRequest } from '../types';
import { AVATAR_LIST } from '../data/quizData';
import { soundManager } from '../utils/audio';
import {
  searchPlayers,
  getSuggestedPlayers,
  sendFriendRequest,
  respondToFriendRequest,
  getFriendsList,
  createDuelMatch,
} from '../services/multiplayerService';

interface FriendsScreenProps {
  gameState: GameState;
  currentUserId: string;
  onlineProfile: OnlineUserProfile | null;
  incomingRequests: FriendRequest[];
  onStartDuel: (matchId: string) => void;
  onBack: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  gameState,
  currentUserId,
  onlineProfile,
  incomingRequests,
  onStartDuel,
  onBack,
}) => {
  const isDark = gameState.theme === 'dark';
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OnlineUserProfile[]>([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState<OnlineUserProfile[]>([]);
  const [friendsList, setFriendsList] = useState<OnlineUserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [isCreatingDuel, setIsCreatingDuel] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentAvatar = AVATAR_LIST.find((a) => a.id === gameState.selectedAvatarId) || AVATAR_LIST[0];

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Load Friends & Suggested players
  const loadFriendsData = async () => {
    if (!currentUserId) return;
    setLoadingFriends(true);
    try {
      const [friends, suggested] = await Promise.all([
        getFriendsList(currentUserId),
        getSuggestedPlayers(currentUserId),
      ]);
      setFriendsList(friends);
      setSuggestedPlayers(suggested);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, [currentUserId, activeTab]);

  // Search players handler
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    soundManager.playClick();
    try {
      const results = await searchPlayers(searchQuery, currentUserId);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (targetUser: OnlineUserProfile) => {
    soundManager.playClick();
    setSentRequests((prev) => ({ ...prev, [targetUser.userId]: true }));
    try {
      const res = await sendFriendRequest(
        {
          userId: currentUserId,
          playerName: gameState.playerName,
          avatarId: gameState.selectedAvatarId,
          trophies: gameState.trophies,
        },
        targetUser.userId
      );
      showNotification(res.message);
    } catch (err) {
      showNotification('خطا در ارسال درخواست دوستی.');
    }
  };

  // Respond to request
  const handleRespondRequest = async (req: FriendRequest, accept: boolean) => {
    soundManager.playClick();
    try {
      await respondToFriendRequest(req.id, req.fromUserId, req.toUserId, accept);
      showNotification(accept ? '✓ درخواست دوستی با موفقیت پذیرفته شد!' : 'درخواست دوستی رد شد.');
      loadFriendsData();
    } catch (err) {
      showNotification('خطا در پاسخ به درخواست.');
    }
  };

  // Invite friend to duel match
  const handleInviteToDuel = async (friend: OnlineUserProfile) => {
    soundManager.playClick();
    setIsCreatingDuel(friend.userId);
    try {
      const matchId = await createDuelMatch(
        {
          userId: currentUserId,
          playerName: gameState.playerName,
          avatarId: gameState.selectedAvatarId,
        },
        {
          userId: friend.userId,
          playerName: friend.playerName,
          avatarId: friend.avatarId,
        }
      );
      showNotification(`⚔️ درخواست مسابقه برای ${friend.playerName} ارسال شد!`);
      onStartDuel(matchId);
    } catch (err) {
      console.error('Error starting duel:', err);
      showNotification('خطا در ایجاد اتاق مسابقه دوئل.');
    } finally {
      setIsCreatingDuel(null);
    }
  };

  const handleCopyCode = () => {
    if (!onlineProfile?.friendCode) return;
    navigator.clipboard.writeText(onlineProfile.friendCode);
    setCopiedCode(true);
    soundManager.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-amber-500/50 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn_back_from_friends"
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-base font-black text-white flex items-center gap-1.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>دوستان و مسابقات آنلاین</span>
          </h2>
        </div>
      </div>

      {/* Player Own Online Card & Friend Code */}
      <div
        className={`p-4 rounded-3xl border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-cyan-500/40'
            : 'bg-gradient-to-br from-cyan-50 to-white border-cyan-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border-2 border-cyan-400 p-0.5 bg-slate-800 shrink-0">
              <img
                src={currentAvatar.image}
                alt={gameState.playerName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{gameState.playerName}</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">
                  سطح {gameState.level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-black mt-0.5">
                <Trophy className="w-3.5 h-3.5 fill-amber-400" />
                <span>{gameState.trophies} کاپ</span>
              </div>
            </div>
          </div>

          {/* Friend Code Badge */}
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block mb-1">کد اختصاصی شما:</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              title="کپی کردن کد دوستی"
            >
              <Copy className="w-3 h-3 text-cyan-400" />
              <span>{onlineProfile?.friendCode || 'در حال دریافت...'}</span>
              {copiedCode && <span className="text-[9px] text-emerald-400">کپی شد!</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 gap-1 text-xs font-bold">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('friends');
          }}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-cyan-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>دوستان من ({friendsList.length})</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('search');
          }}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'search'
              ? 'bg-cyan-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>جستجوی بازیکن</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('requests');
          }}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-cyan-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>درخواست‌ها</span>
          {incomingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friendsList.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">هنوز دوستی به لیست شما اضافه نشده است</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                از تب «جستجوی بازیکن» نام یا کد دوستانتان را جستجو کنید یا به بازیکنان پیشنهادی درخواست دوستی بدهید!
              </p>
              <button
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                جستجو و یافتن بازیکنان
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friendsList.map((friend) => {
                const friendAvatar = AVATAR_LIST.find((a) => a.id === friend.avatarId) || AVATAR_LIST[0];
                return (
                  <div
                    key={friend.userId}
                    className="p-3.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-cyan-500/40 p-0.5 relative shrink-0">
                        <img
                          src={friendAvatar.image}
                          alt={friend.playerName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            friend.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white">{friend.playerName}</h4>
                          <span className="text-[10px] text-cyan-400 font-mono">({friend.friendCode})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mt-0.5">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 fill-amber-400" />
                            {friend.trophies} کاپ
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 text-[11px]">سطح {friend.level}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`btn_duel_friend_${friend.userId}`}
                      onClick={() => handleInviteToDuel(friend)}
                      disabled={isCreatingDuel === friend.userId}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>{isCreatingDuel === friend.userId ? 'در حال ارسال...' : 'مسابقه ⚔️'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggested Players Section */}
          {suggestedPlayers.length > 0 && (
            <div className="pt-3 space-y-2.5">
              <h3 className="text-xs font-black text-slate-400 flex items-center gap-1.5 px-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>بازیکنان آنلاین و پیشنهادی</span>
              </h3>

              <div className="space-y-2">
                {suggestedPlayers
                  .filter((p) => !friendsList.some((f) => f.userId === p.userId))
                  .slice(0, 4)
                  .map((player) => {
                    const avatar = AVATAR_LIST.find((a) => a.id === player.avatarId) || AVATAR_LIST[0];
                    const isRequested = sentRequests[player.userId];
                    return (
                      <div
                        key={player.userId}
                        className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={avatar.image}
                            alt={player.playerName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 p-0.5"
                          />
                          <div className="text-right">
                            <span className="text-xs font-black text-white block">{player.playerName}</span>
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Trophy className="w-2.5 h-2.5 fill-amber-400" />
                              {player.trophies} کاپ
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSendFriendRequest(player)}
                          disabled={isRequested}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isRequested
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 active:scale-95'
                          }`}
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>{isRequested ? 'ارسال شد' : 'درخواست دوستی'}</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEARCH PLAYERS */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا کد دوستی (مثلاً FT-A1B2)..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl py-2.5 pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-2xl shadow transition-all cursor-pointer"
            >
              {isSearching ? '...' : 'جستجو'}
            </button>
          </form>

          {/* Search Results */}
          <div className="space-y-2 pt-1">
            {searchResults.length === 0 && searchQuery.trim() && !isSearching && (
              <p className="text-xs text-slate-400 text-center py-6">
                بازیکنی با این مشخصات یافت نشد. کد اختصاصی یا املای نام را بررسی کنید.
              </p>
            )}

            {searchResults.map((player) => {
              const avatar = AVATAR_LIST.find((a) => a.id === player.avatarId) || AVATAR_LIST[0];
              const isFriend = friendsList.some((f) => f.userId === player.userId);
              const isRequested = sentRequests[player.userId];

              return (
                <div
                  key={player.userId}
                  className="p-3.5 rounded-2xl border border-slate-700 bg-slate-900/90 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.image}
                      alt={player.playerName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl bg-slate-800 border border-cyan-500/40 p-0.5"
                    />
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{player.playerName}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">({player.friendCode})</span>
                      </div>
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <Trophy className="w-3 h-3 fill-amber-400" />
                        {player.trophies} کاپ • سطح {player.level}
                      </span>
                    </div>
                  </div>

                  {isFriend ? (
                    <button
                      onClick={() => handleInviteToDuel(player)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>دوئل</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendFriendRequest(player)}
                      disabled={isRequested}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isRequested
                          ? 'bg-slate-800 text-slate-500 border border-slate-700'
                          : 'bg-cyan-500 text-slate-950 font-black hover:bg-cyan-400 active:scale-95'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isRequested ? 'درخواست فرستاده شد' : 'افزودن دوست'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FRIEND REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-2.5">
          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-slate-800 bg-slate-900/60 space-y-2">
              <UserPlus className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">در حال حاضر درخواست دوستی جدیدی ندارید.</p>
            </div>
          ) : (
            incomingRequests.map((req) => {
              const avatar = AVATAR_LIST.find((a) => a.id === req.fromAvatarId) || AVATAR_LIST[0];
              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl border border-cyan-500/40 bg-slate-900/90 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.image}
                      alt={req.fromName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-cyan-500/40 p-0.5"
                    />
                    <div className="text-right">
                      <h4 className="text-xs font-black text-white">{req.fromName}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {req.fromTrophies} کاپ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondRequest(req, true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>قبول</span>
                    </button>
                    <button
                      onClick={() => handleRespondRequest(req, false)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
