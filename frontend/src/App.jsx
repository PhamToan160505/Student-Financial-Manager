import React, { useState } from 'react';
import api from './services/api';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './controllers/useAuth';
import LoginPage from './pages/LoginPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import SavingsJarsPage from './pages/SavingsJarsPage';
import Button from './components/common/Button';
import { useChatAdvisor } from './hooks/useChatAdvisor';
import ChatBubbleButton from './components/chat/ChatBubbleButton';
import ChatDrawer from './components/chat/ChatDrawer';
import {
  Wallet, LogOut, UserCheck, Tag, LayoutDashboard,
  ArrowLeftRight, PieChart, RefreshCw
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
  { id: 'transactions', label: 'Sổ thu chi', icon: ArrowLeftRight, disabled: false },
  { id: 'categories', label: 'Danh mục', icon: Tag, disabled: false },
  { id: 'budget', label: 'Ngân sách', icon: PieChart, disabled: false },
];

function MainAppContent() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const chatAdvisor = useChatAdvisor();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-neutral-subtext">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Đang xác thực tài khoản...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigateToPage={setActivePage} />;
      case 'transactions': return <TransactionsPage onNavigateToPage={setActivePage} />;
      case 'categories': return <CategoriesPage onNavigateToPage={setActivePage} />;
      case 'budget': return <BudgetPage onNavigateToPage={setActivePage} />;
      case 'savings': return <SavingsJarsPage onNavigateToPage={setActivePage} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-subtext">
            <div className="w-16 h-16 bg-neutral-bg rounded-2xl flex items-center justify-center mb-4 border border-neutral-border">
              <span className="text-2xl">🚧</span>
            </div>
            <p className="text-base font-semibold text-neutral-maintext">Đang phát triển...</p>
            <p className="text-sm mt-1">Tính năng này sẽ có trong các bước tiếp theo</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg font-sans">
      {renderPage()}

      {/* Global Floating AI Chat Widget */}
      <ChatBubbleButton
        isOpen={chatAdvisor.isOpen}
        onClick={() => chatAdvisor.setIsOpen(true)}
      />
      <ChatDrawer
        isOpen={chatAdvisor.isOpen}
        onClose={() => chatAdvisor.setIsOpen(false)}
        messages={chatAdvisor.messages}
        loadingHistory={chatAdvisor.loadingHistory}
        sending={chatAdvisor.sending}
        onSendMessage={chatAdvisor.sendMessage}
        onClearHistory={chatAdvisor.clearHistory}
        onConfirmAction={chatAdvisor.confirmAction}
        onConfirmBudget={chatAdvisor.confirmBudget}
        onCancelAction={chatAdvisor.cancelAction}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <MainAppContent />
    </AuthProvider>
  );
}
