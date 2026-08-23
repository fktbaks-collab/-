import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  limit,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { OnlineUserProfile, FriendRequest, DuelMatch } from '../types';
import { ALL_POOLED_QUESTIONS } from '../data/quizData';


export function generateFriendCode(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = clean.length >= 4 ? clean.substring(0, 4) : Math.floor(1000 + Math.random() * 9000).toString();
  return `IRAN-${suffix}`;
}

// 1. Sync or Create Online User Profile
export async function syncUserProfile(
  userId: string,
  playerName: string,
  avatarId: string,
  trophies: number,
  level: number
): Promise<OnlineUserProfile> {
  const now = Date.now();
  let friendCode = `FT-${userId.substring(0, 4).toUpperCase()}`;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existing = snap.data() as OnlineUserProfile;
      friendCode = existing.friendCode || friendCode;
      const updated: Partial<OnlineUserProfile> = {
        playerName,
        avatarId,
        trophies,
        level,
        isOnline: true,
        lastSeen: now,
        updatedAt: now,
      };
      await updateDoc(userRef, updated);
      return {
        ...existing,
        ...updated,
      } as OnlineUserProfile;
    } else {
      const newProfile: OnlineUserProfile = {
        userId,
        friendCode,
        playerName,
        avatarId,
        trophies,
        level,
        isOnline: true,
        lastSeen: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('syncUserProfile fallback to local profile:', err);
    return {
      userId,
      friendCode,
      playerName,
      avatarId,
      trophies,
      level,
      isOnline: true,
      lastSeen: now,
      updatedAt: now,
    };
  }
}

// 2. Search Online Players by Name or FriendCode
export async function searchPlayers(searchTerm: string, currentUserId: string): Promise<OnlineUserProfile[]> {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(query(usersRef, limit(30)));
    const results: OnlineUserProfile[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as OnlineUserProfile;
      if (data.userId !== currentUserId) {
        const matchName = data.playerName?.toLowerCase().includes(term);
        const matchCode = data.friendCode?.toLowerCase().includes(term);
        if (matchName || matchCode) {
          results.push(data);
        }
      }
    });

    return results;
  } catch (err) {
    console.warn('searchPlayers offline warning:', err);
    return [];
  }
}

// 3. Get Recent/Suggested Players
export async function getSuggestedPlayers(currentUserId: string): Promise<OnlineUserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('lastSeen', 'desc'), limit(15));
    const snap = await getDocs(q);
    const results: OnlineUserProfile[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as OnlineUserProfile;
      if (data.userId !== currentUserId) {
        results.push(data);
      }
    });

    return results;
  } catch (err) {
    console.warn('getSuggestedPlayers offline warning:', err);
    return [];
  }
}

// 4. Send Friend Request
export async function sendFriendRequest(
  fromUser: { userId: string; playerName: string; avatarId: string; trophies: number },
  toUserId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const reqsRef = collection(db, 'friendRequests');
    const q = query(
      reqsRef,
      where('fromUserId', '==', fromUser.userId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, message: 'قبلاً برای این کاربر درخواست دوستی ارسال کرده‌اید!' };
    }

    await addDoc(reqsRef, {
      fromUserId: fromUser.userId,
      fromName: fromUser.playerName,
      fromAvatarId: fromUser.avatarId,
      fromTrophies: fromUser.trophies,
      toUserId,
      status: 'pending',
      createdAt: Date.now(),
    });

    return { success: true, message: 'درخواست دوستی با موفقیت ارسال شد!' };
  } catch (err: any) {
    console.warn('sendFriendRequest warning:', err);
    return { success: false, message: 'خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.' };
  }
}

