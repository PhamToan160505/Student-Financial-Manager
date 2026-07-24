import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

/**
 * ChatBubbleButton - Global floating action button (FAB)
 * placed at bottom-right corner of all pages.
 */
export default function ChatBubbleButton({ onClick, isOpen }) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      aria-label="Mở Trợ lý AI Cố vấn Tài chính"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 border-2 border-white/20"
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-white shrink-0" />
        <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
        </span>
      </div>
      <span className="text-sm font-bold tracking-tight pr-1 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-warning shrink-0" />AI Cố Vấn
      </span>
    </button>
  );
}
