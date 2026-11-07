import { useEffect } from 'react';
import { API_BASE } from '../services/api';

interface UseUrlRoutingProps {
  token: string | null;
  setCurrentPage: (page: string) => void;
  setPageFromUrl: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  setSelectedEpisodeId: (id: number | null) => void;
  setSelectedPostId?: (id: number | null) => void;
  setEpisodeDetailLoading: (loading: boolean) => void;
  fetchEpisodeDetail: (id: number) => Promise<void>;
  gamesHook: any;
  showToast: (msg: string) => void;
  openCommentsPanel?: (postId: number) => void;
}

export const useUrlRouting = ({
  token,
  setCurrentPage,
  setPageFromUrl,
  setCommunityTab,
  setSelectedEpisodeId,
  setSelectedPostId,
  setEpisodeDetailLoading,
  fetchEpisodeDetail,
  gamesHook,
  showToast,
  openCommentsPanel,
}: UseUrlRoutingProps) => {
  const handleUrlRouting = () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const refUsername = params.get('ref');

    // Handle referral track
    if (refUsername) {
      const activeToken = localStorage.getItem('token') || token;
      let contentType: string | null = null;
      let contentId: number | null = null;
      
      const epMatch = path.match(/^\/episodes\/(\d+)/);
      const postMatch = path.match(/^\/posts?\/(\d+)/);
      if (epMatch) {
        contentType = 'episode';
        contentId = parseInt(epMatch[1]);
      } else if (postMatch) {
        contentType = 'community_post';
        contentId = parseInt(postMatch[1]);
      } else {
        const page = params.get('page');
        const cid = params.get('id') || params.get('post');
        if (page === 'episode-detail' && cid) {
          contentType = 'episode';
          contentId = parseInt(cid);
        } else if (page === 'community' && cid) {
          contentType = 'community_post';
          contentId = parseInt(cid);
        }
      }

      fetch(`${API_BASE}/api/share/visit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ 
          referrer: refUsername,
          content_type: contentType,
          content_id: contentId ? parseInt(contentId as any) : null
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`You came via a link from @${refUsername}! 🎉`);
        }
      })
      .catch(err => console.error('Error tracking share visit:', err));

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Check for comments panel deep linking
    const commentsParam = params.get('comments');
    const hashCommentsMatch = window.location.hash.match(/#comments-(\d+)/);
    const targetCommentsPostId = commentsParam ? parseInt(commentsParam, 10) : (hashCommentsMatch ? parseInt(hashCommentsMatch[1], 10) : null);
    if (targetCommentsPostId && !isNaN(targetCommentsPostId) && openCommentsPanel) {
      openCommentsPanel(targetCommentsPostId);
    }

    // Path parsing
    if (path === '/' || path === '') {
      setPageFromUrl('home');
    } else if (path === '/chat') {
      setPageFromUrl('community');
      setCommunityTab('chat');
    } else if (path === '/episodes') {
      setPageFromUrl('episodes');
    } else if (path.startsWith('/episodes/')) {
      const idStr = path.substring('/episodes/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        setSelectedEpisodeId(id);
        setPageFromUrl('episode-detail');
        setEpisodeDetailLoading(true);
        fetchEpisodeDetail(id);
      } else {
        setPageFromUrl('episodes');
      }
    } else if (path.startsWith('/post/') || path.startsWith('/posts/')) {
      const match = path.match(/^\/posts?\/(\d+)/);
      if (match) {
        const id = parseInt(match[1], 10);
        if (!isNaN(id)) {
          if (setSelectedPostId) setSelectedPostId(id);
          setPageFromUrl('post-detail');
        } else {
          setPageFromUrl('home');
        }
      } else {
        setPageFromUrl('home');
      }
    } else if (path === '/games') {
      setPageFromUrl('games');
    } else if (path.startsWith('/game/')) {
      const roomCode = path.substring('/game/'.length).toUpperCase();
      const activeToken = localStorage.getItem('token') || token;
      if (activeToken) {
        if (gamesHook.activeGameRoom && gamesHook.activeGameRoom.code === roomCode) {
          setPageFromUrl('play-game');
        } else {
          gamesHook.handleJoinGameRoom(roomCode);
        }
      } else {
        sessionStorage.setItem('pendingGameCode', roomCode);
        setPageFromUrl('login');
        showToast('Please log in to join the game room! 🔐');
      }
    } else if (path === '/leaderboard') {
      setPageFromUrl('leaderboard');
    } else if (path === '/rewards') {
      setPageFromUrl('rewards');
    } else if (path === '/profile') {
      setPageFromUrl('profile');
    } else if (path === '/login') {
      setPageFromUrl('login');
    } else if (path === '/register') {
      setPageFromUrl('register');
    } else if (path === '/confirm') {
      setPageFromUrl('confirm');
    } else if (path === '/forgot-password') {
      setPageFromUrl('forgot-password');
    } else if (path === '/reset-password') {
      setPageFromUrl('reset-password');
    } else if (path === '/admin') {
      setPageFromUrl('admin');
    } else if (path === '/moderation') {
      setPageFromUrl('moderator-dashboard');
    } else if (path === '/news') {
      setPageFromUrl('news');
    } else {
      setPageFromUrl('home');
    }
  };

  return { handleUrlRouting };
};
