import { useEffect } from 'react';
import { feedCacheService } from '../services/feedCacheService';

const getUserId = (user: any, token: string | null): string | null => {
  if (user?.id) return String(user.id);
  if (token && token.includes('.')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.id) return String(payload.id);
    } catch (e) {}
  }
  return null;
};

const getClientRank = (xp: number) => {
  const score = xp || 0;
  if (score >= 6000) return { name_ar: 'أسطورة الريهاب', name_en: 'Rehab Legend', emoji: '👑', tier: 5 };
  if (score >= 3000) return { name_ar: 'النيوروچي', name_en: 'Neurogenic', emoji: '🧠', tier: 4 };
  if (score >= 1500) return { name_ar: 'سيد الأورثو', name_en: 'Ortho King', emoji: '🦴', tier: 3 };
  if (score >= 500) return { name_ar: 'أخصائي الألم', name_en: 'Pain Specialist', emoji: '⚡', tier: 2 };
  return { name_ar: 'طالب تشريح', name_en: 'Anatomy Rookie', emoji: '🧪', tier: 1 };
};

interface UseAppSocketsProps {
  socket: any;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  token: string | null;
  leaderboardTab: string;
  setCommunityPosts: React.Dispatch<React.SetStateAction<any[]>>;
  setNewsPosts: React.Dispatch<React.SetStateAction<any[]>>;
  setEpisodes: React.Dispatch<React.SetStateAction<any[]>>;
  setSuggestions: React.Dispatch<React.SetStateAction<any[]>>;
  setAdminSuggestions: React.Dispatch<React.SetStateAction<any[]>>;
  setLeaderboard: React.Dispatch<React.SetStateAction<any[]>>;
  setDailyQuestion: React.Dispatch<React.SetStateAction<any>>;
  fetchDailyQuestion: () => void;
  fetchEpisodes: (silently?: boolean) => void;
  fetchCommunityPosts: () => void;
  fetchNewsPosts: () => void;
  fetchLeaderboard: () => void;
  fetchPublicSuggestions: () => void;
  showToast: (msg: string) => void;
  triggerXpPopup: (amount: number, isSilent?: boolean) => void;
  playChatSound: (type: 'start' | 'success' | 'win' | 'error' | 'tick') => void;
}

