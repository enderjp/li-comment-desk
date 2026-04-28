import { useState, useEffect } from 'react';
import { useAuth } from './contexts/useAuth';
import { LoginForm } from './components/LoginForm';
import { EmailConfirmation } from './components/EmailConfirmation';
import { Sidebar } from './components/Sidebar';
import { CommentGeneratorForm } from './components/CommentGeneratorForm';
import { CommentsView } from './components/CommentsView';
import { NotificationBell } from './components/NotificationBell';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { Loader2, Zap } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'comments' | 'admin'>('generator');
  const [prefilterAdset, setPrefilterAdset] = useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [isConfirmPage, setIsConfirmPage] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const effectiveView = currentView === 'admin' && !isAdmin ? 'generator' : currentView;

  useEffect(() => {
    // Check if URL has confirmation tokens in hash
    const hash = window.location.hash;
    const hasConfirmationToken = hash.includes('access_token=') &&
                                  (hash.includes('type=signup') || hash.includes('type=email_change'));

    if (hasConfirmationToken) {
      setIsConfirmPage(true);
    }
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setUserRole(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role in App:', error);
          setUserRole(null);
          return;
        }

        setUserRole(data?.role ?? null);
      } catch (error) {
        console.error('Error fetching user role in App:', error);
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  useEffect(() => {
    if (!isAdmin && currentView === 'admin') {
      setCurrentView('generator');
    }
  }, [currentView, isAdmin]);

  if (isConfirmPage) {
    return <EmailConfirmation />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} isAdmin={isAdmin} />
=======
    <div className="flex min-h-screen bg-[#F5F1E6]">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
>>>>>>> b4bd80950884db1a31420c29e7c312b30defb010

      <div className="flex-1 flex flex-col">
        <header className="bg-[#262626] border-b border-[#262626] px-8 py-4 flex justify-end items-center gap-3">
          <button
            onClick={() => setLightMode(!lightMode)}
            title={lightMode ? 'Desactivar modo ligero' : 'Activar modo ligero para mejor rendimiento'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              lightMode
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'text-gray-500 border-gray-200 hover:border-accent hover:text-accent hover:bg-accent-soft'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Modo Ligero
          </button>
          <NotificationBell
            onNavigateToRequest={(requestId) => {
              console.log('🔔 Navegando a request_id desde notificación:', requestId);
              // Clear first to ensure useEffect triggers even if same ID
              setSelectedRequestId('');
              setPrefilterAdset('');
              // Use setTimeout to ensure state update happens in next tick
              setTimeout(() => {
                setSelectedRequestId(requestId);
                setCurrentView('comments');
              }, 0);
            }}
          />
        </header>

        <main className="flex-1 p-8">
          {effectiveView === 'generator' && (
            <CommentGeneratorForm
              onNavigateToComments={(adset) => {
                setPrefilterAdset(adset);
                setSelectedRequestId('');
                setCurrentView('comments');
              }}
            />
          )}
          {effectiveView === 'comments' && (
            <CommentsView
              prefilterAdset={prefilterAdset}
              selectedRequestId={selectedRequestId}
              lightMode={lightMode}
              onClearPrefilter={() => {
                setPrefilterAdset('');
                setSelectedRequestId('');
              }}
            />
          )}
          {effectiveView === 'admin' && isAdmin && <AdminPanel isAdmin={isAdmin} />}
        </main>
      </div>
    </div>
  );
}

export default App;
