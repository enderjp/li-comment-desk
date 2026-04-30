import { LogOut, MessageSquare, MessageSquarePlus, Shield } from 'lucide-react';
import logoLi from '../assets/logoli1.png';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';

interface SidebarProps {
  currentView: 'generator' | 'comments' | 'admin';
  onNavigate: (view: 'generator' | 'comments' | 'admin') => void;
  isAdmin: boolean;
}

export function Sidebar({ currentView, onNavigate, isAdmin }: SidebarProps) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(t('sidebar.signOutError'), error);
    }
  };

  return (
    <div className="w-64 bg-[#262626] min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#262626] flex flex-col items-center">
        <img
          src={logoLi}
          alt="Leads Icon Logo"
          className="w-28 h-auto mb-4 object-contain hover:scale-105 transition-transform"
        />
        <h1 className="text-2xl font-bold text-accent">{t('common.appName')}</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onNavigate('generator')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'generator'
              ? 'bg-primary text-white'
              : 'text-[#D9D9D9] hover:bg-[#294038]/80'
          }`}
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>{t('sidebar.generator')}</span>
        </button>
        <button
          onClick={() => onNavigate('comments')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'comments'
              ? 'bg-primary text-white'
              : 'text-[#D9D9D9] hover:bg-[#294038]/80'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>{t('sidebar.comments')}</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'admin'
                ? 'bg-primary text-white'
                : 'text-[#D9D9D9] hover:bg-[#294038]/80'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>{t('sidebar.admin')}</span>
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-[#D9D9D9]/30">
        <div className="mb-3 px-2">
          <p className="text-sm text-[#D9D9D9]">{t('sidebar.signedInAs')}</p>
          <p className="text-sm text-white truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#D9D9D9] hover:bg-[#D9D9D9]/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('sidebar.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
