import { useState, useEffect, useRef } from 'react';
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
  
  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // Media state
  const [kameraAktiv, setKameraAktiv] = useState(false);
  const [səsAktiv, setSəsAktiv] = useState(true);
  const [videoAktiv, setVideoAktiv] = useState(true);
  
  // Chat
  const [chatMesaj, setChatMesaj] = useState('');
  const [chatMesajlar, setChatMesajlar] = useState([]);
  const [izləyiciSayı, setİzləyiciSayı] = useState(0);
  
  // PK State
  const [pkAktiv, setPkAktiv] = useState(false);
  const [pkRəqib, setPkRəqib] = useState(null);
  const [pkNəticə, setPkNəticə] = useState({ yayımçıJeton: 0, rəqibJeton: 0 });
  const [pkMüddət, setPkMüddət] = useState(0);
  const [pkBaşlayacaq, setPkBaşlayacaq] = useState(false);
  
  // Konuk State
  const [konuklar, setKonuklar] = useState([]);
  const [konukPaneliAçıq, setKonukPaneliAçıq] = useState(false);

  // Hədiyyələr
  const [hədiyyələr] = useState(getHediyyeList());
  const [hədiyyəPaneliAçıq, setHədiyyəPaneliAçıq] = useState(false);
  const [animasiyalar, setAnimasiyalar] = useState([]);

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
      
      // PK aktivdirsə, nəticələri yenilə
      if (hədiyyəData.pkStatus && pkAktiv) {
        setPkNəticə({
          yayımçıJeton: hədiyyəData.pkStatus.yayımçıJeton,
          rəqibJeton: hədiyyəData.pkStatus.rəqibJeton
        });
      }
    });

    // PK Events
    socket.on('pk-basladi', ({ rəqib, müddət }) => {
      setPkAktiv(true);
      setPkRəqib(rəqib);
      setPkMüddət(müddət);
      setPkNəticə({ yayımçıJeton: 0, rəqibJeton: 0 });
      alert(`🔥 PK Başladı! ${rəqib.istifadəçiAdı} ilə yarış! ${müddət / 60} dəqiqə!`);
    });

    socket.on('pk-bitdi', ({ nəticə, qələbəçi }) => {
      setPkAktiv(false);
      const mesaj = qələbəçi 
        ? `🏆 PK Bitdi! Qələbə: ${qələbəçi.istifadəçiAdı}`
        : '🤝 PK Bərabərə bitdi!';
      alert(mesaj);
    });

    // Konuk Events
    socket.on('yeni-konuk-sorgusu', ({ konuk }) => {
      if (yayımModu) {
        const cavab = window.confirm(`${konuk.istifadəçiAdı} yayımınıza qoşulmaq istəyir. Qəbul edirsiniz?`);
        socket.emit('konuk-cavab', {
          yayımId: aktivYayım._id,
          konukId: konuk._id,
          qəbul: cavab
        });
      }
    });

    socket.on('konuk-qebul-edildi', () => {
      alert('✅ Konuk olaraq qəbul edildiniz!');
      setKonukPaneliAçıq(false);
    });

    socket.on('konuk-redd-edildi', () => {
      alert('❌ Konuk sorğusu rədd edildi');
    });

    return () => {
      socket.off('yeni-canli-yayim');
      socket.off('canli-yayim-bitdi');
      socket.off('yeni-chat-mesaj');
      socket.off('izleyici-sayisi');
      socket.off('yeni-hediyye');
      socket.off('pk-basladi');
      socket.off('pk-bitdi');
      socket.off('yeni-konuk-sorgusu');
      socket.off('konuk-qebul-edildi');
      socket.off('konuk-redd-edildi');
      
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [aktivYayım, yayımModu, pkAktiv]);

  const peerConnectionRef = useRef(null);

  const göstərHədiyyəAnimasiyası = (hədiyyəData) => {
    const id = Date.now() + Math.random();
    const animasiya = {
      ...hədiyyəData,
      id,
      x: Math.random() * 80 + 10, // 10-90% arası random x pozisiyası
      y: Math.random() * 60 + 20   // 20-80% arası random y pozisiyası
    };
    
    setAnimasiyalar(prev => [...prev, animasiya]);
    
    // Xüsusi animasiya müddəti
    const müddət = getAnimationDuration(hədiyyəData.hədiyyə.id);
    
    setTimeout(() => {
      setAnimasiyalar(prev => prev.filter(a => a.id !== id));
    }, müddət);
  };

  const getAnimationDuration = (hədiyyəId) => {
    // Bahalı hədiyyələr daha uzun göstərilir
    const durations = {
      'gul': 2000,
      'sekildelik': 2500,
      'urək': 3000,
      'tort': 3500,
      'ulduz': 4000,
      'almas': 5000,
      'tac': 5500,
      'ferari': 6000,
      'adalan': 6500,
      'qasr': 7000,
      'teyare': 7500,
      'balina': 8000
    };
    return durations[hədiyyəId] || 3000;
  };

  const getAnimationClass = (hədiyyəId) => {
    // Hər hədiyyə üçün fərqli animasiya
    const animations = {
      'gul': 'hediyye-fade-zoom',
      'sekildelik': 'hediyye-rotate-bounce',
      'urək': 'hediyye-heartbeat',
      'tort': 'hediyye-bounce-spin',
      'ulduz': 'hediyye-sparkle',
      'almas': 'hediyye-diamond-shine',
      'tac': 'hediyye-crown-float',
      'ferari': 'hediyye-car-drift',
      'adalan': 'hediyye-island-wave',
      'qasr': 'hediyye-palace-grand',
      'teyare': 'hediyye-plane-fly',
      'balina': 'hediyye-whale-splash'
    };
    return animations[hədiyyəId] || 'hediyye-default';
  };

  const yayımlarıGətir = async () => {
    try {
      const response = await axios.get(`${API_URL}/canli-yayim`);
      setYayımlar(response.data);
    } catch (error) {
      console.error('Yayımlar gətirilmədi:', error);
    }
  };

  const kameranıBaşlat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setKameraAktiv(true);
      return stream;
    } catch (error) {
      console.error('Kamera xətası:', error);
      alert('Kamera və mikrofon icazəsi lazımdır! Brauzer parametrlərindən icazə verin.');
      throw error;
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
      // Kameranı başlat
      await kameranıBaşlat();

      // Backend-də yayım yarat
      const response = await axios.post(`${API_URL}/canli-yayim`, {
        başlıq,
        təsvir
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
      alert('🎥 Canlı yayım başladı!');
    } catch (error) {
      alert('Xəta: ' + (error.response?.data?.xəta || 'Kamera açıla bilmədi'));
    }
  };

  const yayımıBitir = async () => {
    if (!aktivYayım) return;

    try {
      await axios.put(`${API_URL}/canli-yayim/${aktivYayım._id}/bitir`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

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
      setKameraAktiv(false);
      setBaşlıq('');
      setTəsvir('');
      setChatMesajlar([]);

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
    } catch (error) {
      console.error('Chat yüklənmədi:', error);
    }
  };

  const videoMuteToggle = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoAktiv(videoTrack.enabled);
      }
    }
  };

  const səsMuteToggle = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setSəsAktiv(audioTrack.enabled);
      }
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
      // PK aktivdirsə, hansı tərəfə göndərdiyini soruş
      let pkTərəfi = null;
      if (pkAktiv && !yayımModu) {
        const yayımçıAdı = aktivYayım.yayımçı?.istifadəçiAdı || 'Yayımçı';
        const rəqibAdı = pkRəqib?.istifadəçiAdı || 'Rəqib';
        
        // Modal seçim
        const mesaj = `🔥 PK Aktivdir! Hansı tərəfə göndərmək istəyirsiniz?\n\n✅ OK = ${yayımçıAdı} (${pkNəticə.yayımçıJeton} 🪙)\n❌ Cancel = ${rəqibAdı} (${pkNəticə.rəqibJeton} 🪙)`;
        const seçim = window.confirm(mesaj);
        pkTərəfi = seçim ? 'yayımçı' : 'rəqib';
        
        // Seçilən tərəfi vizual göstər
        if (seçim) {
          alert(`🎁 ${hədiyyə.ad} → ${yayımçıAdı} tərəfinə göndərilir!`);
        } else {
          alert(`🎁 ${hədiyyə.ad} → ${rəqibAdı} tərəfinə göndərilir!`);
        }
      }

      await axios.post(`${API_URL}/canli-yayim/${aktivYayım._id}/hediyye`, {
        hədiyyəId: hədiyyə.id,
        pkTərəfi
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setHədiyyəPaneliAçıq(false);
      jetonYenilə();
      
      // Uğur mesajı
      if (!pkAktiv) {
        alert(`✅ ${hədiyyə.ad} göndərildi! 🎉`);
      }
    } catch (error) {
      alert('Hədiyyə göndərilmədi: ' + (error.response?.data?.xəta || error.message));
    }
  };

  const pkBaşlat = async () => {
    if (!yayımModu) return;

    const rəqibId = prompt('Rəqib istifadəçi ID-sini daxil edin:');
    if (!rəqibId) return;

    try {
      await axios.post(`${API_URL}/canli-yayim/${aktivYayım._id}/pk-baslat`, {
        rəqibId,
        müddət: 300 // 5 dəqiqə
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert('🔥 PK sorğusu göndərildi!');
    } catch (error) {
      alert('PK başladıla bilmədi: ' + (error.response?.data?.xəta || error.message));
    }
  };

  const konukOlaraQoşul = async () => {
    if (!aktivYayım || yayımModu) return;

    try {
      socket.emit('konuk-sorgusu', {
        yayımId: aktivYayım._id,
        konukId: user.id
      });

      alert('👥 Konuk sorğusu göndərildi. Gözləyin...');
    } catch (error) {
      alert('Sorğu göndərilmədi');
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
            <p className="info-text">📹 Kameranız və mikrofonunuz açılacaq</p>
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

  // Yayım ekranı
  return (
    <div className="yayim-viewer">
      {/* Video container */}
      <div className="video-container">
        {yayımModu ? (
          // Yayımçı - öz kamerasını görür
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-player"
          />
        ) : (
          // İzləyici - yayımçının videosunu görür
          <div className="coming-soon-video">
            <h2>📹 Video yüklənir...</h2>
            <p>WebRTC bağlantısı qurulur</p>
          </div>
        )}

        {/* Hədiyyə animasiyaları - Tam ekran */}
        <div className="hediyye-animasiyalar-container">
          {animasiyalar.map(anim => (
            <div 
              key={anim.id} 
              className={`hediyye-full-animation ${getAnimationClass(anim.hədiyyə.id)}`}
              style={{
                left: `${anim.x}%`,
                top: `${anim.y}%`
              }}
            >
              <div className="hediyye-emoji-large">{anim.hədiyyə.emoji}</div>
              <div className="hediyye-info">
                <span className="hediyye-name">{anim.hədiyyə.ad}</span>
                <span className="hediyye-value">+{anim.hədiyyə.qiymət} 🪙</span>
                <span className="hediyye-sender">{anim.göndərənAdı || 'Anonim'}</span>
              </div>
              
              {/* Partikl effektləri */}
              <div className="hediyye-particles">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`particle particle-${i + 1}`}>✨</div>
                ))}
              </div>
              
              {/* Xüsusi effektlər bahalı hədiyyələr üçün */}
              {anim.hədiyyə.qiymət >= 1000 && (
                <>
                  <div className="hediyye-rays"></div>
                  <div className="hediyye-ring"></div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Yayımçı kontrolları */}
        {yayımModu && kameraAktiv && (
          <div className="video-controls">
            <button 
              className={`control-btn ${videoAktiv ? 'active' : 'muted'}`}
              onClick={videoMuteToggle}
            >
              {videoAktiv ? '📹' : '📹❌'}
            </button>
            <button 
              className={`control-btn ${səsAktiv ? 'active' : 'muted'}`}
              onClick={səsMuteToggle}
            >
              {səsAktiv ? '🎤' : '🔇'}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="yayim-sidebar">
        <div className="yayim-header-info">
          <h2>{aktivYayım.başlıq}</h2>
          <div className="yayim-stats">
            <span className="live-indicator">🔴 CANLI</span>
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
        {!yayımModu && (
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
        )}

        {/* Yayımçı kontrolları */}
        {yayımModu && (
          <div className="yayimci-controls">
            <button className="pk-btn" onClick={pkBaşlat} disabled={pkAktiv}>
              {pkAktiv ? '🔥 PK Aktivdir' : '⚔️ PK Başlat'}
            </button>
            <button className="bitir-btn" onClick={yayımıBitir}>
              ⏹️ Yayımı Bitir
            </button>
          </div>
        )}

        {/* İzləyici kontrolları */}
        {!yayımModu && (
          <>
            <button className="konuk-btn" onClick={konukOlaraQoşul}>
              👥 Konuk Olaraq Qoşul
            </button>
            
            <button className="geri-btn" onClick={() => {
              setAktivYayım(null);
              socket.emit('canli-yayimdan-ayril', { yayımId: aktivYayım._id, userId: user.id });
            }}>
              ⬅️ Geri
            </button>
          </>
        )}

        {/* PK Nəticələri */}
        {pkAktiv && (
          <div className="pk-panel">
            <h3>🔥 PK Döyüşü</h3>
            
            {/* PK Progress Bar */}
            <div className="pk-progress-container">
              <div className="pk-progress-bar">
                <div 
                  className="pk-progress-yayimci"
                  style={{ 
                    width: `${pkNəticə.yayımçıJeton + pkNəticə.rəqibJeton > 0 
                      ? (pkNəticə.yayımçıJeton / (pkNəticə.yayımçıJeton + pkNəticə.rəqibJeton)) * 100 
                      : 50}%` 
                  }}
                >
                  {pkNəticə.yayımçıJeton > 0 && `${pkNəticə.yayımçıJeton} 🪙`}
                </div>
                <div className="pk-progress-reqib">
                  {pkNəticə.rəqibJeton > 0 && `${pkNəticə.rəqibJeton} 🪙`}
                </div>
              </div>
            </div>
            
            {/* Tərəflər */}
            <div className="pk-sonuc">
              <div className={`pk-item ${pkNəticə.yayımçıJeton > pkNəticə.rəqibJeton ? 'pk-qalıb' : ''}`}>
                {aktivYayım.yayımçı?.profil?.avatar && (
                  <img 
                    src={aktivYayım.yayımçı.profil.avatar} 
                    alt="" 
                    className="pk-avatar"
                  />
                )}
                <span className="pk-ad">{aktivYayım.yayımçı?.istifadəçiAdı}</span>
                <span className="pk-jeton">{pkNəticə.yayımçıJeton} 🪙</span>
              </div>
              
              <div className="pk-vs">VS</div>
              
              <div className={`pk-item ${pkNəticə.rəqibJeton > pkNəticə.yayımçıJeton ? 'pk-qalıb' : ''}`}>
                {pkRəqib?.profil?.avatar && (
                  <img 
                    src={pkRəqib.profil.avatar} 
                    alt="" 
                    className="pk-avatar"
                  />
                )}
                <span className="pk-ad">{pkRəqib?.istifadəçiAdı}</span>
                <span className="pk-jeton">{pkNəticə.rəqibJeton} 🪙</span>
              </div>
            </div>
            
            {pkMüddət > 0 && (
              <div className="pk-timer">
                ⏱️ {Math.floor(pkMüddət / 60)}:{(pkMüddət % 60).toString().padStart(2, '0')}
              </div>
            )}
            
            <p className="pk-hint">💡 Hədiyyə göndərərək tərəfinizi dəstəkləyin!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanliYayim;
