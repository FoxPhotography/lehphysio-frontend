import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { chatService } from '../services/chatService';
import { playChatSound } from '../utils/helpers';
import { ChatMessage } from '../types';

export const useChat = (communityTab: 'feed' | 'chat') => {
  const { token, user, showToast, showConfirm } = useAuth();
  const socket = useSocket();

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

  const chatMessagesRef = useRef(chatMessages);
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const holdTimeoutRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipeMessageIdRef = useRef<number | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef(false);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Mark messages as seen when chat becomes active
  const { currentPage } = useAuth();
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
              return [...filteredNew, ...prev];
            });

            setTimeout(() => {
              if (el) {
                el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
              }
            }, 30);
          }
        } else {
          setHasMoreChat(true);
          if (chatMessagesRef.current && chatMessagesRef.current.length > 0 && data.length > chatMessagesRef.current.length) {
            const currentIds = new Set(chatMessagesRef.current.map((m: any) => m.id));
            const hasNewIncoming = data.some((m: any) => !currentIds.has(m.id) && (!userRef.current || m.username !== userRef.current.username));
            if (hasNewIncoming) {
              playChatSound('receive');
            }
          }
          
          const pendingMessages = chatMessagesRef.current.filter((m: any) => m.isPending);
          const serverIds = new Set(data.map((m: any) => m.id));
          const filteredPending = pendingMessages.filter((pm: any) => !serverIds.has(pm.id));
          
          setChatMessages([...data, ...filteredPending]);

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
      }
    }
  };

  // Poll/Listen for chat updates via socket.io
  useEffect(() => {
    if (communityTab === 'chat' && currentPage === 'community') {
      shouldScrollToBottomRef.current = true;
      fetchChatMessages();
    }
  }, [communityTab, currentPage]);

  useEffect(() => {
    const handleChatUpdate = () => {
      if (communityTab === 'chat' && currentPage === 'community') {
        fetchChatMessages();
      }
    };
    socket.on('chat_update', handleChatUpdate);
    return () => {
      socket.off('chat_update', handleChatUpdate);
    };
  }, [communityTab, currentPage, socket]);

  // Autoscroll chat to bottom smartly
  useEffect(() => {
    if (currentPage === 'community') {
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
  }, [chatMessages, currentPage, user]);

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
