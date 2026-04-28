import { MessageSquarePlus, MessageSquare, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

interface SidebarProps {
  currentView: 'generator' | 'comments' | 'admin';
  onNavigate: (view: 'generator' | 'comments' | 'admin') => void;
  isAdmin: boolean;
}

export function Sidebar({ currentView, onNavigate, isAdmin }: SidebarProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-[#262626] min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#262626]">
        <h1 className="text-2xl font-bold text-accent">Leads Icon</h1>
        <p className="text-sm text-accent-hover mt-1">Comment Desk</p>
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
          <span>Generar comentarios</span>
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
          <span>Ver comentarios</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-[#D9D9D9]/30">
        <div className="mb-3 px-2">
          <p className="text-sm text-[#D9D9D9]">Signed in as</p>
          <p className="text-sm text-white truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#D9D9D9] hover:bg-[#D9D9D9]/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
