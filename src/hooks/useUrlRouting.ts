import { useEffect } from 'react';
import { API_BASE } from '../services/api';

interface UseUrlRoutingProps {
  token: string | null;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  setSelectedEpisodeId: (id: number | null) => void;
  setEpisodeDetailLoading: (loading: boolean) => void;
  fetchEpisodeDetail: (id: number) => Promise<void>;
  gamesHook: any;
  showToast: (msg: string) => void;
}

export const useUrlRouting = ({
  token,
  setCurrentPage,
  setCommunityTab,
  setSelectedEpisodeId,
  setEpisodeDetailLoading,
  fetchEpisodeDetail,
  gamesHook,
  showToast,
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
      const postMatch = path.match(/^\/post\/(\d+)/);
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

    // Path parsing
    if (path === '/' || path === '') {
      setCurrentPage('home');
    } else if (path === '/chat') {
      setCurrentPage('community');
      setCommunityTab('chat');
    } else if (path === '/episodes') {
      setCurrentPage('episodes');
    } else if (path.startsWith('/episodes/')) {
      const idStr = path.substring('/episodes/'.length);
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        setSelectedEpisodeId(id);
        setCurrentPage('episode-detail');
        setEpisodeDetailLoading(true);
        fetchEpisodeDetail(id);
      } else {
        setCurrentPage('episodes');
      }
    } else if (path.startsWith('/post/')) {
      setCurrentPage('home');
    } else if (path === '/games') {
      setCurrentPage('games');
    } else if (path.startsWith('/game/')) {
      const roomCode = path.substring('/game/'.length).toUpperCase();
      const activeToken = localStorage.getItem('token') || token;
      if (activeToken) {
        if (gamesHook.activeGameRoom && gamesHook.activeGameRoom.code === roomCode) {
          setCurrentPage('play-game');
        } else {
          gamesHook.handleJoinGameRoom(roomCode);
        }
      } else {
        sessionStorage.setItem('pendingGameCode', roomCode);
        setCurrentPage('login');
        showToast('Please log in to join the game room! 🔐');
      }
    } else if (path === '/leaderboard') {
      setCurrentPage('leaderboard');
    } else if (path === '/rewards') {
      setCurrentPage('rewards');
    } else if (path === '/profile') {
      setCurrentPage('profile');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/register') {
      setCurrentPage('register');
    } else if (path === '/confirm') {
      setCurrentPage('confirm');
    } else if (path === '/forgot-password') {
      setCurrentPage('forgot-password');
    } else if (path === '/reset-password') {
      setCurrentPage('reset-password');
    } else if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/moderation') {
      setCurrentPage('moderator-dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  return { handleUrlRouting };
};
