import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import EtirafForm from './components/EtirafForm';
import EtirafCard from './components/EtirafCard';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CanliYayim from './components/CanliYayim';
import Destek from './components/Destek';
import ProfilModal from './components/ProfilModal';
import Bildirislər from './components/Bildirislər';
import { API_URL as BASE_URL, API_BASE } from './config';

const API_URL = API_BASE;
const socket = io(BASE_URL);

function AppContent() {
  const { user, loading: authLoading, authenticated, çıxış, isAdmin } = useAuth();
  const [etiraflar, setEtiraflar] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [səhifə, setSəhifə] = useState('etiraflar'); // 'etiraflar', 'canli', 'admin', 'destek'
  const [profilPanelAçıq, setProfilPanelAçıq] = useState(false);
  const [bildirislərAçıq, setBildirislərAçıq] = useState(false);
  const [oxunmayanBildiriş, setOxunmayanBildiriş] = useState(0);

  useEffect(() => {
    // İlk etirafları yüklə
    fetchEtiraflar();
    
    // Bildirişləri yüklə
    loadBildirislərCount();

    // Socket.IO event listeners
    socket.on('yeni-etiraf', (yeniEtiraf) => {
      console.log('🆕 Yeni etiraf alındı:', yeniEtiraf);
      setEtiraflar(prev => [yeniEtiraf, ...prev]);
    });

    socket.on('beyenme-yenilendi', ({ etirafId, bəyənilmələr }) => {
      console.log('❤️ Bəyənilmə yeniləndi:', etirafId);
      setEtiraflar(prev =>
        prev.map(e => e._id === etirafId ? { ...e, bəyənilmələr } : e)
      );
    });

    socket.on('yeni-serh', ({ etirafId, şərh }) => {
      console.log('💬 Yeni şərh alındı:', etirafId);
      setEtiraflar(prev =>
        prev.map(e => {
          if (e._id === etirafId) {
            return { ...e, şərhlər: [...e.şərhlər, şərh] };
          }
          return e;
        })
      );
    });

    socket.on('etiraf-silindi', ({ etirafId }) => {
      console.log('🗑️ Etiraf silindi:', etirafId);
      setEtiraflar(prev => prev.filter(e => e._id !== etirafId));
    });

    socket.on('istifadeci-sayi', (sayi) => {
      setOnlineUsers(sayi);
    });
    
    // Yeni bildiriş gələndə
    socket.on('yeni-bildiris', (bildiris) => {
      console.log('🔔 Yeni bildiriş:', bildiris);
      setOxunmayanBildiriş(prev => prev + 1);
      
      // Səs effekti
      if (localStorage.getItem('səsEffektləri') !== 'false') {
        // Browser notification API
        if (Notification.permission === 'granted') {
          new Notification(bildiris.başlıq, {
            body: bildiris.mesaj,
            icon: '/icon-192x192.png'
          });
        }
      }
    });

    return () => {
      socket.off('yeni-etiraf');
      socket.off('beyenme-yenilendi');
      socket.off('yeni-serh');
      socket.off('etiraf-silindi');
      socket.off('istifadeci-sayi');
      socket.off('yeni-bildiris');
    };
  }, []);
  
  const loadBildirislərCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/bildirislər`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const oxunmayan = response.data.filter(b => !b.oxundu).length;
      setOxunmayanBildiriş(oxunmayan);
    } catch (error) {
      console.error('Bildiriş sayı yüklənərkən xəta:', error);
    }
  };

  const fetchEtiraflar = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/etiraf`);
      setEtiraflar(response.data);
    } catch (error) {
      console.error('Etiraflar yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYeniEtiraf = async (başlıq, metn, anonim) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/etiraf`, { 
        başlıq,
        metn, 
        anonim,
        token
      });
      // Socket.IO avtomatik olaraq yeni etirafı göndərəcək
    } catch (error) {
      console.error('Etiraf göndərilərkən xəta:', error);
      throw error;
    }
  };

  const handleSerh = async (etirafId, metn) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/etiraf/${etirafId}/serh`, { metn, token });
    } catch (error) {
      console.error('Şərh göndərilərkən xəta:', error);
      throw error;
    }
  };

  const handleBeyenme = async (etirafId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/etiraf/${etirafId}/beyenme`, { token });
    } catch (error) {
      console.error('Bəyənmə zamanı xəta:', error);
    }
  };

  const handleEtirafSil = async (etirafId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/etiraf/${etirafId}`, {
        data: { token }
      });
      // Socket.IO avtomatik olaraq silməni bildirecək
    } catch (error) {
      console.error('Etiraf silinərkən xəta:', error);
      alert('Etiraf silinərkən xəta baş verdi: ' + (error.response?.data?.xəta || error.message));
    }
  };

  if (authLoading) {
    return <div className="loading">Yüklənir...</div>;
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>💭 Etiraf</h2>
        </div>
        <div className="nav-menu">
          <button 
            className={səhifə === 'etiraflar' ? 'active' : ''}
            onClick={() => setSəhifə('etiraflar')}
          >
            💭 Etiraflar
          </button>
          <button 
            className={səhifə === 'canli' ? 'active' : ''}
            onClick={() => setSəhifə('canli')}
          >
            📹 Canlı
          </button>
          <button 
            className={səhifə === 'destek' ? 'active' : ''}
            onClick={() => setSəhifə('destek')}
          >
            📞 Dəstək
          </button>
          {isAdmin && (
            <button 
              className={səhifə === 'admin' ? 'active' : ''}
              onClick={() => setSəhifə('admin')}
            >
              🛠️ Admin
            </button>
          )}
        </div>
        <div className="nav-user">
          {/* Dark Mode Toggle */}
          <button 
            className="theme-toggle"
            onClick={() => {
              const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
              const newTheme = isDark ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', newTheme);
              localStorage.setItem('darkMode', !isDark);
            }}
            title="Qaranlıq/İşıqlı rejim"
          >
            {document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}
          </button>
          
          {/* Bildirişlər */}
          <button 
            className="theme-toggle"
            onClick={() => {
              setBildirislərAçıq(true);
              setOxunmayanBildiriş(0);
            }}
            title="Bildirişlər"
            style={{ position: 'relative' }}
          >
            🔔
            {oxunmayanBildiriş > 0 && (
              <span className="notification-badge">{oxunmayanBildiriş}</span>
            )}
          </button>
          
          {/* Profil şəkli */}
          <div className="user-avatar-container" onClick={() => setProfilPanelAçıq(true)}>
            {user?.profil?.avatar ? (
              <img 
                src={user.profil.avatar} 
                alt={user.istifadəçiAdı}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {user?.istifadəçiAdı?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <span className="user-jeton">🪙 {user?.jeton || 0}</span>
          <span className="user-name">{user?.istifadəçiAdı}</span>
          <button className="logout-btn" onClick={çıxış}>Çıxış</button>
        </div>
      </nav>

      {/* Profil Modal */}
      {profilPanelAçıq && (
        <ProfilModal onClose={() => setProfilPanelAçıq(false)} />
      )}
      
      {/* Bildirişlər Modal */}
      {bildirislərAçıq && (
        <Bildirislər onClose={() => setBildirislərAçıq(false)} />
      )}

      <div className="container">
        {səhifə === 'etiraflar' && (
          <>
            <div className="header">
              <h1>💭 Etiraf Platforması</h1>
              <p>Anonim etiraflarını bizə paylaş</p>
              <div className="online-users">
                🟢 {onlineUsers} nəfər online
              </div>
            </div>

            <EtirafForm onSubmit={handleYeniEtiraf} />

            <div className="etiraflar-list">
              {loading ? (
                <div className="loading">Yüklənir...</div>
              ) : etiraflar.length === 0 ? (
                <div className="loading">Hələ ki etiraf yoxdur. İlk sən yaz! 🎉</div>
              ) : (
                etiraflar.map(etiraf => (
                  <EtirafCard
                    key={etiraf._id}
                    etiraf={etiraf}
                    onBeyenme={handleBeyenme}
                    onSerh={handleSerh}
                    onSil={handleEtirafSil}
                  />
                ))
              )}
            </div>
          </>
        )}

        {səhifə === 'canli' && <CanliYayim />}
        {səhifə === 'destek' && <Destek />}
        {səhifə === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
