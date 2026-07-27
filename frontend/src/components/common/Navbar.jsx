import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';
import Button from './Button';
import ProfileModal from './ProfileModal';
import {
  Wallet, LogOut, UserCheck, Tag, LayoutDashboard,
  ArrowLeftRight, PieChart, PiggyBank
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
  { id: 'transactions', label: 'Sổ thu chi', icon: ArrowLeftRight, disabled: false },
  { id: 'category', label: 'Danh mục', icon: Tag, disabled: false },
  { id: 'budget', label: 'Ngân sách', icon: PieChart, disabled: false },
  { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank, disabled: false },
];

/**
 * Shared Navbar Component - Enforces a single unified active tab style (filled pill)
 * across all pages: Dashboard, Transactions, Categories, and Budget.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  return (
    <>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <header className="bg-white border-b border-neutral-border sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo & App Title */}
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
              <div className="p-2 bg-primary rounded-xl text-white shadow-sm shadow-primary/30 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="hidden lg:block whitespace-nowrap">
                <p className="text-sm font-bold text-neutral-maintext leading-tight">Tài Chính Sinh Viên</p>
                <p className="text-[11px] text-neutral-subtext leading-tight">Student Financial Manager</p>
              </div>
            </div>

            {/* Navigation Tabs - Enforcing Unified Filled Pill Active Style */}
            <nav className="hidden md:flex items-center justify-center flex-1 gap-1 mx-2 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map(item => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && navigate(`/${item.id}`)}
                    disabled={item.disabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all duration-200 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-primary-light text-primary font-bold shadow-2xs'
                        : item.disabled
                          ? 'text-neutral-border cursor-not-allowed'
                          : 'text-neutral-subtext hover:bg-neutral-bg hover:text-neutral-maintext font-medium'
                    }`}
                    title={item.disabled ? 'Sắp ra mắt...' : item.label}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-neutral-subtext'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info & Logout Button */}
            <div className="flex items-center gap-3 md:gap-5 shrink-0">
              {/* User Profile */}
              <div 
                className="flex items-center gap-2.5 cursor-pointer hover:bg-neutral-bg/50 p-1 -m-1 rounded-xl transition-colors"
                onClick={() => setIsProfileOpen(true)}
                title="Xem hồ sơ cá nhân"
              >
                <div className="w-9 h-9 rounded-full bg-primary-light/50 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                  {/* Avatar */}
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="block text-left max-w-[120px] sm:max-w-[130px] md:max-w-[180px]">
                  <p className="text-sm font-semibold text-neutral-maintext truncate" title={user?.fullName}>
                    {user?.fullName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-subtext truncate" title={user?.email}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-neutral-border hidden sm:block shrink-0"></div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-danger hover:bg-danger-light hover:text-danger cursor-pointer shrink-0 !px-2"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-border z-40 shadow-lg">
        <div className="flex items-center justify-around py-1.5 px-2">
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => !item.disabled && navigate(`/${item.id}`)}
                disabled={item.disabled}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-primary-light text-primary font-bold'
                    : item.disabled
                      ? 'text-neutral-border'
                      : 'text-neutral-subtext font-medium'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
