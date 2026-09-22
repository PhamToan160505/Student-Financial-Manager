import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';
import ProfileModal from './ProfileModal';
import {
  Wallet, LogOut, Tag, LayoutDashboard,
  ArrowLeftRight, PieChart, PiggyBank
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'transactions', label: 'Thu chi', icon: ArrowLeftRight },
  { id: 'budget', label: 'Ngân sách', icon: PieChart },
  { id: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
  { id: 'category', label: 'Danh mục', icon: Tag },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.split('/')[1] || 'dashboard';
  const userInitial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <header className="sticky top-0 z-40 border-b border-neutral-border/70 bg-neutral-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-bg/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between gap-3">
            <button
              type="button"
              className="group flex shrink-0 items-center gap-3 rounded-xl text-left focus-visible:outline-none"
              onClick={() => navigate('/dashboard')}
              aria-label="Về trang tổng quan"
            >
              <span className="relative grid h-10 w-10 place-items-center rounded-[14px] bg-primary text-white shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <Wallet className="h-5 w-5" strokeWidth={2.2} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-bg bg-warning" />
              </span>
              <span className="hidden lg:block whitespace-nowrap">
                <span className="block text-[15px] font-extrabold leading-tight tracking-[-0.03em] text-neutral-maintext">Ví Sinh Viên</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-subtext">Quản lý tài chính</span>
              </span>
            </button>

            <nav className="hidden md:flex items-center justify-center gap-1 rounded-2xl border border-white/80 bg-white/60 p-1.5 shadow-xs" aria-label="Điều hướng chính">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activePage === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(`/${id}`)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 lg:px-4 ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-neutral-subtext hover:bg-white hover:text-neutral-maintext'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2 transition-colors hover:bg-white/70"
                title="Xem hồ sơ cá nhân"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-primary/15 bg-primary-light text-sm font-bold text-primary">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={`Ảnh đại diện của ${user?.fullName || 'người dùng'}`} className="h-full w-full object-cover" />
                  ) : userInitial}
                </span>
                <span className="hidden max-w-[150px] text-left xl:block">
                  <span className="block truncate text-xs font-bold text-neutral-maintext">{user?.fullName || 'Tài khoản'}</span>
                  <span className="block truncate text-[10px] text-neutral-subtext">{user?.email}</span>
                </span>
              </button>
              <span className="hidden h-7 w-px bg-neutral-border sm:block" />
              <button
                type="button"
                onClick={logout}
                className="grid h-9 w-9 place-items-center rounded-xl text-neutral-subtext transition-all hover:bg-danger-light hover:text-danger active:scale-95"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-[1.35rem] border border-white/80 bg-white/90 px-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-lg backdrop-blur-xl md:hidden"
        aria-label="Điều hướng di động"
      >
        <div className="grid grid-cols-5 gap-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(`/${id}`)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-all ${
                  isActive ? 'bg-primary-light text-primary' : 'text-neutral-subtext hover:bg-neutral-bg'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="w-full truncate px-0.5">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