// 5. Subscribe to incoming friend requests
export function subscribeToFriendRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  try {
    const reqsRef = collection(db, 'friendRequests');
    const q = query(reqsRef, where('toUserId', '==', userId), where('status', '==', 'pending'));

    return onSnapshot(
      q,
      (snap) => {
        const list: FriendRequest[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<FriendRequest, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('FriendRequests subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error initiating friend requests subscription:', err);
    return () => {};
  }
}

// 6. Accept / Reject Friend Request
export async function respondToFriendRequest(requestId: string, fromUserId: string, toUserId: string, accept: boolean) {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    if (accept) {
      await updateDoc(reqRef, { status: 'accepted' });
      // Record friendship
      const friendshipsRef = collection(db, 'friendships');
      await addDoc(friendshipsRef, {
        userA: fromUserId,
        userB: toUserId,
        createdAt: Date.now(),
      });
    } else {
      await updateDoc(reqRef, { status: 'rejected' });
    }
  } catch (err) {
    console.warn('respondToFriendRequest error:', err);
  }
}

// 7. Get Friends List
export async function getFriendsList(currentUserId: string): Promise<OnlineUserProfile[]> {
  try {
    const friendshipsRef = collection(db, 'friendships');
    
    // Friendships where user is userA or userB
    const q1 = query(friendshipsRef, where('userA', '==', currentUserId));
    const q2 = query(friendshipsRef, where('userB', '==', currentUserId));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const friendUserIds = new Set<string>();

    snap1.forEach((d) => friendUserIds.add(d.data().userB));
    snap2.forEach((d) => friendUserIds.add(d.data().userA));

    if (friendUserIds.size === 0) return [];

    const friends: OnlineUserProfile[] = [];
    for (const fId of Array.from(friendUserIds)) {
      const uSnap = await getDoc(doc(db, 'users', fId));
      if (uSnap.exists()) {
        friends.push(uSnap.data() as OnlineUserProfile);
      }
    }

    return friends;
  } catch (err) {
    console.warn('getFriendsList warning:', err);
    return [];
  }
}

// 8. Create or Invite to 1v1 Duel Match
export async function createDuelMatch(
  hostUser: { userId: string; playerName: string; avatarId: string },
  guestUser: { userId: string; playerName: string; avatarId: string }
): Promise<string> {
  const pool = [...ALL_POOLED_QUESTIONS].sort(() => 0.5 - Math.random());
  const selectedQuestionIds = pool.slice(0, 5).map((q) => q.id);

  const matchesRef = collection(db, 'duelMatches');
  const newMatch = await addDoc(matchesRef, {
    hostUserId: hostUser.userId,
    hostName: hostUser.playerName,
    hostAvatarId: hostUser.avatarId,
    hostScore: 0,
    hostCurrentQ: 0,
    hostFinished: false,
    guestUserId: guestUser.userId,
    guestName: guestUser.playerName,
    guestAvatarId: guestUser.avatarId,
    guestScore: 0,
    guestCurrentQ: 0,
    guestFinished: false,
    status: 'waiting',
    questionIds: selectedQuestionIds,
    winnerId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return newMatch.id;
}

// 9. Subscribe to Incoming Duel Invites
export function subscribeToIncomingDuels(
  userId: string,
  callback: (duels: DuelMatch[]) => void
): Unsubscribe {
  try {
    const matchesRef = collection(db, 'duelMatches');
    const q = query(matchesRef, where('guestUserId', '==', userId), where('status', '==', 'waiting'));

    return onSnapshot(
      q,
      (snap) => {
        const list: DuelMatch[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<DuelMatch, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('IncomingDuels subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to duels:', err);
    return () => {};
  }
}

// 10. Subscribe to a Specific Duel Match
export function subscribeToMatch(matchId: string, callback: (match: DuelMatch | null) => void): Unsubscribe {
  try {
    const matchRef = doc(db, 'duelMatches', matchId);
    return onSnapshot(
      matchRef,
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...(snap.data() as Omit<DuelMatch, 'id'>) });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn('Match subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to match:', err);
    return () => {};
  }
}

// 11. Update Match State (Accept, Answer Question, Finish)
export async function updateDuelMatch(matchId: string, updates: Partial<DuelMatch>) {
  try {
    const matchRef = doc(db, 'duelMatches', matchId);
    await updateDoc(matchRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('updateDuelMatch warning:', err);
  }
}

// -------------------------------------------------------------
// CLAN / GUILD & REAL-TIME CLAN CHAT SYSTEM (UP TO 30 MEMBERS)
// -------------------------------------------------------------

export const CLAN_BADGES = [
  { id: 'badge_lion', icon: '🦁', name: 'شیرهای پارس', color: 'from-amber-500 to-yellow-600' },
  { id: 'badge_eagle', icon: '🦅', name: 'عقاب‌های تیزپرواز', color: 'from-blue-600 to-indigo-700' },
  { id: 'badge_fire', icon: '🔥', name: 'آتشین‌ها', color: 'from-rose-500 to-red-700' },
  { id: 'badge_crown', icon: '👑', name: 'تاج شاهی', color: 'from-yellow-400 to-amber-600' },
  { id: 'badge_shield', icon: '🛡️', name: 'سپر آهنین', color: 'from-emerald-500 to-teal-700' },
  { id: 'badge_swords', icon: '⚔️', name: 'جنگجویان کوییز', color: 'from-purple-600 to-pink-700' },
  { id: 'badge_tiger', icon: '🐯', name: 'ببرهای خروشان', color: 'from-orange-500 to-amber-700' },
  { id: 'badge_star', icon: '⭐', name: 'ستارگان طلایی', color: 'from-cyan-500 to-blue-600' },
];

import { Clan, ClanMember, ClanMessage } from '../types';

// Create a new Clan
export async function createClan(
  user: { userId: string; playerName: string; avatarId: string; trophies: number; level: number },
  clanData: { name: string; badge: string; description: string; minTrophies: number }
): Promise<{ success: boolean; clanId?: string; message: string }> {
  try {
    const clansRef = collection(db, 'clans');
    const newClanDoc = await addDoc(clansRef, {
      name: clanData.name.trim(),
      badge: clanData.badge || '🦁',
      description: clanData.description.trim() || 'به اتحاد ما خوش آمدید!',
      minTrophies: Number(clanData.minTrophies) || 0,
      leaderId: user.userId,
      leaderName: user.playerName,
      memberCount: 1,
      totalTrophies: user.trophies || 0,
      createdAt: Date.now(),
    });

    const clanId = newClanDoc.id;

    // Add leader as first member
    const membersRef = collection(db, 'clanMembers');
    await addDoc(membersRef, {
      clanId,
      userId: user.userId,
      playerName: user.playerName,
      avatarId: user.avatarId,
      trophies: user.trophies || 0,
      level: user.level || 1,
      role: 'leader',
      joinedAt: Date.now(),
    });

    // Update user profile
    const userRef = doc(db, 'users', user.userId);
    await updateDoc(userRef, { clanId, clanName: clanData.name.trim() });

    // Send initial system message
    const msgRef = collection(db, 'clanMessages');
    await addDoc(msgRef, {
      clanId,
      senderId: 'system',
      senderName: 'سیستم',
      text: `گروه "${clanData.name}" توسط ${user.playerName} ایجاد شد! به گروه خوش آمدید 🎉`,
      type: 'system',
      createdAt: Date.now(),
    });

    return { success: true, clanId, message: 'اتحاد با موفقیت ساخته شد!' };
  } catch (err: any) {
    console.error('Error creating clan:', err);
    return { success: false, message: err?.message || 'خطا در ساخت اتحاد.' };
  }
}

// Search and List Clans
export async function getClansList(searchTerm?: string): Promise<Clan[]> {
  const clansRef = collection(db, 'clans');
  const q = query(clansRef, orderBy('totalTrophies', 'desc'), limit(30));
  const snap = await getDocs(q);
  const clans: Clan[] = [];

  snap.forEach((d) => {
    clans.push({ id: d.id, ...(d.data() as Omit<Clan, 'id'>) });
  });

  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    return clans.filter((c) => c.name.toLowerCase().includes(term));
  }

  return clans;
}

// Subscribe to Clan details
export function subscribeToClan(clanId: string, callback: (clan: Clan | null) => void): Unsubscribe {
  try {
    const clanRef = doc(db, 'clans', clanId);
    return onSnapshot(
      clanRef,
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...(snap.data() as Omit<Clan, 'id'>) });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn('Clan subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error in subscribeToClan:', err);
    return () => {};
  }
}

// Subscribe to Clan Members
export function subscribeToClanMembers(
  clanId: string,
  callback: (members: ClanMember[]) => void
): Unsubscribe {
  try {
    const membersRef = collection(db, 'clanMembers');
    const q = query(membersRef, where('clanId', '==', clanId));

    return onSnapshot(
      q,
      (snap) => {
        const list: ClanMember[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ClanMember, 'id'>) });
        });
        // Sort by trophies desc
        list.sort((a, b) => (b.trophies || 0) - (a.trophies || 0));
        callback(list);
      },
      (error) => {
        console.warn('ClanMembers subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error in subscribeToClanMembers:', err);
    return () => {};
  }
}

// Join a Clan (Enforcing Max 30 Members)
export async function joinClan(
  clanId: string,
  user: { userId: string; playerName: string; avatarId: string; trophies: number; level: number }
): Promise<{ success: boolean; message: string }> {
  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) {
      return { success: false, message: 'این گروه یافت نشد!' };
    }

    const clanData = clanSnap.data() as Clan;
    if (clanData.memberCount >= 30) {
      return { success: false, message: 'ظرفیت این گروه تکمیل است (حداکثر ۳۰ نفر)!' };
    }

    if (user.trophies < (clanData.minTrophies || 0)) {
      return {
        success: false,
        message: `حداقل کاپ برای عضویت در این گروه ${clanData.minTrophies} است!`,
      };
    }

    // Check if already in this clan
    const membersRef = collection(db, 'clanMembers');
    const existingQ = query(
      membersRef,
      where('clanId', '==', clanId),
      where('userId', '==', user.userId)
    );
    const existSnap = await getDocs(existingQ);
    if (!existSnap.empty) {
      return { success: false, message: 'شما در حال حاضر عضو این گروه هستید.' };
    }

    // Add Member
    await addDoc(membersRef, {
      clanId,
      userId: user.userId,
      playerName: user.playerName,
      avatarId: user.avatarId,
      trophies: user.trophies || 0,
      level: user.level || 1,
      role: 'member',
      joinedAt: Date.now(),
    });

    // Update Clan count and total trophies
    await updateDoc(clanRef, {
      memberCount: (clanData.memberCount || 0) + 1,
      totalTrophies: (clanData.totalTrophies || 0) + (user.trophies || 0),
    });

    // Update user profile
    const userRef = doc(db, 'users', user.userId);
    await updateDoc(userRef, { clanId, clanName: clanData.name });

    // Send system message
    const msgRef = collection(db, 'clanMessages');
    await addDoc(msgRef, {
      clanId,
      senderId: 'system',
      senderName: 'سیستم',
      text: `${user.playerName} به جمع اعضای گروه پیوست! 👋`,
      type: 'system',
      createdAt: Date.now(),
    });

    return { success: true, message: `شما با موفقیت به گروه "${clanData.name}" پیوستید!` };
  } catch (err: any) {
    console.error('Error joining clan:', err);
    return { success: false, message: err?.message || 'خطا در عضویت در گروه.' };
  }
}

