import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Bot, User, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import ActionCard from './ActionCard';
import BudgetSuggestCard from './BudgetSuggestCard';

/**
 * ChatDrawer - Slide-over panel from right edge displaying 2-color chat bubbles,
 * character counter, and real-time AI advisor interactions.
 */
export default function ChatDrawer({
  isOpen,
  onClose,
  messages,
  loadingHistory,
  sending,
  onSendMessage,
  onClearHistory,
  onConfirmAction,
  onConfirmBudget,
  onCancelAction
}) {
  const [inputText, setInputText] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom whenever messages update or drawer opens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, sending]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;
    if (inputText.trim().length > 500) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed z-50 animate-scaleUp origin-bottom-right bottom-0 right-0 w-full h-full sm:w-auto sm:h-auto sm:bottom-0 sm:right-16">
      {/* Panel */}
      <div className="relative w-full h-full sm:w-[360px] sm:h-[520px] sm:max-h-[85vh] bg-white sm:rounded-t-2xl sm:rounded-b-none shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col sm:border sm:border-b-0 border-neutral-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-border bg-neutral-bg/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-maintext flex items-center gap-1.5">
                AI Cố Vấn Tài Chính <Sparkles className="w-3.5 h-3.5 text-warning" />
              </h3>
              <p className="text-[11px] text-neutral-subtext font-medium">
                Model: <code className="text-xs text-primary font-mono bg-white px-1 rounded border border-neutral-border">openai/gpt-oss-120b</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                title="Xóa lịch sử trò chuyện"
                className="p-2 text-neutral-subtext hover:text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Đóng cửa sổ"
              className="p-2 text-neutral-subtext hover:text-neutral-maintext hover:bg-neutral-border/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirm Clear Bar */}
        {showConfirmClear && (
          <div className="bg-danger-light border-b border-danger/20 p-3 flex items-center justify-between text-xs animate-fadeIn shrink-0">
            <span className="text-danger font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Xóa sạch lịch sử trò chuyện?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 text-neutral-subtext hover:bg-white rounded font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-danger text-white rounded font-bold hover:bg-danger/90 cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-bg/30">
          {loadingHistory && (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-neutral-subtext">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Đang tải lịch sử trò chuyện...
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-maintext mb-1">
                Chào bạn! Tôi là Trợ lý Tài chính AI 🤖
              </h4>
              <p className="text-xs text-neutral-subtext leading-relaxed max-w-xs mx-auto mb-4">
                Tôi nắm rõ 100% số liệu thu chi và phân bổ danh mục tháng này của bạn. Bạn có thể hỏi tôi bất kỳ câu hỏi nào!
              </p>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                <button
                  onClick={() => onSendMessage("Tháng này tôi tiêu bao nhiêu cho ăn uống rồi?")}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-border hover:border-primary/40 rounded-xl text-neutral-maintext hover:bg-primary-light/50 transition-colors cursor-pointer block text-left font-medium"
                >
                  💬 Tháng này tôi tiêu bao nhiêu cho ăn uống?
                </button>
                <button
                  onClick={() => onSendMessage("Tốc độ chi tiêu hiện tại có đủ dùng hết tháng không?")}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-border hover:border-primary/40 rounded-xl text-neutral-maintext hover:bg-primary-light/50 transition-colors cursor-pointer block text-left font-medium"
                >
                  💬 Tốc độ chi tiêu có đủ dùng đến hết tháng?
                </button>
                <button
                  onClick={() => onSendMessage("Với sinh viên, lương 2 triệu thì nên chia tỷ lệ chi tiêu ra sao?")}
                  className="w-full text-xs p-2.5 bg-white border border-neutral-border hover:border-primary/40 rounded-xl text-neutral-maintext hover:bg-primary-light/50 transition-colors cursor-pointer block text-left font-medium"
                >
                  💬 Lương 2 triệu thì nên chia tỷ lệ ra sao?
                </button>
              </div>
            </div>
          )}

          {/* Render 2-color Chat Bubbles + Action Cards */}
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            // Render Action Card for AI-proposed transactions
            if (msg.type === 'action_pending') {
              return (
                <div key={msg.id || index} className="flex items-start gap-2.5 justify-start animate-fadeIn">
                  <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <ActionCard
                    payload={msg.actionPayload}
                    onConfirm={(payload) => onConfirmAction && onConfirmAction(msg.id, payload)}
                    onCancel={() => onCancelAction && onCancelAction(msg.id)}
                  />
                </div>
              );
            }

            // V2: Render Budget Suggest Card for unbudgeted categories
            if (msg.type === 'budget_required') {
              return (
                <div key={msg.id || index} className="flex items-start gap-2.5 justify-start animate-fadeIn">
                  <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <BudgetSuggestCard
                    payload={msg.actionPayload}
                    suggestedAmount={msg.suggestedAmount}
                    error={msg._error}
                    onConfirm={(payload) => onConfirmBudget && onConfirmBudget(msg.id, payload)}
                    onCancel={() => onCancelAction && onCancelAction(msg.id)}
                  />
                </div>
              );
            }

            // Render cancelled/confirmed state as a muted text bubble
            if (msg.type === 'cancelled' || msg.type === 'confirmed' || msg.type === 'confirmed_budget') {
              return (
                <div key={msg.id || index} className="flex items-start gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-neutral-bg text-neutral-subtext flex items-center justify-center shrink-0 mt-0.5 border border-neutral-border">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl p-3 text-xs text-neutral-subtext bg-neutral-bg border border-neutral-border/60 rounded-tl-2xs max-w-[86%] italic whitespace-pre-line">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-primary text-white rounded-tr-2xs max-w-[82%] ml-auto font-medium shadow-xs'
                      : 'bg-white text-neutral-maintext border border-neutral-border/80 rounded-tl-2xs max-w-[86%] mr-auto shadow-2xs whitespace-pre-line'
                  }`}
                >
                  {msg.content}
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-neutral-maintext text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}


          {/* Typing indicator */}
          {sending && (
            <div className="flex items-start gap-2.5 justify-start animate-fadeIn">
              <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-neutral-border/80 rounded-2xl rounded-tl-2xs p-3.5 max-w-[80%] text-xs text-neutral-subtext flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>AI đang đọc số liệu & suy nghĩ...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer Area */}
        <form onSubmit={handleSend} className="p-3 border-t border-neutral-border bg-white shrink-0">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Hỏi số liệu..."
              disabled={sending}
              className="w-full bg-neutral-bg border border-neutral-border focus:border-primary focus:bg-white rounded-xl py-3 pl-4 pr-12 text-sm text-neutral-maintext placeholder:text-neutral-subtext focus:outline-none resize-none transition-all block"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending || inputText.trim().length > 500}
              className="absolute right-2 bottom-2 p-1.5 bg-primary hover:bg-primary-hover disabled:bg-transparent disabled:text-neutral-subtext text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              title="Gửi tin nhắn"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[10px] text-neutral-subtext">
              Enter để gửi • Shift + Enter để xuống dòng
            </span>
            <span className={`text-[10px] font-mono font-medium ${inputText.length > 500 ? 'text-danger font-bold' : 'text-neutral-subtext'}`}>
              {inputText.length}/500
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
