import { MessageSquarePlus, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

interface SidebarProps {
  currentView: 'generator' | 'comments';
  onNavigate: (view: 'generator' | 'comments') => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Leads Icon</h1>
        <p className="text-sm text-slate-400 mt-1">Comment Desk</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onNavigate('generator')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'generator'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>Generar comentarios</span>
        </button>
        <button
          onClick={() => onNavigate('comments')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'comments'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Ver comentarios</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-2">
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="text-sm text-white truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