// Leave a Clan
export async function leaveClan(
  clanId: string,
  userId: string,
  playerName: string,
  userTrophies: number
): Promise<{ success: boolean; message: string }> {
  try {
    const membersRef = collection(db, 'clanMembers');
    const q = query(membersRef, where('clanId', '==', clanId), where('userId', '==', userId));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, message: 'شما در این گروه عضو نیستید.' };
    }

    let memberRole = 'member';
    for (const d of snap.docs) {
      memberRole = d.data().role || 'member';
      await deleteDoc(d.ref);
    }

    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);

    if (clanSnap.exists()) {
      const clanData = clanSnap.data() as Clan;
      const newCount = Math.max(0, (clanData.memberCount || 1) - 1);
      const newTrophies = Math.max(0, (clanData.totalTrophies || 0) - (userTrophies || 0));

      const updates: Partial<Clan> = {
        memberCount: newCount,
        totalTrophies: newTrophies,
      };

      // If leader leaves, reassign leader if others exist
      if (memberRole === 'leader' && newCount > 0) {
        const remainingQ = query(membersRef, where('clanId', '==', clanId), limit(1));
        const remSnap = await getDocs(remainingQ);
        if (!remSnap.empty) {
          const nextLeader = remSnap.docs[0].data() as ClanMember;
          await updateDoc(remSnap.docs[0].ref, { role: 'leader' });
          updates.leaderId = nextLeader.userId;
          updates.leaderName = nextLeader.playerName;
        }
      }

      await updateDoc(clanRef, updates);
    }

    // Update user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { clanId: null, clanName: null });

    // Send system message
    const msgRef = collection(db, 'clanMessages');
    await addDoc(msgRef, {
      clanId,
      senderId: 'system',
      senderName: 'سیستم',
      text: `${playerName} از گروه خارج شد.`,
      type: 'system',
      createdAt: Date.now(),
    });

    return { success: true, message: 'از گروه خارج شدید.' };
  } catch (err: any) {
    console.error('Error leaving clan:', err);
    return { success: false, message: 'خطا در خروج از گروه.' };
  }
}

// Send Real-Time Clan Chat Message
export async function sendClanMessage(
  clanId: string,
  user: { userId: string; playerName: string; avatarId?: string; role?: string },
  text: string
): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText) return false;

  const msgRef = collection(db, 'clanMessages');
  await addDoc(msgRef, {
    clanId,
    senderId: user.userId,
    senderName: user.playerName,
    senderAvatarId: user.avatarId || 'avatar_1',
    senderRole: user.role || 'member',
    text: cleanText,
    type: 'chat',
    createdAt: Date.now(),
  });

  return true;
}

// Subscribe to Live Clan Messages
export function subscribeToClanMessages(
  clanId: string,
  callback: (messages: ClanMessage[]) => void
): Unsubscribe {
  try {
    const msgRef = collection(db, 'clanMessages');
    const q = query(msgRef, where('clanId', '==', clanId), orderBy('createdAt', 'asc'), limit(60));

    return onSnapshot(
      q,
      (snap) => {
        const list: ClanMessage[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ClanMessage, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('ClanMessages subscription notice:', error.code);
      }
    );
  } catch (err) {
    console.warn('Error in subscribeToClanMessages:', err);
    return () => {};
  }
}

