import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './controllers/useAuth';
import LoginPage from './pages/LoginPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import SavingsJarsPage from './pages/SavingsJarsPage';
import { useChatAdvisor } from './hooks/useChatAdvisor';
import ChatBubbleButton from './components/chat/ChatBubbleButton';
import ChatDrawer from './components/chat/ChatDrawer';
import { RefreshCw } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function MainAppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  return (
    <div className="min-h-screen bg-neutral-bg font-sans">
      <Routes>
        {/* Public Routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage initialMode="login" />} />
            <Route path="/register" element={<LoginPage initialMode="register" />} />
            <Route path="/forgot-password" element={<LoginPage initialMode="forgot_email" />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* Protected Routes */
          <>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/category" element={<CategoriesPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/savings" element={<SavingsJarsPage />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center py-24 text-neutral-subtext">
                <div className="w-16 h-16 bg-neutral-bg rounded-2xl flex items-center justify-center mb-4 border border-neutral-border">
                  <span className="text-2xl">🚧</span>
                </div>
                <p className="text-base font-semibold text-neutral-maintext">Không tìm thấy trang</p>
                <p className="text-sm mt-1">Đường dẫn không tồn tại</p>
              </div>
            } />
          </>
        )}
      </Routes>

      {/* Global Floating AI Chat Widget - Only show when authenticated */}
      {isAuthenticated && (
        <>
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
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <MainAppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
