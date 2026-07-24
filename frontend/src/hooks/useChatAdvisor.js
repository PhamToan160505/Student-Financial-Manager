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
      if (res && res.success) {
        if (res.data?.type === 'action_pending') {
          // AI proposed a transaction — add as action card message
          setMessages(prev => [...prev, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            type: 'action_pending',
            actionPayload: res.data.actionPayload,
            content: res.data.content
          }]);
        } else if (res.data?.type === 'budget_required') {
          // V2: AI proposed an expense transaction but category has no budget
          setMessages(prev => [...prev, {
            id: `budget-${Date.now()}`,
            role: 'assistant',
            type: 'budget_required',
            actionPayload: res.data.actionPayload, // the pending transaction
            suggestedAmount: res.data.suggestedAmount,
            content: res.data.content
          }]);
        } else if (res.data?.reply) {
          setMessages(prev => [...prev, res.data.reply]);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nhận phản hồi từ AI. Vui lòng thử lại sau.';
      toast.error(msg);
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: `⚠️ ${msg}` }
      ]);
    } finally {
      setSending(false);
    }
  };

  /**
   * confirmAction — called when user clicks Xác nhận on ActionCard.
   * Calls POST /api/chat/confirm-action, then appends confirmation text bubble.
   */
  const confirmAction = async (messageId, payload) => {
    try {
      const res = await chatService.confirmAction(payload);
      if (res && res.success) {
        // Replace action card with a confirmed-state text bubble
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, type: 'confirmed' } : m
        ));
        // Append AI confirmation text as a new bubble
        setMessages(prev => [...prev, {
          id: `confirm-${Date.now()}`,
          role: 'assistant',
          content: res.data?.confirmText || `Đã ghi nhận giao dịch ✅`
        }]);
        toast.success('Giao dịch đã được tạo thành công!');
        window.dispatchEvent(new CustomEvent('financial-data-updated'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo giao dịch. Vui lòng thử lại.';
      toast.error(msg);
      // Unblock the action card so user can retry or cancel
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, _error: msg } : m
      ));
    }
  };

  /**
   * confirmBudget - V2: called when user confirms budget creation.
   */
  const confirmBudget = async (messageId, payload) => {
    try {
      const res = await chatService.confirmBudget(payload);
      if (res && res.success) {
        // Replace budget card with a confirmed text bubble
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, type: 'confirmed_budget' } : m
        ));
        
        // The server returns a new action_pending payload to immediately prompt transaction confirmation
        if (res.data?.type === 'action_pending') {
          setMessages(prev => [...prev, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            type: 'action_pending',
            actionPayload: res.data.actionPayload,
            content: res.data.content
          }]);
        }
        toast.success('Thiết lập hạn mức thành công!');
        window.dispatchEvent(new CustomEvent('financial-data-updated'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo ngân sách. Vui lòng thử lại.';
      toast.error(msg);
      // Unblock the budget card so user can retry or cancel
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, _error: msg } : m
      ));
    }
  };

  /**
   * cancelAction — called when user clicks Hủy on ActionCard or BudgetSuggestCard.
   * Marks action card as cancelled, appends a short cancellation text.
   */
  const cancelAction = (messageId) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, type: 'cancelled', actionPayload: null } : m
    ));
    setMessages(prev => [...prev, {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: 'Đã hủy. Nếu cần ghi khoản khác, cứ nhắn mình nhé!'
    }]);
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
    confirmAction,
    confirmBudget,
    cancelAction,
    clearHistory,
    refetchHistory: fetchHistory
  };
}
