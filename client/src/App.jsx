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

const API_URL = 'http://localhost:5000/api';
const socket = io('http://localhost:5000');

function AppContent() {
  const { user, loading: authLoading, authenticated, çıxış, isAdmin } = useAuth();
  const [etiraflar, setEtiraflar] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [səhifə, setSəhifə] = useState('etiraflar'); // 'etiraflar', 'canli', 'admin', 'destek'

  useEffect(() => {
    // İlk etirafları yüklə
    fetchEtiraflar();

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

    socket.on('istifadeci-sayi', (sayi) => {
      setOnlineUsers(sayi);
    });

    return () => {
      socket.off('yeni-etiraf');
      socket.off('beyenme-yenilendi');
      socket.off('yeni-serh');
      socket.off('istifadeci-sayi');
    };
  }, []);

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

  const handleYeniEtiraf = async (metn, kateqoriya, anonim) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/etiraf`, { 
        metn, 
        kateqoriya,
        anonim,
        token
      });
      // Socket.IO avtomatik olaraq yeni etirafı göndərəcək
    } catch (error) {
      console.error('Etiraf göndərilərkən xəta:', error);
      throw error;
    }
  };

  const handleBeyenme = async (etirafId) => {
    try {
      await axios.post(`${API_URL}/etiraf/${etirafId}/beyenme`);
    } catch (error) {
      console.error('Bəyənilmərkən xəta:', error);
    }
  };

  const handleSerh = async (etirafId, metn) => {
    try {
      await axios.post(`${API_URL}/etiraf/${etirafId}/serh`, { metn });
    } catch (error) {
      console.error('Şərh göndərilərkən xəta:', error);
      throw error;
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
          <span className="user-jeton">🪙 {user?.jeton || 0}</span>
          <span className="user-name">{user?.istifadəçiAdı}</span>
          <button className="logout-btn" onClick={çıxış}>Çıxış</button>
        </div>
      </nav>

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
