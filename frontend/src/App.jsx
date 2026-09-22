import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './controllers/useAuth';
import { useChatAdvisor } from './hooks/useChatAdvisor';
import ChatBubbleButton from './components/chat/ChatBubbleButton';
import { RefreshCw, ArrowLeft, Compass } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const SavingsJarsPage = lazy(() => import('./pages/SavingsJarsPage'));
const ChatDrawer = lazy(() => import('./components/chat/ChatDrawer'));

function RouteLoader() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 text-sm font-semibold text-neutral-subtext shadow-sm">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Đang tải nội dung...
      </div>
    </div>
  );
}

function MainAppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const chatAdvisor = useChatAdvisor();

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-neutral-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-neutral-subtext">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
          <span className="text-sm font-semibold">Đang chuẩn bị không gian của bạn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-bg font-sans">
      <a href="#main-content" className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0">
        Bỏ qua đến nội dung chính
      </a>
      <Suspense fallback={<RouteLoader />}>
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
              <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center text-neutral-subtext">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-light text-primary">
                  <Compass className="h-7 w-7" />
                </div>
                <p className="text-xl font-bold text-neutral-maintext">Trang này không tồn tại</p>
                <p className="mt-1 text-sm">Có thể đường dẫn đã được thay đổi hoặc xóa.</p>
                <button onClick={() => window.history.back()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
              </div>
            } />
          </>
        )}
      </Routes>
      </Suspense>

      {/* Global Floating AI Chat Widget - Only show when authenticated */}
      {isAuthenticated && (
        <>
          <ChatBubbleButton
            isOpen={chatAdvisor.isOpen}
            onClick={() => chatAdvisor.setIsOpen(true)}
          />
          {chatAdvisor.isOpen && (
            <Suspense fallback={null}>
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
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: '14px',
              background: '#14231E',
              color: '#FFFFFF',
              boxShadow: '0 18px 45px rgba(20,35,30,.16)',
              fontSize: '13px',
              fontWeight: 600,
            },
          }}
        />
        <MainAppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
