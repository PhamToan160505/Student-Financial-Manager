import { useState, useCallback, useEffect } from 'react';
import chatService from '../services/chat.service';
import toast from 'react-hot-toast';

/**
 * Hook coordinating chat messages, drawer state, and backend API calls
 */
export function useChatAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await chatService.getHistory();
      if (res && res.success && Array.isArray(res.data?.messages)) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('[useChatAdvisor] Failed to load chat history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch history the first time drawer opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchHistory();
    }
  }, [isOpen, messages.length, fetchHistory]);

  const sendMessage = async (text) => {
    if (!text || !text.trim() || sending) return;
    const trimmed = text.trim();
    if (trimmed.length > 500) {
      toast.error('Tin nhắn không được vượt quá 500 ký tự');
      return;
    }

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await chatService.sendMessage(trimmed);
      if (res && res.success && res.data?.reply) {
        setMessages(prev => [...prev, res.data.reply]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nhận phản hồi từ AI. Vui lòng thử lại sau.';
      toast.error(msg);
      // Remove optimistic temp message if failed or append error note
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${msg}`
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      toast.success('Đã xóa toàn bộ lịch sử trò chuyện');
    } catch (err) {
      toast.error('Xóa lịch sử thất bại');
    }
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    loadingHistory,
    sending,
    sendMessage,
    clearHistory,
    refetchHistory: fetchHistory
  };
}
