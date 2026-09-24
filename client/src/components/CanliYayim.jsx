import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { getHediyyeList } from '../utils/hediyyeler';
import { API_URL as BASE_URL, API_BASE } from '../config';

const API_URL = API_BASE;
const socket = io(BASE_URL);

function CanliYayim() {
  const { user, jetonYenilə } = useAuth();
  const [yayımlar, setYayımlar] = useState([]);
  const [aktivYayım, setAktivYayım] = useState(null);
  const [yayımModu, setYayımModu] = useState(false); // Yayımçı vs izləyici
  const [başlıq, setBaşlıq] = useState('');
  const [təsvir, setTəsvir] = useState('');
  const [chatMesaj, setChatMesaj] = useState('');
  const [chatMesajlar, setChatMesajlar] = useState([]);
  const [izləyiciSayı, setİzləyiciSayı] = useState(0);
  const [hədiyyələr, setHədiyyələr] = useState(getHediyyeList());
  const [hədiyyəPaneliAçıq, setHədiyyəPaneliAçıq] = useState(false);
  const [animasiyalar, setAnimasiyalar] = useState([]);
  
  // Media kontrolları
  const [səsAktiv, setSəsAktiv] = useState(true);
  const [videoAktiv, setVideoAktiv] = useState(true);
  
  // PK
  const [pkAktiv, setPkAktiv] = useState(false);
  const [pkNəticə, setPkNəticə] = useState({ yayımçıJeton: 0, rəqibJeton: 0 });
  const [pkMüddət, setPkMüddət] = useState(0);
  
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    yayımlarıGətir();

    // Socket qoşul
    if (user) {
      socket.emit('user-qosul', user.id);
    }

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
      scrollChatToBottom();
    });

    socket.on('izleyici-sayisi', ({ sayi }) => {
      setİzləyiciSayı(sayi);
    });

    // Hədiyyə animasiyası
    socket.on('yeni-hediyye', (hədiyyəData) => {
      göstərHədiyyəAnimasiyası(hədiyyəData);
      
      // PK nəticəsini yenilə
      if (hədiyyəData.pkStatus) {
        setPkNəticə({
          yayımçıJeton: hədiyyəData.pkStatus.yayımçıJeton,
          rəqibJeton: hədiyyəData.pkStatus.rəqibJeton
        });
      }
    });

    // PK eventləri
    socket.on('pk-basladi', ({ rəqib, müddət }) => {
      setPkAktiv(true);
      setPkMüddət(müddət);
      setPkNəticə({ yayımçıJeton: 0, rəqibJeton: 0 });
    });

    socket.on('pk-bitdi', ({ nəticə }) => {
      setPkAktiv(false);
      alert(`PK bitdi! Nəticə: ${nəticə.yayımçıJeton} vs ${nəticə.rəqibJeton}`);
    });

    return () => {
      socket.off('yeni-canli-yayim');
      socket.off('canli-yayim-bitdi');
      socket.off('yeni-chat-mesaj');
      socket.off('izleyici-sayisi');
      socket.off('yeni-hediyye');
      socket.off('pk-basladi');
      socket.off('pk-bitdi');
    };
  }, [aktivYayım, user]);

  const scrollChatToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const göstərHədiyyəAnimasiyası = (hədiyyəData) => {
    const id = Date.now() + Math.random();
    setAnimasiyalar(prev => [...prev, { ...hədiyyəData, id }]);
    
    // 3 saniyə sonra sil
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

  const yayımBaşlat = async () => {
    if (!başlıq.trim()) {
      alert('Yayım başlığı daxil edin');
      return;
    }

    if (user.jeton < 50) {
      alert('Kifayət qədər jetonunuz yoxdur. Lazım: 50 jeton');
      return;
    }

    try {
      // Kamera icazəsi al
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Backend-də yayım yarat
      const response = await axios.post(`${API_URL}/canli-yayim`, {
        başlıq,
        təsvir
      });

      setAktivYayım(response.data.yayım);
      setYayımModu(true);
      
      // Socket room-a qoşul
      socket.emit('canli-yayima-qosul', { 
        yayımId: response.data.yayım._id,
        userId: user.id
      });

      // Jetonu yenilə
      jetonYenilə();

      alert('Canlı yayım başladı! 🎥');
    } catch (error) {
      alert('Xəta: ' + (error.response?.data?.xəta || 'Kamera icazəsi alınmadı'));
    }
  };

  const yayımıBitir = async () => {
    if (!aktivYayım) return;

    try {
      await axios.put(`${API_URL}/canli-yayim/${aktivYayım._id}/bitir`);
      
      // Kameranı bağla
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      socket.emit('canli-yayimdan-ayril', { 
        yayımId: aktivYayım._id,
        userId: user.id
      });

      setAktivYayım(null);
      setYayımModu(false);
      setBaşlıq('');
      setTəsvir('');
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
      
      // PK statusunu yüklə
      if (response.data.pkStatus?.aktiv) {
        setPkAktiv(true);
        setPkNəticə(response.data.pkStatus.nəticə);
      }
      
      scrollChatToBottom();
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
      });
      setChatMesaj('');
    } catch (error) {
      alert('Mesaj göndərilmədi');
    }
  };

  const hədiyyəGöndər = async (hədiyyə, pkTərəfi = null) => {
    if (user.jeton < hədiyyə.qiymət) {
      alert(`Kifayət qədər jetonunuz yoxdur. Lazım: ${hədiyyə.qiymət} jeton`);
      return;
    }

    try {
      await axios.post(`${API_URL}/canli-yayim/${aktivYayım._id}/hediyye`, {
        hədiyyəId: hədiyyə.id,
        pkTərəfi
      });
      
      jetonYenilə();
      setHədiyyəPaneliAçıq(false);
    } catch (error) {
      alert('Hədiyyə göndərilmədi: ' + error.response?.data?.xəta);
    }
  };

  const səsiBağla = () => {
    setSəsAktiv(!səsAktiv);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !səsAktiv;
      });
    }
    
    socket.emit('konuk-media-status', {
      yayımId: aktivYayım?._id,
      konukId: user?.id,
      səsAktiv: !səsAktiv,
      videoAktiv
    });
  };

  const videoyuBağla = () => {
    setVideoAktiv(!videoAktiv);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoAktiv;
      });
    }
    
    socket.emit('konuk-media-status', {
      yayımId: aktivYayım?._id,
      konukId: user?.id,
      səsAktiv,
      videoAktiv: !videoAktiv
    });
  };

  // Əgər aktiv yayım varsa, player göstər
  if (aktivYayım) {
    return (
      <div className="canli-yayim-player">
        {/* Hədiyyə animasiyaları */}
        <div className="hediyye-animasiyalar">
          {animasiyalar.map((anim) => (
            <div 
              key={anim.id} 
              className="hediyye-anim"
              style={{ 
                fontSize: anim.hədiyyə.qiymət > 1000 ? '120px' : 
                         anim.hədiyyə.qiymət > 100 ? '80px' : '50px',
                animation: 'hediyyeFloat 3s ease-out'
              }}
            >
              <div className="hediyye-emoji">{anim.hədiyyə.emoji}</div>
              <div className="hediyye-info">
                <strong>{anim.göndərən}</strong> → {anim.hədiyyə.ad}
              </div>
            </div>
          ))}
        </div>

        <div className="player-header">
          <h2>{aktivYayım.başlıq}</h2>
          <div className="player-info">
            <span>👁️ {izləyiciSayı} izləyici</span>
            {yayımModu && (
              <>
                <button 
                  className={`media-btn ${səsAktiv ? 'active' : 'muted'}`}
                  onClick={səsiBağla}
                  title={səsAktiv ? 'Səsi bağla' : 'Səsi aç'}
                >
                  {səsAktiv ? '🔊' : '🔇'}
                </button>
                <button 
                  className={`media-btn ${videoAktiv ? 'active' : 'muted'}`}
                  onClick={videoyuBağla}
                  title={videoAktiv ? 'Videonu bağla' : 'Videonu aç'}
                >
                  {videoAktiv ? '📹' : '📷'}
                </button>
                <button className="bitir-btn" onClick={yayımıBitir}>
                  Yayımı Bitir
                </button>
              </>
            )}
            {!yayımModu && (
              <button className="geri-btn" onClick={() => {
                setAktivYayım(null);
                socket.emit('canli-yayimdan-ayril', { 
                  yayımId: aktivYayım._id,
                  userId: user.id
                });
              }}>
                Geri
              </button>
            )}
          </div>
        </div>

        {/* PK Panel */}
        {pkAktiv && (
          <div className="pk-panel">
            <div className="pk-side pk-left">
              <span className="pk-label">Yayımçı</span>
              <span className="pk-score">{pkNəticə.yayımçıJeton} 🪙</span>
            </div>
            <div className="pk-vs">⚔️ VS ⚔️</div>
            <div className="pk-side pk-right">
              <span className="pk-label">Rəqib</span>
              <span className="pk-score">{pkNəticə.rəqibJeton} 🪙</span>
            </div>
          </div>
        )}

        <div className="player-container">
          <div className="video-section">
            {yayımModu ? (
              <video ref={videoRef} autoPlay muted playsInline className="live-video" />
            ) : (
              <div className="video-placeholder">
                📹 Canlı Video<br/>
                <small>(WebRTC inteqrasiyası tamamlanacaq)</small>
              </div>
            )}
            
            {/* Hədiyyə paneli */}
            {!yayımModu && (
              <div className="hediyye-trigger">
                <button 
                  className="hediyye-btn"
                  onClick={() => setHədiyyəPaneliAçıq(!hədiyyəPaneliAçıq)}
                >
                  🎁 Hədiyyə Göndər
                </button>
                {hədiyyəPaneliAçıq && (
                  <div className="hediyye-panel">
                    <h4>Hədiyyə Seç</h4>
                    <div className="hediyye-grid">
                      {hədiyyələr.map((h) => (
                        <button
                          key={h.id}
                          className="hediyye-item"
                          onClick={() => hədiyyəGöndər(h, pkAktiv ? 'yayımçı' : null)}
                          disabled={user.jeton < h.qiymət}
                        >
                          <span className="hediyye-emoji-big">{h.emoji}</span>
                          <span className="hediyye-name">{h.ad.split(' ')[1]}</span>
                          <span className="hediyye-price">{h.qiymət} 🪙</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="chat-section">
            <h3>💬 Chat</h3>
            <div className="chat-messages">
              {chatMesajlar.map((m, i) => (
                <div key={i} className="chat-message">
                  <strong>{m.istifadəçiAdı}:</strong> {m.mesaj}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input" onSubmit={mesajGöndər}>
              <input
                type="text"
                placeholder="Mesaj yaz..."
                value={chatMesaj}
                onChange={(e) => setChatMesaj(e.target.value)}
              />
              <button type="submit">Göndər</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Yayım siyahısı
  return (
    <div className="canli-yayim-list">
      <div className="yayim-header">
        <h2>📹 Canlı Yayımlar</h2>
        {user && (
          <div className="yayim-start-section">
            <p>💰 Jetonunuz: {user.jeton} (Yayım qiyməti: 50)</p>
          </div>
        )}
      </div>

      {!yayımModu && user && (
        <div className="yayim-form">
          <h3>Canlı Yayım Başlat</h3>
          <input
            type="text"
            placeholder="Yayım başlığı"
            value={başlıq}
            onChange={(e) => setBaşlıq(e.target.value)}
            maxLength={100}
          />
          <textarea
            placeholder="Təsvir (optional)"
            value={təsvir}
            onChange={(e) => setTəsvir(e.target.value)}
            maxLength={300}
            rows={3}
          />
          <button onClick={yayımBaşlat} className="start-yayim-btn">
            Yayımı Başlat 🎥 (50 🪙)
          </button>
        </div>
      )}

      <div className="yayim-grid">
        {yayımlar.length === 0 ? (
          <p className="no-yayim">Hazırda aktiv yayım yoxdur</p>
        ) : (
          yayımlar.map((yayım) => (
            <div key={yayım._id} className="yayim-card" onClick={() => yayımaQoşul(yayım)}>
              <div className="yayim-thumbnail">
                <span className="live-badge">🔴 CANLI</span>
                {yayım.pkStatus?.aktiv && (
                  <span className="pk-badge">⚔️ PK</span>
                )}
              </div>
              <div className="yayim-info">
                <h4>{yayım.başlıq}</h4>
                <p>{yayım.yayımçı?.istifadəçiAdı}</p>
                <span>👁️ {yayım.izləyicilər?.length || 0} izləyici</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CanliYayim;
