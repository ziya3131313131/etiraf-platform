import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { getHediyyeList } from '../utils/hediyyeler';
import { API_URL as BASE_URL, API_BASE } from '../config';

const API_URL = API_BASE;
const socket = io(BASE_URL);

function CanliYayim() {
  const { user, jetonYenilə } = useAuth();
  const [yayımlar, setYayımlar] = useState([]);
  const [aktivYayım, setAktivYayım] = useState(null);
  const [yayımModu, setYayımModu] = useState(false);
  
  // Yayım parametrləri
  const [başlıq, setBaşlıq] = useState('');
  const [təsvir, setTəsvir] = useState('');
  const [yayımURL, setYayımURL] = useState(''); // YouTube/Twitch embed URL
  
  // Chat
  const [chatMesaj, setChatMesaj] = useState('');
  const [chatMesajlar, setChatMesajlar] = useState([]);
  const [izləyiciSayı, setİzləyiciSayı] = useState(0);
  
  // Hədiyyələr
  const [hədiyyələr] = useState(getHediyyeList());
  const [hədiyyəPaneliAçıq, setHədiyyəPaneliAçıq] = useState(false);
  const [animasiyalar, setAnimasiyalar] = useState([]);
  
  // PK
  const [pkAktiv, setPkAktiv] = useState(false);
  const [pkNəticə, setPkNəticə] = useState({ yayımçıJeton: 0, rəqibJeton: 0 });

  useEffect(() => {
    yayımlarıGətir();

    // Socket event-ləri
    socket.on('yeni-canli-yayim', (yayım) => {
      setYayımlar(prev => [yayım, ...prev]);
    });

    socket.on('canli-yayim-bitdi', ({ yayımId }) => {
      setYayımlar(prev => prev.filter(y => y._id !== yayımId));
      if (aktivYayım?._id === yayımId) {
        yayımıBitir();
      }
    });

    socket.on('yeni-chat-mesaj', (mesaj) => {
      setChatMesajlar(prev => [...prev, mesaj]);
    });

    socket.on('izleyici-sayisi', ({ sayi }) => {
      setİzləyiciSayı(sayi);
    });

    socket.on('yeni-hediyye', (hədiyyəData) => {
      göstərHədiyyəAnimasiyası(hədiyyəData);
      
      if (hədiyyəData.pkStatus) {
        setPkNəticə({
          yayımçıJeton: hədiyyəData.pkStatus.yayımçıJeton,
          rəqibJeton: hədiyyəData.pkStatus.rəqibJeton
        });
      }
    });

    return () => {
      socket.off('yeni-canli-yayim');
      socket.off('canli-yayim-bitdi');
      socket.off('yeni-chat-mesaj');
      socket.off('izleyici-sayisi');
      socket.off('yeni-hediyye');
    };
  }, [aktivYayım]);

  const göstərHədiyyəAnimasiyası = (hədiyyəData) => {
    const id = Date.now() + Math.random();
    setAnimasiyalar(prev => [...prev, { ...hədiyyəData, id }]);
    
    setTimeout(() => {
      setAnimasiyalar(prev => prev.filter(a => a.id !== id));
    }, 3000);
  };

  const yayımlarıGətir = async () => {
    try {
      const response = await axios.get(`${API_URL}/canli-yayim`);
      setYayımlar(response.data);
    } catch (error) {
      console.error('Yayımlar gətirilmədi:', error);
    }
  };

  const getEmbedURL = (url) => {
    // YouTube URL-ni embed formatına çevir
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Twitch
    if (url.includes('twitch.tv/')) {
      const channel = url.split('twitch.tv/')[1]?.split('?')[0];
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
    }
    return url; // Direkt embed URL
  };

  const yayımBaşlat = async () => {
    if (!başlıq.trim()) {
      alert('Yayım başlığı daxil edin');
      return;
    }

    if (!yayımURL.trim()) {
      alert('YouTube və ya Twitch yayım URL-i daxil edin');
      return;
    }

    if (user.jeton < 50) {
      alert('Kifayət qədər jetonunuz yoxdur. Lazım: 50 jeton');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/canli-yayim`, {
        başlıq,
        təsvir,
        yayımURL: getEmbedURL(yayımURL)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setAktivYayım(response.data.yayım);
      setYayımModu(true);
      
      socket.emit('canli-yayima-qosul', { 
        yayımId: response.data.yayım._id,
        userId: user.id
      });

      jetonYenilə();
      alert('Canlı yayım başladı! 🎥');
    } catch (error) {
      alert('Xəta: ' + (error.response?.data?.xəta || 'Yayım başladıla bilmədi'));
    }
  };

  const yayımıBitir = async () => {
    if (!aktivYayım) return;

    try {
      await axios.put(`${API_URL}/canli-yayim/${aktivYayım._id}/bitir`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      socket.emit('canli-yayimdan-ayril', { 
        yayımId: aktivYayım._id,
        userId: user.id
      });

      setAktivYayım(null);
      setYayımModu(false);
      setBaşlıq('');
      setTəsvir('');
      setYayımURL('');
      setChatMesajlar([]);
      setPkAktiv(false);

      alert('Yayım bitdi!');
      yayımlarıGətir();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const yayımaQoşul = async (yayım) => {
    setAktivYayım(yayım);
    setYayımModu(false);

    socket.emit('canli-yayima-qosul', { 
      yayımId: yayım._id,
      userId: user.id
    });

    try {
      const response = await axios.get(`${API_URL}/canli-yayim/${yayım._id}`);
      setChatMesajlar(response.data.chat || []);
      
      if (response.data.pkStatus?.aktiv) {
        setPkAktiv(true);
        setPkNəticə(response.data.pkStatus.nəticə);
      }
    } catch (error) {
      console.error('Chat yüklənmədi:', error);
    }
  };

  const mesajGöndər = async (e) => {
    e.preventDefault();
    if (!chatMesaj.trim() || !aktivYayım) return;

    try {
      await axios.post(`${API_URL}/canli-yayim/${aktivYayım._id}/chat`, {
        mesaj: chatMesaj
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setChatMesaj('');
    } catch (error) {
      alert('Mesaj göndərilmədi');
    }
  };

  const hədiyyəGöndər = async (hədiyyə) => {
    if (user.jeton < hədiyyə.qiymət) {
      alert(`Kifayət qədər jetonunuz yoxdur. Lazım: ${hədiyyə.qiymət} jeton`);
      return;
    }

    try {
      await axios.post(`${API_URL}/canli-yayim/${aktivYayım._id}/hediyye`, {
        hədiyyəId: hədiyyə.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setHədiyyəPaneliAçıq(false);
      jetonYenilə();
    } catch (error) {
      alert('Hədiyyə göndərilmədi: ' + (error.response?.data?.xəta || error.message));
    }
  };

  // Ana səhifə - yayımlar siyahısı
  if (!aktivYayım) {
    return (
      <div className="canli-yayim-container">
        <div className="canli-header">
          <h1>📹 Canlı Yayımlar</h1>
          <button className="yayim-baslat-btn" onClick={() => setYayımModu('create')}>
            🎥 Yeni Yayım Başlat
          </button>
        </div>

        {/* Yayım yaratma formu */}
        {yayımModu === 'create' && (
          <div className="yayim-form">
            <h2>🎬 Yeni Canlı Yayım</h2>
            <input
              type="text"
              placeholder="Yayım başlığı"
              value={başlıq}
              onChange={(e) => setBaşlıq(e.target.value)}
            />
            <textarea
              placeholder="Təsvir (ixtiyari)"
              value={təsvir}
              onChange={(e) => setTəsvir(e.target.value)}
              rows={3}
            />
            <input
              type="text"
              placeholder="YouTube və ya Twitch yayım URL-i"
              value={yayımURL}
              onChange={(e) => setYayımURL(e.target.value)}
            />
            <p className="hint">💡 Misal: https://youtube.com/watch?v=... və ya https://twitch.tv/kanal</p>
            <div className="form-actions">
              <button onClick={yayımBaşlat} className="start-btn">
                ✅ Başlat (50 jeton)
              </button>
              <button onClick={() => setYayımModu(false)} className="cancel-btn">
                ❌ Ləğv et
              </button>
            </div>
          </div>
        )}

        {/* Aktiv yayımlar */}
        <div className="yayimlar-grid">
          {yayımlar.length === 0 ? (
            <div className="no-yayim">
              <p>🎭 Hal-hazırda aktiv yayım yoxdur</p>
              <p>İlk yayımı sən başlat!</p>
            </div>
          ) : (
            yayımlar.map(yayım => (
              <div key={yayım._id} className="yayim-card" onClick={() => yayımaQoşul(yayım)}>
                <div className="yayim-thumbnail">
                  <span className="live-badge">🔴 CANLI</span>
                  <span className="viewer-count">👥 {yayım.izləyiciSayı || 0}</span>
                </div>
                <div className="yayim-info">
                  <h3>{yayım.başlıq}</h3>
                  <p className="yayimci-name">
                    {yayım.yayımçı?.profil?.avatar && (
                      <img src={yayım.yayımçı.profil.avatar} alt="" className="mini-avatar" />
                    )}
                    {yayım.yayımçı?.istifadəçiAdı || 'Anonim'}
                  </p>
                  {yayım.təsvir && <p className="yayim-desc">{yayım.təsvir}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Yayım izləmə/yayımlama ekranı
  return (
    <div className="yayim-viewer">
      {/* Video player */}
      <div className="video-container">
        {aktivYayım.yayımURL ? (
          <iframe
            src={aktivYayım.yayımURL}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
        ) : (
          <div className="no-video">📹 Video yüklənir...</div>
        )}

        {/* Hədiyyə animasiyaları */}
        <div className="hediyye-animasiyalar">
          {animasiyalar.map(anim => (
            <div key={anim.id} className="hediyye-anim">
              {anim.hədiyyə.emoji} +{anim.hədiyyə.qiymət}
            </div>
          ))}
        </div>
      </div>

      {/* Yayım məlumatları və chat */}
      <div className="yayim-sidebar">
        <div className="yayim-header-info">
          <h2>{aktivYayım.başlıq}</h2>
          <div className="yayim-stats">
            <span>🔴 CANLI</span>
            <span>👥 {izləyiciSayı}</span>
          </div>
          <div className="yayimci-info">
            {aktivYayım.yayımçı?.profil?.avatar && (
              <img src={aktivYayım.yayımçı.profil.avatar} alt="" className="yayimci-avatar" />
            )}
            <span>{aktivYayım.yayımçı?.istifadəçiAdı || 'Anonim'}</span>
          </div>
        </div>

        {/* Chat */}
        <div className="chat-container">
          <div className="chat-messages">
            {chatMesajlar.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <span className="chat-user">{msg.istifadəçiAdı}:</span>
                <span className="chat-text">{msg.mesaj}</span>
              </div>
            ))}
          </div>

          <form className="chat-input" onSubmit={mesajGöndər}>
            <input
              type="text"
              placeholder="Mesaj yaz..."
              value={chatMesaj}
              onChange={(e) => setChatMesaj(e.target.value)}
            />
            <button type="submit">📤</button>
          </form>
        </div>

        {/* Hədiyyələr */}
        <div className="hediyye-section">
          <button 
            className="hediyye-btn"
            onClick={() => setHədiyyəPaneliAçıq(!hədiyyəPaneliAçıq)}
          >
            🎁 Hədiyyə Göndər
          </button>

          {hədiyyəPaneliAçıq && (
            <div className="hediyye-grid">
              {hədiyyələr.map(hədiyyə => (
                <div 
                  key={hədiyyə.id} 
                  className="hediyye-item"
                  onClick={() => hədiyyəGöndər(hədiyyə)}
                >
                  <span className="hediyye-emoji">{hədiyyə.emoji}</span>
                  <span className="hediyye-ad">{hədiyyə.ad}</span>
                  <span className="hediyye-qiymet">🪙 {hədiyyə.qiymət}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yayımçı kontrolları */}
        {yayımModu && (
          <div className="yayimci-controls">
            <button className="bitir-btn" onClick={yayımıBitir}>
              ⏹️ Yayımı Bitir
            </button>
          </div>
        )}

        {/* Geri dön */}
        {!yayımModu && (
          <button className="geri-btn" onClick={() => {
            setAktivYayım(null);
            socket.emit('canli-yayimdan-ayril', { yayımId: aktivYayım._id, userId: user.id });
          }}>
            ⬅️ Geri
          </button>
        )}
      </div>
    </div>
  );
}

export default CanliYayim;
