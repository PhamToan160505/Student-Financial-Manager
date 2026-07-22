import React, { useState } from 'react';
import api from './services/api';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './controllers/useAuth';
import LoginPage from './pages/LoginPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
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
      case 'transactions': return <TransactionsPage />;
      case 'categories': return <CategoriesPage />;
      case 'budget': return <BudgetPage />;
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
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-neutral-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl text-white shadow-sm shadow-primary/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-neutral-maintext leading-tight">Tài Chính Sinh Viên</p>
                <p className="text-xs text-neutral-subtext leading-tight">Student Financial Manager</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActivePage(item.id)}
                  disabled={item.disabled}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activePage === item.id
                      ? 'bg-primary-light text-primary'
                      : item.disabled
                        ? 'text-neutral-border cursor-not-allowed'
                        : 'text-neutral-subtext hover:bg-neutral-bg hover:text-neutral-maintext'
                    }`}
                  title={item.disabled ? 'Sắp ra mắt...' : item.label}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Info + Logout */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-neutral-maintext flex items-center gap-1 justify-end">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  {user?.fullName}
                </p>
                <p className="text-xs text-neutral-subtext">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                icon={LogOut}
                className="text-danger hover:bg-danger-light hover:text-danger"
              >
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-border z-40">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActivePage(item.id)}
              disabled={item.disabled}
              className={`flex flex-col items-center gap-0.5 py-3 px-4 text-xs font-medium transition-colors ${activePage === item.id
                  ? 'text-primary'
                  : item.disabled
                    ? 'text-neutral-border'
                    : 'text-neutral-subtext'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />

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