export const useAppSockets = ({
  socket,
  user,
  setUser,
  token,
  leaderboardTab,
  setCommunityPosts,
  setNewsPosts,
  setEpisodes,
  setSuggestions,
  setAdminSuggestions,
  setLeaderboard,
  setDailyQuestion,
  fetchDailyQuestion,
  fetchEpisodes,
  fetchCommunityPosts,
  fetchNewsPosts,
  fetchLeaderboard,
  fetchPublicSuggestions,
  showToast,
  triggerXpPopup,
  playChatSound,
}: UseAppSocketsProps) => {
  // Socket listeners for real-time feed, news, and episode updates
  useEffect(() => {
    if (!socket) return () => {};

    const handlePostCreated = (newPost: any) => {
      console.log('[Socket] post_created received:', newPost);
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const isMatch = (p: any) => {
          if (String(p.id) === String(newPost.id)) return true;
          if (String(p.id).startsWith('temp-') && 
              String(p.user_id) === String(newPost.user_id) && 
              (p.content || '').trim() === (newPost.content || '').trim() && 
              (p.title || '').trim() === (newPost.title || '').trim()) {
            return true;
          }
          return false;
        };
        const exists = prev.some(isMatch);
        let updated;
        if (exists) {
          updated = prev.map(p => isMatch(p) ? { ...p, ...newPost, pending: false } : p);
          console.log('[Socket] post_created matched existing post, updated in place.');
        } else {
          updated = [newPost, ...prev];
          console.log('[Socket] post_created did not match, prepended to feed.');
        }
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handlePostUpdated = (updatedPost: any) => {
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const updated = prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handlePostDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setCommunityPosts(prev => {
        const updated = prev.filter(p => p.id !== data.id);
        if (userId) feedCacheService.set(`feed_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementCreated = (newAnn: any) => {
      console.log('[Socket] announcement_created received:', newAnn);
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const isMatch = (p: any) => {
          if (String(p.id) === String(newAnn.id)) return true;
          if (String(p.id).startsWith('temp-') && 
              String(p.user_id) === String(newAnn.user_id) && 
              (p.content || '').trim() === (newAnn.content || '').trim() && 
              (p.title || '').trim() === (newAnn.title || '').trim()) {
            return true;
          }
          return false;
        };
        const exists = prev.some(isMatch);
        let updated;
        if (exists) {
          updated = prev.map(p => isMatch(p) ? { ...p, ...newAnn, pending: false } : p);
          console.log('[Socket] announcement_created matched existing announcement, updated in-place.');
        } else {
          updated = [newAnn, ...prev];
          console.log('[Socket] announcement_created did not match, prepended to news list.');
        }
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementUpdated = (updatedAnn: any) => {
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const updated = prev.map(p => p.id === updatedAnn.id ? { ...p, ...updatedAnn } : p);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleAnnouncementDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setNewsPosts(prev => {
        const updated = prev.filter(p => p.id !== data.id);
        if (userId) feedCacheService.set(`news_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeCreated = (newEp: any) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        if (prev.some((e: any) => e.id === newEp.id)) return prev;
        const updated = [newEp, ...prev];
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeUpdated = (updatedEp: any) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        const updated = prev.map((e: any) => e.id === updatedEp.id ? { ...e, ...updatedEp } : e);
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    const handleEpisodeDeleted = (data: { id: number }) => {
      const userId = getUserId(user, token);
      setEpisodes(prev => {
        const updated = prev.filter((e: any) => e.id !== data.id);
        if (userId) feedCacheService.set(`episodes_${userId}`, updated);
        return updated;
      });
    };

    const handleSuggestionCreated = (newSugg: any) => {
      console.log('[Socket] suggestion_created received:', newSugg);
      setSuggestions(prev => {
        const exists = prev.some(s => String(s.id) === String(newSugg.id));
        if (exists) {
          return prev.map(s => String(s.id) === String(newSugg.id) ? { ...s, ...newSugg } : s);
        }
        return [newSugg, ...prev];
      });
      setAdminSuggestions(prev => {
        const exists = prev.some(s => String(s.id) === String(newSugg.id));
        if (exists) {
          return prev.map(s => String(s.id) === String(newSugg.id) ? { ...s, ...newSugg } : s);
        }
        return [newSugg, ...prev];
      });
    };

    const handleSuggestionUpdated = (updatedSugg: any) => {
      console.log('[Socket] suggestion_updated received:', updatedSugg);
      const userId = getUserId(user, token);
      setSuggestions(prev => {
        const isAuthor = userId && String(updatedSugg.user_id) === String(userId);
        if (updatedSugg.status !== 'approved' && !isAuthor) {
          return prev.filter(s => String(s.id) !== String(updatedSugg.id));
        }
        const exists = prev.some(s => String(s.id) === String(updatedSugg.id));
        if (exists) {
          return prev.map(s => String(s.id) === String(updatedSugg.id) ? { ...s, ...updatedSugg } : s);
        } else if (updatedSugg.status === 'approved' || isAuthor) {
          return [updatedSugg, ...prev];
        }
        return prev;
      });
      setAdminSuggestions(prev => {
        const exists = prev.some(s => String(s.id) === String(updatedSugg.id));
        if (exists) {
          return prev.map(s => String(s.id) === String(updatedSugg.id) ? { ...s, ...updatedSugg } : s);
        }
        return [updatedSugg, ...prev];
      });
    };

    const handleSuggestionDeleted = (data: { id: number }) => {
      console.log('[Socket] suggestion_deleted received:', data);
      setSuggestions(prev => prev.filter(s => String(s.id) !== String(data.id)));
      setAdminSuggestions(prev => prev.filter(s => String(s.id) !== String(data.id)));
    };

    socket.on('post_created', handlePostCreated);
    socket.on('post_updated', handlePostUpdated);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('announcement_created', handleAnnouncementCreated);
    socket.on('announcement_updated', handleAnnouncementUpdated);
    socket.on('announcement_deleted', handleAnnouncementDeleted);
    socket.on('episode_created', handleEpisodeCreated);
    socket.on('episode_updated', handleEpisodeUpdated);
    socket.on('episode_deleted', handleEpisodeDeleted);
    socket.on('suggestion_created', handleSuggestionCreated);
    socket.on('suggestion_updated', handleSuggestionUpdated);
    socket.on('suggestion_deleted', handleSuggestionDeleted);

    return () => {
      socket.off('post_created', handlePostCreated);
      socket.off('post_updated', handlePostUpdated);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('announcement_created', handleAnnouncementCreated);
      socket.off('announcement_updated', handleAnnouncementUpdated);
      socket.off('announcement_deleted', handleAnnouncementDeleted);
      socket.off('episode_created', handleEpisodeCreated);
      socket.off('episode_updated', handleEpisodeUpdated);
      socket.off('episode_deleted', handleEpisodeDeleted);
      socket.off('suggestion_created', handleSuggestionCreated);
      socket.off('suggestion_updated', handleSuggestionUpdated);
      socket.off('suggestion_deleted', handleSuggestionDeleted);
    };
  }, [socket, user, token]);

  // Socket listeners for real-time hero cards and XP/level/rank updates
  useEffect(() => {
    if (!socket || !user) return () => {};

    const handleXpUpdated = (data: { userId: number, total_xp: number, weekly_xp: number, xp_earned?: number }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        setUser((prev: any) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            total_xp: data.total_xp,
            weekly_xp: data.weekly_xp,
            rank: getClientRank(data.total_xp)
          };
          feedCacheService.set(`user_profile_${currentId}`, updated);
          return updated;
        });
        if (data.xp_earned) {
          triggerXpPopup(data.xp_earned, true);
        }
      }
    };

    const handleLevelUpdated = (data: { userId: number, level: number }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🎉 Level Up! You reached level ${data.level}!`);
        playChatSound('success');
      }
    };

    const handleRankUpdated = (data: { userId: number, rank: any }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🏆 New Rank unlocked: ${data.rank.name_en} ${data.rank.emoji}!`);
        playChatSound('success');
        setUser((prev: any) => {
          if (!prev) return null;
          const updated = { ...prev, rank: data.rank };
          feedCacheService.set(`user_profile_${currentId}`, updated);
          return updated;
        });
      }
    };

    const handleBadgeUnlocked = (data: { userId: number, badge: string }) => {
      const currentId = getUserId(user, token);
      if (String(data.userId) === String(currentId)) {
        showToast(`🏅 Badge unlocked: ${data.badge}!`);
        playChatSound('success');
      }
    };

    const handleQuestionPublished = (question: any) => {
      setDailyQuestion({
        active: true,
        has_answered: false,
        question
      });
      showToast('⚡ Question of the Day is now live!');
      playChatSound('success');
    };

    const handleQuestionExpired = (data: { question_id: number }) => {
      setDailyQuestion((prev: any) => {
        if (prev && prev.question && prev.question.id === data.question_id) {
          return { ...prev, active: false };
        }
        return prev;
      });
    };

    const handleQuestionAnswered = () => {
      fetchDailyQuestion();
    };

    socket.on('xp_updated', handleXpUpdated);
    socket.on('level_updated', handleLevelUpdated);
    socket.on('rank_updated', handleRankUpdated);
    socket.on('badge_unlocked', handleBadgeUnlocked);
    socket.on('question:published', handleQuestionPublished);
    socket.on('question:expired', handleQuestionExpired);
    socket.on('question:answered', handleQuestionAnswered);

    return () => {
      socket.off('xp_updated', handleXpUpdated);
      socket.off('level_updated', handleLevelUpdated);
      socket.off('rank_updated', handleRankUpdated);
      socket.off('badge_unlocked', handleBadgeUnlocked);
      socket.off('question:published', handleQuestionPublished);
      socket.off('question:expired', handleQuestionExpired);
      socket.off('question:answered', handleQuestionAnswered);
    };
  }, [socket, user, token]);

  // Socket listener for real-time leaderboard update
  useEffect(() => {
    if (!socket) return () => {};

    const handleLeaderboardUpdated = (data: any) => {
      const userId = getUserId(user, token);
      setLeaderboard((prev: any[]) => {
        const updates = Array.isArray(data) ? data : [data];
        let updatedList = [...prev];
        let changed = false;

        for (const item of updates) {
          if (!item || !item.username) continue;
          changed = true;

          const exists = updatedList.some((u: any) => u.username === item.username);
          const newXp = leaderboardTab === 'weekly' ? item.weekly_xp : item.total_xp;

          if (leaderboardTab === 'batch' && user?.batch && item.batch !== user.batch) {
            updatedList = updatedList.filter((u: any) => u.username !== item.username);
            continue;
          }

          const updatedUserObj = {
            username: item.username,
            batch: item.batch,
            xp: newXp,
            streak_count: item.streak_count,
            rank: getClientRank(item.total_xp),
            equipped_frame: item.equipped_frame || 'none',
            avatar_url: item.avatar_url || null
          };

          if (exists) {
            updatedList = updatedList.map((u: any) => u.username === item.username ? { ...u, ...updatedUserObj } : u);
          } else {
            if (updatedList.length < 100 || (updatedList.length > 0 && newXp > updatedList[updatedList.length - 1].xp)) {
              updatedList.push(updatedUserObj);
            }
          }
        }

        if (!changed) {
          return prev;
        }

        updatedList.sort((a: any, b: any) => {
          if (b.xp !== a.xp) {
            return b.xp - a.xp;
          }
          return a.username.localeCompare(b.username);
        });

        if (updatedList.length > 100) {
          updatedList = updatedList.slice(0, 100);
        }

        const finalSorted = updatedList.map((u: any, idx) => ({
          ...u,
          rank_num: idx + 1
        }));

        if (userId) {
          const cacheKey = `leaderboard_${userId}_${leaderboardTab}_${user?.batch || ''}`;
          feedCacheService.set(cacheKey, finalSorted);
        }

        return finalSorted;
      });
    };

    socket.on('leaderboard_updated', handleLeaderboardUpdated);

    return () => {
      socket.off('leaderboard_updated', handleLeaderboardUpdated);
    };
  }, [socket, user, token, leaderboardTab]);
};
