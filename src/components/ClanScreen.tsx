import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  MessageSquare,
  PlusCircle,
  Search,
  Trophy,
  Send,
  ArrowLeft,
  Crown,
  LogOut,
  Sparkles,
  Swords,
  Flame,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { GameState, Clan, ClanMember, ClanMessage, OnlineUserProfile } from '../types';
import { AVATAR_LIST } from '../data/quizData';
import { soundManager } from '../utils/audio';
import {
  CLAN_BADGES,
  createClan,
  getClansList,
  joinClan,
  leaveClan,
  sendClanMessage,
  subscribeToClan,
  subscribeToClanMembers,
  subscribeToClanMessages,
  createDuelMatch,
} from '../services/multiplayerService';

interface ClanScreenProps {
  gameState: GameState;
  currentUserId: string;
  onlineProfile: OnlineUserProfile | null;
  onStartDuel: (matchId: string) => void;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
  onBack: () => void;
}

export const ClanScreen: React.FC<ClanScreenProps> = ({
  gameState,
  currentUserId,
  onlineProfile,
  onStartDuel,
  onUpdateGameState,
  onBack,
}) => {
  const isDark = gameState.theme === 'dark';
  const userClanId = onlineProfile?.clanId || gameState.clanId;

  // States for non-clan view
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [clansList, setClansList] = useState<Clan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // States for Clan Creation Form
  const [newClanName, setNewClanName] = useState('');
  const [newClanBadge, setNewClanBadge] = useState('🦁');
  const [newClanDesc, setNewClanDesc] = useState('');
  const [newClanMinTrophies, setNewClanMinTrophies] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // States for In-Clan View
  const [currentClan, setCurrentClan] = useState<Clan | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [clanMessages, setClanMessages] = useState<ClanMessage[]>([]);
  const [clanSubTab, setClanSubTab] = useState<'chat' | 'members'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load Clans list
  const loadClans = async () => {
    setIsSearching(true);
    try {
      const list = await getClansList(searchQuery);
      setClansList(list);
    } catch (err) {
      console.error('Error fetching clans:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!userClanId) {
      loadClans();
    }
  }, [userClanId, searchQuery]);

  // Subscribe to Clan data if user is in a clan
  useEffect(() => {
    if (!userClanId) {
      setCurrentClan(null);
      setClanMembers([]);
      setClanMessages([]);
      return;
    }

    const unsubClan = subscribeToClan(userClanId, (clan) => {
      setCurrentClan(clan);
    });

    const unsubMembers = subscribeToClanMembers(userClanId, (members) => {
      setClanMembers(members);
    });

    const unsubMessages = subscribeToClanMessages(userClanId, (msgs) => {
      setClanMessages(msgs);
    });

    return () => {
      unsubClan();
      unsubMembers();
      unsubMessages();
    };
  }, [userClanId]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (clanSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clanMessages, clanSubTab]);

  // Create Clan Handler
  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName.trim()) {
      showToast('لطفاً نام گروه را وارد کنید.');
      return;
    }

    setIsCreating(true);
    soundManager.playClick();

    const res = await createClan(
      {
        userId: currentUserId,
        playerName: gameState.playerName,
        avatarId: gameState.selectedAvatarId,
        trophies: gameState.trophies,
        level: gameState.level,
      },
      {
        name: newClanName,
        badge: newClanBadge,
        description: newClanDesc,
        minTrophies: newClanMinTrophies,
      }
    );

    setIsCreating(false);

    if (res.success && res.clanId) {
      onUpdateGameState((prev) => ({ ...prev, clanId: res.clanId }));
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Join Clan Handler
  const handleJoinClan = async (clan: Clan) => {
    if (clan.memberCount >= 30) {
      showToast('ظرفیت این گروه تکمیل است (حداکثر ۳۰ نفر)!');
      return;
    }
    if (gameState.trophies < (clan.minTrophies || 0)) {
      showToast(`حداقل کاپ برای عضویت در این گروه ${clan.minTrophies} است.`);
      return;
    }

    setIsJoining(clan.id);
    soundManager.playClick();

    const res = await joinClan(clan.id, {
      userId: currentUserId,
      playerName: gameState.playerName,
      avatarId: gameState.selectedAvatarId,
      trophies: gameState.trophies,
      level: gameState.level,
    });

    setIsJoining(null);

    if (res.success) {
      onUpdateGameState((prev) => ({ ...prev, clanId: clan.id }));
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Leave Clan Handler
  const handleLeaveClan = async () => {
    if (!userClanId) return;
    soundManager.playClick();

    const res = await leaveClan(userClanId, currentUserId, gameState.playerName, gameState.trophies);
    setShowLeaveConfirm(false);

    if (res.success) {
      onUpdateGameState((prev) => ({ ...prev, clanId: null }));
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !userClanId || isSendingMsg) return;

    const userRole = clanMembers.find((m) => m.userId === currentUserId)?.role || 'member';
    setIsSendingMsg(true);
    soundManager.playClick();

    const textToSend = chatInput;
    setChatInput('');

    await sendClanMessage(
      userClanId,
      {
        userId: currentUserId,
        playerName: gameState.playerName,
        avatarId: gameState.selectedAvatarId,
        role: userRole,
      },
      textToSend
    );

    setIsSendingMsg(false);
  };

  // Quick Emoji Sender
  const sendQuickEmoji = (emoji: string) => {
    if (!userClanId) return;
    soundManager.playClick();
    const userRole = clanMembers.find((m) => m.userId === currentUserId)?.role || 'member';
    sendClanMessage(
      userClanId,
      {
        userId: currentUserId,
        playerName: gameState.playerName,
        avatarId: gameState.selectedAvatarId,
        role: userRole,
      },
      emoji
    );
  };

  // Friendly Duel Challenge with clan member
  const handleClanDuel = async (member: ClanMember) => {
    if (member.userId === currentUserId) return;
    soundManager.playClick();
    showToast(`⚔️ درخواست مسابقه برای ${member.playerName} ارسال شد!`);

    try {
      const matchId = await createDuelMatch(
        {
          userId: currentUserId,
          playerName: gameState.playerName,
          avatarId: gameState.selectedAvatarId,
        },
        {
          userId: member.userId,
          playerName: member.playerName,
          avatarId: member.avatarId,
        }
      );
      onStartDuel(matchId);
    } catch (err) {
      console.error('Error challenging clanmate:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-amber-500/50 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn_back_from_clan"
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
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-black text-white">اتحاد و گروه‌ها (Clans)</h2>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. USER IS IN A CLAN -> SHOW CLAN DASHBOARD & CHAT */}
      {/* ------------------------------------------------------------- */}
      {userClanId && currentClan ? (
        <div className="space-y-3">
          {/* Clan Banner Card */}
          <div
            className={`p-4 rounded-3xl border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/40'
                : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400/80 flex items-center justify-center text-3xl shadow-lg shrink-0">
                  {currentClan.badge}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{currentClan.name}</h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                      {clanMembers.length}/۳۰ عضو
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{currentClan.description}</p>
                  <div className="flex items-center gap-3 text-xs text-amber-400 font-black mt-1">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 fill-amber-400" />
                      {currentClan.totalTrophies} کاپ کل
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-indigo-300 text-[11px] flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      لیدر: {currentClan.leaderName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leave Clan Button */}
              <button
                id="btn_leave_clan"
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                title="خروج از گروه"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Tabs: Chat 💬 vs Members 👥 */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 gap-1 text-xs font-bold">
            <button
              id="tab_clan_chat"
              onClick={() => {
                soundManager.playClick();
                setClanSubTab('chat');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                clanSubTab === 'chat'
                  ? 'bg-indigo-500 text-white font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>چت زنده گروه</span>
            </button>

            <button
              id="tab_clan_members"
              onClick={() => {
                soundManager.playClick();
                setClanSubTab('members');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                clanSubTab === 'members'
                  ? 'bg-indigo-500 text-white font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>لیست اعضا ({clanMembers.length}/۳۰)</span>
            </button>
          </div>

          {/* TAB 1: REAL-TIME CLAN CHAT */}
          {clanSubTab === 'chat' && (
            <div className="space-y-2">
              {/* Chat Message Box Container */}
              <div className="h-72 overflow-y-auto p-3 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs flex flex-col justify-start">
                {clanMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-1">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                    <p>هنوز پیامی در گروه ثبت نشده است.</p>
                    <p className="text-[10px]">اولین نفری باشید که سلام می‌گوید!</p>
                  </div>
                ) : (
                  clanMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    const isSystem = msg.type === 'system' || msg.senderId === 'system';
                    const avatar = AVATAR_LIST.find((a) => a.id === msg.senderAvatarId) || AVATAR_LIST[0];

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center py-1">
                          <span className="inline-block px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-[10px] text-indigo-300 font-bold">
                            📢 {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={avatar.image}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 p-0.5 shrink-0"
                        />
                        <div className={`max-w-[75%] space-y-0.5 ${isMe ? 'text-left' : 'text-right'}`}>
                          <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] font-black text-slate-300">{msg.senderName}</span>
                            {msg.senderRole === 'leader' && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> لیدر
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl leading-relaxed break-words font-medium ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tl-none text-right'
                                : 'bg-slate-800 text-slate-100 rounded-tr-none text-right border border-slate-700/80'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Reaction Emojis */}
              <div className="flex items-center justify-between gap-1 px-1">
                {['⚽', '🔥', '🏆', '👏', '⚔️', '😎', '💪'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendQuickEmoji(emoji)}
                    className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="پیام خود را در گروه بنویسید..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-2xl py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMsg}
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CLAN MEMBERS (UP TO 30) */}
          {clanSubTab === 'members' && (
            <div className="space-y-2">
              {clanMembers.map((member, index) => {
                const avatar = AVATAR_LIST.find((a) => a.id === member.avatarId) || AVATAR_LIST[0];
                const isMe = member.userId === currentUserId;
                return (
                  <div
                    key={member.userId}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
                      isMe
                        ? 'bg-indigo-950/40 border-indigo-500/50'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-black text-xs text-slate-500 font-mono">
                        #{index + 1}
                      </span>
                      <img
                        src={avatar.image}
                        alt={member.playerName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-indigo-500/30 p-0.5"
                      />
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{member.playerName}</span>
                          {isMe && <span className="text-[10px] text-cyan-400 font-bold">(شما)</span>}
                          {member.role === 'leader' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> لیدر
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                          <Trophy className="w-3 h-3 fill-amber-400" />
                          {member.trophies} کاپ • سطح {member.level}
                        </span>
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        onClick={() => handleClanDuel(member)}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="دوئل دوستانه"
                      >
                        <Swords className="w-3 h-3" />
                        <span>دوئل</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. USER IS NOT IN A CLAN -> BROWSE OR CREATE */
        /* ------------------------------------------------------------- */
        <div className="space-y-3">
          {/* Tabs: Browse Clans vs Create Clan */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 gap-1 text-xs font-bold">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('browse');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>لیست و جستجوی گروه‌ها</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('create');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>ساخت گروه جدید</span>
            </button>
          </div>

          {/* TAB 1: BROWSE CLANS */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام گروه..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-2xl py-2.5 pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>

              {/* Clans List */}
              <div className="space-y-2.5">
                {clansList.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <Shield className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">گروهی یافت نشد.</p>
                    <p className="text-[11px] text-slate-500">
                      می‌توانید از تب «ساخت گروه جدید» اولین گروه را شما پایه‌گذاری کنید!
                    </p>
                  </div>
                ) : (
                  clansList.map((clan) => {
                    const isFull = clan.memberCount >= 30;
                    const canJoin = gameState.trophies >= (clan.minTrophies || 0) && !isFull;

                    return (
                      <div
                        key={clan.id}
                        className="p-3.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 border border-indigo-400/50 flex items-center justify-center text-2xl shrink-0 shadow">
                            {clan.badge}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-white">{clan.name}</h4>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  isFull
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                }`}
                              >
                                {clan.memberCount}/۳۰ نفر
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold mt-0.5">
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 fill-amber-400" />
                                {clan.totalTrophies} کاپ
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">حداقل {clan.minTrophies} کاپ</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinClan(clan)}
                          disabled={!canJoin || isJoining === clan.id}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : !canJoin
                              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isFull ? 'تکمیل (۳۰)' : isJoining === clan.id ? '...' : 'عضویت'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE CLAN */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateClan} className="p-4 rounded-3xl border border-slate-700 bg-slate-900/90 space-y-4 shadow-lg">
              <div className="text-right">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>مشخصات گروه جدید</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  گروه شما ظرفیت حداکثر ۳۰ نفر بازیکن و قابلیت چت زنده اختصاصی خواهد داشت.
                </p>
              </div>

              {/* Clan Name */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300">نام گروه:</label>
                <input
                  type="text"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  placeholder="مثلاً: قهرمانان کوییز، ارتش سرخ، ..."
                  maxLength={25}
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Clan Badge Selector */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300">نشان / لوگوی گروه:</label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {CLAN_BADGES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setNewClanBadge(b.icon);
                      }}
                      className={`p-2.5 rounded-2xl border text-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        newClanBadge === b.icon
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span className="text-[9px] font-bold text-slate-400">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clan Description */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300">توضیحات و قوانین گروه:</label>
                <textarea
                  value={newClanDesc}
                  onChange={(e) => setNewClanDesc(e.target.value)}
                  placeholder="به گروه ما خوش آمدید! رقابت سالم و دوستانه..."
                  rows={2}
                  maxLength={100}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none"
                />
              </div>

              {/* Min Trophies Requirement */}
              <div className="space-y-1 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">حداقل کاپ برای ورود:</span>
                  <span className="font-black text-amber-400 font-mono">{newClanMinTrophies} کاپ</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newClanMinTrophies}
                  onChange={(e) => setNewClanMinTrophies(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Submit Create Button */}
              <button
                id="btn_submit_create_clan"
                type="submit"
                disabled={isCreating || !newClanName.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isCreating ? 'در حال ساخت گروه...' : 'تایید و ساخت گروه (لیدر)'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Leave Clan Confirmation Dialog Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs p-5 rounded-3xl bg-slate-900 border border-rose-500/50 text-center space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">خروج از گروه</h3>
              <p className="text-xs text-slate-300 mt-1">
                آیا مطمئن هستید که می‌خواهید از گروه «{currentClan?.name}» خارج شوید؟
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLeaveClan}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow transition-all cursor-pointer"
              >
                بله، خارج شو
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
