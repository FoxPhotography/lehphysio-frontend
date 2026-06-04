import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { chatService } from '../services/chatService';
import { playChatSound } from '../utils/helpers';
import { ChatMessage } from '../types';

export const useChat = (communityTab: 'feed' | 'chat') => {
  const { token, user, showToast, showConfirm, currentPage } = useAuth();
  const socket = useSocket();
  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [activeContextMenu, setActiveContextMenu] = useState<any>(null);
  const [swipeTranslateX, setSwipeTranslateX] = useState<{ [key: number]: number }>({});
  const [lastSeenMessageId, setLastSeenMessageId] = useState<number>(() => Number(localStorage.getItem('lastSeenMessageId') || '0'));
  const [onlineCount, setOnlineCount] = useState(1);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState(false);
  const [hasMoreChat, setHasMoreChat] = useState(true);
  const [isFindingTargetMessage, setIsFindingTargetMessage] = useState(false);
  const [isRefreshingChat, setIsRefreshingChat] = useState(false);
  const findAttemptsRef = useRef(0);

  const chatMessagesRef = useRef(chatMessages);
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const holdTimeoutRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipeMessageIdRef = useRef<number | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef(false);
  const deepLinkTargetRef = useRef(deepLinkTarget);

  useEffect(() => {
    deepLinkTargetRef.current = deepLinkTarget;
  }, [deepLinkTarget]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Load cached chat messages immediately when user is available
  useEffect(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`chat_cache_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setChatMessages(parsed);
          chatMessagesRef.current = parsed;
        } catch (e) {
          console.error('Error parsing cached chat messages:', e);
        }
      }
    } else {
      setChatMessages([]);
      chatMessagesRef.current = [];
    }
  }, [user?.id]);

  // Monitor deepLinkTarget to start the search process
  useEffect(() => {
    if (currentPage === 'community' && communityTab === 'chat' && deepLinkTarget?.type === 'chat_message') {
      setIsFindingTargetMessage(true);
      findAttemptsRef.current = 0;
    } else {
      setIsFindingTargetMessage(false);
    }
  }, [currentPage, communityTab, deepLinkTarget]);

  // Robust target message lookup loop
  useEffect(() => {
    if (!isFindingTargetMessage || !deepLinkTarget || deepLinkTarget.type !== 'chat_message') return;

    const targetId = Number(deepLinkTarget.messageId);

    // 1. If chat messages are not loaded yet, wait for them
    if (chatMessages.length === 0) {
      return;
    }

    // 2. Look for target message in chatMessages
    const found = chatMessages.some((m: any) => Number(m.id) === targetId);
    if (found) {
      setIsFindingTargetMessage(false);
      return;
    }

    // 3. Target message is NOT in loaded messages.
    // Check if target message could be older.
    const oldestMessage = chatMessages[0];
    if (oldestMessage && targetId < Number(oldestMessage.id) && hasMoreChat && findAttemptsRef.current < 5) {
      findAttemptsRef.current += 1;
      fetchChatMessages(String(oldestMessage.id));
    } else {
      setIsFindingTargetMessage(false);
      setDeepLinkTarget(null);
      window.history.replaceState({}, '', '/chat');
      showToast('Could not locate the message. It might have been deleted.');
    }
  }, [isFindingTargetMessage, chatMessages, deepLinkTarget]);

  // Mark messages as seen when chat becomes active
  useEffect(() => {
    if (currentPage === 'community' && communityTab === 'chat' && chatMessages.length > 0) {
      const maxId = Math.max(...chatMessages.map((m: any) => Number(m.id || 0)));
      if (maxId > lastSeenMessageId) {
        setLastSeenMessageId(maxId);
        localStorage.setItem('lastSeenMessageId', maxId.toString());
      }
    }
  }, [currentPage, communityTab, chatMessages, lastSeenMessageId]);

  const fetchChatMessages = async (beforeId?: string) => {
    try {
      if (beforeId) {
        setIsLoadingOlderChat(true);
      } else {
        setIsRefreshingChat(true);
      }
      const res = await chatService.fetchChatMessages(beforeId, tokenRef.current);
      const data = await res.json();
      if (res.ok) {
        if (beforeId) {
          if (data.length < 30) {
            setHasMoreChat(false);
          }
          if (data.length > 0) {
            const el = document.getElementById('pl-chat-feed');
            const prevScrollHeight = el ? el.scrollHeight : 0;
            const prevScrollTop = el ? el.scrollTop : 0;

            setChatMessages(prev => {
              const prevIds = new Set(prev.map((m: any) => m.id));
              const filteredNew = data.filter((m: any) => !prevIds.has(m.id));
              const mergedMessages = [...filteredNew, ...prev];

              if (userRef.current?.id) {
                const cacheSlice = mergedMessages.slice(-1000);
                localStorage.setItem(`chat_cache_${userRef.current.id}`, JSON.stringify(cacheSlice));
              }

              return mergedMessages;
            });

            setTimeout(() => {
              if (el) {
                el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
              }
            }, 30);
          }
        } else {
          setHasMoreChat(true);
          if (chatMessagesRef.current && chatMessagesRef.current.length > 0 && data.length > 0) {
            const currentIds = new Set(chatMessagesRef.current.map((m: any) => m.id));
            const hasNewIncoming = data.some((m: any) => !currentIds.has(m.id) && (!userRef.current || m.username !== userRef.current.username));
            if (hasNewIncoming) {
              playChatSound('receive');
            }
          }
          
          const pendingMessages = chatMessagesRef.current.filter((m: any) => m.isPending);
          
          setChatMessages(prev => {
            const map = new Map<number, any>();
            // Add existing messages first to accumulate cache
            prev.forEach(m => map.set(m.id, m));
            // Add/overwrite with fresh server data
            data.forEach(m => map.set(m.id, m));
            // Ensure pending messages are preserved
            pendingMessages.forEach(m => map.set(m.id, m));

            // Client-side reconciliation for deletions within the returned data range
            if (data.length > 0) {
              const oldestIncoming = data[0];
              const oldestTime = new Date(oldestIncoming.created_at || oldestIncoming.timestamp || 0).getTime();
              
              for (const [id, msg] of map.entries()) {
                if (msg.isPending) continue;
                const msgTime = new Date(msg.created_at || msg.timestamp || 0).getTime();
                if (msgTime >= oldestTime) {
                  const existsInIncoming = data.some((m: any) => m.id === id);
                  if (!existsInIncoming) {
                    map.delete(id);
                  }
                }
              }
            }

            const mergedMessages = Array.from(map.values()).sort((a, b) => {
              const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
              const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
              return timeA - timeB;
            });

            if (userRef.current?.id) {
              const cacheSlice = mergedMessages.slice(-1000);
              localStorage.setItem(`chat_cache_${userRef.current.id}`, JSON.stringify(cacheSlice));
            }

            return mergedMessages;
          });

          const onlineHeader = res.headers.get('X-Online-Count');
          if (onlineHeader) {
            setOnlineCount(parseInt(onlineHeader, 10));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (beforeId) {
        setIsLoadingOlderChat(false);
      } else {
        setIsRefreshingChat(false);
      }
    }
  };

  // Poll/Listen for chat updates via socket.io
  useEffect(() => {
    if (communityTab === 'chat' && currentPage === 'community') {
      shouldScrollToBottomRef.current = deepLinkTargetRef.current?.type !== 'chat_message';
      fetchChatMessages();
    }
  }, [communityTab, currentPage]);

  useEffect(() => {
    const handleChatUpdate = (payload?: any) => {
      if (communityTab === 'chat' && currentPage === 'community') {
        if (payload?.type === 'delete') {
          setChatMessages(prev => {
            const filtered = prev.filter(m => m.id !== payload.messageId);
            if (userRef.current?.id) {
              localStorage.setItem(`chat_cache_${userRef.current.id}`, JSON.stringify(filtered.slice(-1000)));
            }
            return filtered;
          });
        } else if (payload?.type === 'delete_bulk') {
          setChatMessages(prev => {
            const filtered = prev.filter(m => !payload.messageIds.includes(m.id));
            if (userRef.current?.id) {
              localStorage.setItem(`chat_cache_${userRef.current.id}`, JSON.stringify(filtered.slice(-1000)));
            }
            return filtered;
          });
        } else if (payload?.type === 'edit') {
          setChatMessages(prev => {
            const updated = prev.map(m => m.id === payload.messageId ? { ...m, message: payload.message, is_edited: 1 } : m);
            if (userRef.current?.id) {
              localStorage.setItem(`chat_cache_${userRef.current.id}`, JSON.stringify(updated.slice(-1000)));
            }
            return updated;
          });
        } else {
          fetchChatMessages();
        }
      }
    };
    socket.on('chat_update', handleChatUpdate);
    return () => {
      socket.off('chat_update', handleChatUpdate);
    };
  }, [communityTab, currentPage, socket]);

  // Sync missed messages on reconnect / online status
  useEffect(() => {
    const handleOnlineSync = () => {
      if (communityTab === 'chat' && currentPage === 'community') {
        fetchChatMessages();
      }
    };

    socket.on('connect', handleOnlineSync);
    window.addEventListener('app_online', handleOnlineSync);

    return () => {
      socket.off('connect', handleOnlineSync);
      window.removeEventListener('app_online', handleOnlineSync);
    };
  }, [socket, communityTab, currentPage]);

  // Autoscroll chat to bottom smartly
  useEffect(() => {
    if (currentPage === 'community') {
      if (deepLinkTarget?.type === 'chat_message') {
        shouldScrollToBottomRef.current = false;
        prevMessagesCountRef.current = chatMessages.length;
        return;
      }

      const el = document.getElementById('pl-chat-feed');
      if (el) {
        const hasNewMessages = chatMessages.length > prevMessagesCountRef.current;
        const lastMsg = chatMessages[chatMessages.length - 1];
        const sentByMe = lastMsg && user && lastMsg.username === user.username;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        if (shouldScrollToBottomRef.current || (hasNewMessages && (sentByMe || isNearBottom))) {
          el.scrollTop = el.scrollHeight;
          if (chatMessages.length > 0) {
            shouldScrollToBottomRef.current = false;
          }
        }
      }
    }
    prevMessagesCountRef.current = chatMessages.length;
  }, [chatMessages, currentPage, user, deepLinkTarget]);

  const handleChatContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    if (!user) return;
    setActiveContextMenu({
      messageId: msg.id,
      msg,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleChatTouchStart = (e: React.TouchEvent, msg: any) => {
    if (!user) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    
    holdTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      setActiveContextMenu({
        messageId: msg.id,
        msg,
        x: clientX,
        y: clientY
      });
    }, 600);

    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    swipeMessageIdRef.current = msg.id;
  };

  const handleChatTouchMove = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (touchStartXRef.current === null || swipeMessageIdRef.current !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (e.cancelable) e.preventDefault();
      const dragX = deltaX > 0 ? Math.min(70, deltaX) : Math.max(-70, deltaX);
      setSwipeTranslateX(prev => ({ ...prev, [msg.id]: dragX }));
    }
  };

  const handleChatTouchEnd = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (swipeMessageIdRef.current === msg.id) {
      const currentTranslateX = swipeTranslateX[msg.id] || 0;
      if (Math.abs(currentTranslateX) > 45) {
        setReplyingTo({
          id: msg.id,
          username: msg.username,
          message: msg.message
        });
        playChatSound('react');
      }
      setSwipeTranslateX(prev => {
        const updated = { ...prev };
        delete updated[msg.id];
        return updated;
      });
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    swipeMessageIdRef.current = null;
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = chatInput.trim();
    if (!messageText || !token) return;

    if (editingMessage) {
      handleEditMessage(editingMessage.id, messageText);
      return;
    }

    setTimeout(() => {
      document.getElementById('community-chat-input')?.focus();
    }, 50);

    const optimisticId = -Date.now();
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      username: user?.username || 'Me',
      message: messageText,
      timestamp: new Date().toISOString(),
      avatar_url: user?.avatar_url || null,
      equipped_frame: user?.equipped_frame || 'none',
      reply_to: replyingTo ? {
        id: replyingTo.id,
        username: replyingTo.username,
        message: replyingTo.message
      } : null,
      reactions: [],
      isPending: true
    };

    setChatMessages(prev => [...prev, optimisticMsg]);
    chatMessagesRef.current = [...chatMessagesRef.current, optimisticMsg];
    setChatInput('');
    setReplyingTo(null);

    try {
      const res = await chatService.sendMessage(messageText, optimisticMsg.reply_to?.id, token);
      const data = await res.json();
      if (res.ok) {
        playChatSound('send');
        setChatMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id, isPending: false, equipped_frame: data.equipped_frame || m.equipped_frame, avatar_url: data.avatar_url || m.avatar_url } : m));
        chatMessagesRef.current = chatMessagesRef.current.map(m => m.id === optimisticId ? { ...m, id: data.id, isPending: false, equipped_frame: data.equipped_frame || m.equipped_frame, avatar_url: data.avatar_url || m.avatar_url } : m);
      } else {
        setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
        showToast(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
      showToast('Network error: Failed to send message');
    }
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    if (!token) return;
    try {
      const res = await chatService.toggleReaction(messageId, emoji, token);
      if (res.ok) {
        playChatSound('react');
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (messageId: number, newMessage: string) => {
    if (!token || !newMessage.trim()) return;
    try {
      const res = await chatService.editMessage(messageId, newMessage, token);
      if (res.ok) {
        setChatInput('');
        setEditingMessage(null);
        showToast('Message edited successfully');
        fetchChatMessages();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to edit message');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?',
      async () => {
        try {
          const res = await chatService.deleteMessage(messageId, token);
          if (res.ok) {
            showToast('Message deleted');
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete message');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleBulkDeleteMessages = async () => {
    if (!token || selectedMessageIds.length === 0) return;
    showConfirm(
      'Delete Multiple Messages',
      `Are you sure you want to delete ${selectedMessageIds.length} selected messages?`,
      async () => {
        try {
          const res = await chatService.bulkDeleteMessages(selectedMessageIds, token);
          if (res.ok) {
            showToast('Selected messages deleted');
            setIsMultiSelectMode(false);
            setSelectedMessageIds([]);
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete messages');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  return {
    chatMessages, setChatMessages,
    chatInput, setChatInput,
    replyingTo, setReplyingTo,
    activeReactionMenu, setActiveReactionMenu,
    editingMessage, setEditingMessage,
    isMultiSelectMode, setIsMultiSelectMode,
    selectedMessageIds, setSelectedMessageIds,
    activeContextMenu, setActiveContextMenu,
    swipeTranslateX, setSwipeTranslateX,
    lastSeenMessageId,
    onlineCount,
    isLoadingOlderChat,
    hasMoreChat,
    isFindingTargetMessage,
    isRefreshingChat,
    fetchChatMessages,
    handleChatContextMenu,
    handleChatTouchStart,
    handleChatTouchMove,
    handleChatTouchEnd,
    handleSendChatMessage,
    handleToggleReaction,
    handleEditMessage,
    handleDeleteMessage,
    handleBulkDeleteMessages
  };
};
