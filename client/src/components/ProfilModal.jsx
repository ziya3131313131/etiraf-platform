import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const API_URL = API_BASE;

// Achievement ID və məlumatları
const ACHIEVEMENTS = {
  ilk_etiraf: { id: 'ilk_etiraf', ad: 'İlk Etiraf', təsvir: 'İlk etirafını paylaş', emoji: '🎉' },
  etiraf_5: { id: 'etiraf_5', ad: '5 Etiraf', təsvir: '5 etiraf paylaş', emoji: '⭐' },
  etiraf_10: { id: 'etiraf_10', ad: '10 Etiraf', təsvir: '10 etiraf paylaş', emoji: '🌟' },
  etiraf_50: { id: 'etiraf_50', ad: '50 Etiraf', təsvir: '50 etiraf paylaş', emoji: '💫' },
  etiraf_100: { id: 'etiraf_100', ad: '100 Etiraf', təsvir: '100 etiraf paylaş', emoji: '🏆' },
  serh_10: { id: 'serh_10', ad: 'Söhbətçi', təsvir: '10 şərh yaz', emoji: '💬' },
  serh_50: { id: 'serh_50', ad: 'Aktiv İştirakçı', təsvir: '50 şərh yaz', emoji: '💭' },
  serh_100: { id: 'serh_100', ad: 'Şərh Ustası', təsvir: '100 şərh yaz', emoji: '🗨️' },
  beyenme_50: { id: 'beyenme_50', ad: 'Sevimli', təsvir: '50 bəyənmə al', emoji: '❤️' },
  beyenme_100: { id: 'beyenme_100', ad: 'Populyar', təsvir: '100 bəyənmə al', emoji: '💖' },
  beyenme_500: { id: 'beyenme_500', ad: 'İdol', təsvir: '500 bəyənmə al', emoji: '🌹' },
  canli_ilk: { id: 'canli_ilk', ad: 'Yayımçı', təsvir: 'İlk canlı yayımı aç', emoji: '📹' },
  canli_10: { id: 'canli_10', ad: 'Streamer', təsvir: '10 canlı yayım', emoji: '🎬' },
  pk_qalibi: { id: 'pk_qalibi', ad: 'PK Qalib', təsvir: 'İlk PK-nı qazan', emoji: '🏅' },
  pk_10: { id: 'pk_10', ad: 'PK Ustası', təsvir: '10 PK qazan', emoji: '👑' },
  hediyye_10: { id: 'hediyye_10', ad: 'Cömürd', təsvir: '10 hədiyyə göndər', emoji: '🎁' },
  hediyye_50: { id: 'hediyye_50', ad: 'Dəstəkçi', təsvir: '50 hədiyyə göndər', emoji: '💝' },
  jeton_1000: { id: 'jeton_1000', ad: 'Varlı', təsvir: '1000 jeton topla', emoji: '💰' },
  jeton_5000: { id: 'jeton_5000', ad: 'Milyoner', təsvir: '5000 jeton topla', emoji: '💎' },
  ilk_hafta: { id: 'ilk_hafta', ad: 'Bir Həftəlik', təsvir: '7 gün fəal ol', emoji: '🎊' },
  bir_ay: { id: 'bir_ay', ad: 'Veteran', təsvir: '30 gün fəal ol', emoji: '🎖️' }
};

export default function ProfilModal({ onClose, istifadəçiId = null }) {
  const { user: cariUser, updateUser, isAdmin, isModerator } = useAuth();
  const [aktifTab, setAktifTab] = useState('haqqinda');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yüklənir, setYüklənir] = useState(false);
  
  // Redaktə state-ləri
  const [haqqındaEdit, setHaqqındaEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState('');
  const [bannerEdit, setBannerEdit] = useState('');
  const [spotifyEdit, setSpotifyEdit] = useState('');
  const [rəngEdit, setRəngEdit] = useState('#6366f1');
  
  // Badge əlavə et (admin/mod)
  const [badgeForm, setBadgeForm] = useState({
    ad: '',
    emoji: '',
    şəkil: '',
    rəng: '#6366f1'
  });
  
  // Parametrlər
  const [darkMode, setDarkMode] = useState(false);
  const [bildirişlər, setBildirişlər] = useState(true);
  const [səsEffektləri, setSəsEffektləri] = useState(true);
  const [seçilmişTema, setSeçilmişTema] = useState('default');

  const temalar = [
    { id: 'default', ad: 'Default', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'ocean', ad: 'Okean', gradient: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)' },
    { id: 'sunset', ad: 'Günəş', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'forest', ad: 'Meşə', gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
    { id: 'galaxy', ad: 'Qalaktika', gradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
    { id: 'fire', ad: 'Alov', gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
    { id: 'purple', ad: 'Bənövşəyi', gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
    { id: 'mint', ad: 'Mint', gradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' }
  ];

  useEffect(() => {
    loadUser();
    loadSettings();
  }, [istifadəçiId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const targetId = istifadəçiId || cariUser._id;
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/user/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data);
      setHaqqındaEdit(response.data.profil?.haqqında || '');
      setStatusEdit(response.data.profil?.statusMesaj || '🎭');
      setBannerEdit(response.data.profil?.banner || '');
      setSpotifyEdit(response.data.profil?.spotify || '');
      setRəngEdit(response.data.profil?.rəng || '#6366f1');
    } catch (error) {
      console.error('İstifadəçi yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedBildirişlər = localStorage.getItem('bildirişlər') !== 'false';
    const savedSəs = localStorage.getItem('səsEffektləri') !== 'false';
    const savedTema = localStorage.getItem('tema') || 'default';
    
    setDarkMode(savedDarkMode);
    setBildirişlər(savedBildirişlər);
    setSəsEffektləri(savedSəs);
    setSeçilmişTema(savedTema);
    
    // Dark mode tətbiq et
    document.documentElement.setAttribute('data-theme', savedDarkMode ? 'dark' : 'light');
    
    // Tema tətbiq et
    tətbiqTema(savedTema);
  };

  const tətbiqTema = (temaId) => {
    const tema = temalar.find(t => t.id === temaId);
    if (tema) {
      document.body.style.background = tema.gradient;
    }
  };

  const temaSeç = (temaId) => {
    setSeçilmişTema(temaId);
    localStorage.setItem('tema', temaId);
    tətbiqTema(temaId);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  const toggleBildirişlər = () => {
    const newVal = !bildirişlər;
    setBildirişlər(newVal);
    localStorage.setItem('bildirişlər', newVal);
  };

  const toggleSəsEffektləri = () => {
    const newVal = !səsEffektləri;
    setSəsEffektləri(newVal);
    localStorage.setItem('səsEffektləri', newVal);
  };

  const profilYenilə = async () => {
    try {
      setYüklənir(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/auth/profil`, {
        token,
        profil: {
          haqqında: haqqındaEdit,
          statusMesaj: statusEdit,
          banner: bannerEdit,
          spotify: spotifyEdit,
          rəng: rəngEdit
        }
      });
      
      setUser(response.data);
      updateUser(response.data);
      alert('✅ Profil yeniləndi!');
    } catch (error) {
      console.error('Profil yenilənərkən xəta:', error);
      alert('❌ Xəta baş verdi!');
    } finally {
      setYüklənir(false);
    }
  };

  const badgeƏlavəEt = async () => {
    if (!badgeForm.ad || !user) return;
    
    try {
      setYüklənir(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/badge/add`, {
        token,
        istifadəçiId: user._id,
        badge: badgeForm
      });
      
      alert('✅ Badge əlavə edildi!');
      setBadgeForm({ ad: '', emoji: '', şəkil: '', rəng: '#6366f1' });
      loadUser();
    } catch (error) {
      console.error('Badge əlavə edilərkən xəta:', error);
      alert('❌ Xəta baş verdi!');
    } finally {
      setYüklənir(false);
    }
  };

  const badgeSil = async (badgeIndex) => {
    if (!confirm('Badge silinsin?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/badge/remove`, {
        token,
        istifadəçiId: user._id,
        badgeIndex
      });
      
      loadUser();
    } catch (error) {
      console.error('Badge silinərkən xəta:', error);
      alert('❌ Xəta baş verdi!');
    }
  };

  if (loading) {
    return (
      <div className="profil-modal">
        <div className="profil-content">
          <div className="loading">Yüklənir...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const özProfildir = cariUser._id === user._id;
  const adminImkanları = (isAdmin || isModerator) && !özProfildir;

  // Achievement-ləri yoxla
  const achievements = Object.values(ACHIEVEMENTS).map(ach => {
    const unlocked = user.achievements?.some(a => a.id === ach.id);
    return { ...ach, unlocked, unlockTarixi: user.achievements?.find(a => a.id === ach.id)?.unlockTarixi };
  });

  return (
    <div className="profil-modal" onClick={onClose}>
      <div className="profil-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {/* Banner */}
        <div className="profil-banner" style={{ background: user.profil?.banner ? 'transparent' : undefined }}>
          {user.profil?.banner && (
            <img src={user.profil.banner} alt="Banner" className="profil-banner-img" />
          )}
          {özProfildir && (
            <button className="banner-upload-btn">
              📷 Banner Dəyiş
            </button>
          )}
        </div>

        {/* Profil Header */}
        <div className="profil-header">
          <img 
            src={user.profil?.avatar || `https://ui-avatars.com/api/?name=${user.istifadəçiAdı}&size=200`} 
            alt={user.istifadəçiAdı}
            className="profil-avatar-large"
          />
          
          <div className="profil-name-section">
            <div>
              <h2 className="profil-username">
                {user.istifadəçiAdı}
                {user.rol === 'admin' && ' 👑'}
                {user.rol === 'moderator' && ' 🛡️'}
              </h2>
              <p className="profil-status">{user.profil?.statusMesaj || '🎭'}</p>
              
              {/* Badges */}
              {user.badges && user.badges.length > 0 && (
                <div className="profil-badges">
                  {user.badges.map((badge, idx) => (
                    <div 
                      key={idx} 
                      className="badge-item" 
                      style={{ borderColor: badge.rəng }}
                      title={badge.ad}
                    >
                      {badge.şəkil ? (
                        <img src={badge.şəkil} alt={badge.ad} className="badge-image" />
                      ) : (
                        <span>{badge.emoji}</span>
                      )}
                      <span>{badge.ad}</span>
                      {adminImkanları && (
                        <button 
                          onClick={() => badgeSil(idx)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{user.statistika?.etirafSayı || 0}</span>
                <span className="stat-label">Etiraf</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{user.statistika?.şərhSayı || 0}</span>
                <span className="stat-label">Şərh</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{user.statistika?.bəyənilmələr || 0}</span>
                <span className="stat-label">Bəyənmə</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{user.jeton || 0}</span>
                <span className="stat-label">🪙 Jeton</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profil-tabs">
          <button 
            className={`profil-tab ${aktifTab === 'haqqinda' ? 'active' : ''}`}
            onClick={() => setAktifTab('haqqinda')}
          >
            📝 Haqqında
          </button>
          <button 
            className={`profil-tab ${aktifTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setAktifTab('achievements')}
          >
            🏆 Nailiyyətlər
          </button>
          <button 
            className={`profil-tab ${aktifTab === 'activity' ? 'active' : ''}`}
            onClick={() => setAktifTab('activity')}
          >
            📊 Fəaliyyət
          </button>
          {özProfildir && (
            <button 
              className={`profil-tab ${aktifTab === 'settings' ? 'active' : ''}`}
              onClick={() => setAktifTab('settings')}
            >
              ⚙️ Parametrlər
            </button>
          )}
          {özProfildir && (
            <button 
              className={`profil-tab ${aktifTab === 'share' ? 'active' : ''}`}
              onClick={() => setAktifTab('share')}
            >
              🔗 Paylaş
            </button>
          )}
          {adminImkanları && (
            <button 
              className={`profil-tab ${aktifTab === 'admin' ? 'active' : ''}`}
              onClick={() => setAktifTab('admin')}
            >
              🛠️ İdarəetmə
            </button>
          )}
        </div>

        {/* Body */}
        <div className="profil-body">
          {/* Haqqında Tab */}
          {aktifTab === 'haqqinda' && (
            <div className="about-section">
              <h3>📝 Haqqında</h3>
              {özProfildir ? (
                <>
                  <textarea
                    className="about-edit"
                    value={haqqındaEdit}
                    onChange={e => setHaqqındaEdit(e.target.value)}
                    placeholder="Özün haqqında yaz..."
                    maxLength={1000}
                  />
                  
                  <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <label>Status Mesajı</label>
                    <input
                      value={statusEdit}
                      onChange={e => setStatusEdit(e.target.value)}
                      placeholder="🎭 Status mesajın..."
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <label>Banner URL</label>
                    <input
                      value={bannerEdit}
                      onChange={e => setBannerEdit(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <label>🎵 Spotify Link</label>
                    <input
                      value={spotifyEdit}
                      onChange={e => setSpotifyEdit(e.target.value)}
                      placeholder="https://open.spotify.com/..."
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <label>🎨 Profil Rəngi</label>
                    <input
                      type="color"
                      className="color-picker-input"
                      value={rəngEdit}
                      onChange={e => setRəngEdit(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className="save-btn" 
                    onClick={profilYenilə}
                    disabled={yüklənir}
                    style={{ marginTop: 'var(--space-6)' }}
                  >
                    {yüklənir ? 'Yenilənir...' : '💾 Yadda saxla'}
                  </button>
                </>
              ) : (
                <p className="about-text">{user.profil?.haqqında || 'Hələ ki məlumat yoxdur.'}</p>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {aktifTab === 'achievements' && (
            <div className="achievements-grid">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`achievement-card ${!ach.unlocked ? 'locked' : ''}`}
                >
                  <span className="achievement-emoji">{ach.emoji}</span>
                  <div className="achievement-name">{ach.ad}</div>
                  <div className="achievement-desc">{ach.təsvir}</div>
                  {ach.unlocked && ach.unlockTarixi && (
                    <div className="activity-time" style={{ marginTop: 'var(--space-2)' }}>
                      {new Date(ach.unlockTarixi).toLocaleDateString('az-AZ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Activity Tab */}
          {aktifTab === 'activity' && (
            <div className="activity-timeline">
              {user.fəaliyyətlər && user.fəaliyyətlər.length > 0 ? (
                user.fəaliyyətlər.slice(0, 20).map((fəal, idx) => (
                  <div key={idx} className="activity-item">
                    <span className="activity-icon">
                      {fəal.növ === 'etiraf' && '💭'}
                      {fəal.növ === 'şerh' && '💬'}
                      {fəal.növ === 'beğenme' && '❤️'}
                      {fəal.növ === 'canli' && '📹'}
                      {fəal.növ === 'hediyye' && '🎁'}
                      {fəal.növ === 'pk' && '🏅'}
                      {fəal.növ === 'badge' && '🏆'}
                      {fəal.növ === 'achievement' && '⭐'}
                    </span>
                    <div className="activity-content">
                      <div className="activity-desc">{fəal.təsvir}</div>
                      <div className="activity-time">
                        {new Date(fəal.tarix).toLocaleString('az-AZ')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="info-text">Hələ ki fəaliyyət yoxdur.</p>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {aktifTab === 'settings' && özProfildir && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>🌙 Qaranlıq Rejim</h4>
                  <p>Gözləri yormayan qaranlıq tema</p>
                </div>
                <div className={`toggle-switch ${darkMode ? 'active' : ''}`} onClick={toggleDarkMode}>
                  <div className="toggle-slider"></div>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>🔔 Bildirişlər</h4>
                  <p>Push bildirişləri aktivləşdir</p>
                </div>
                <div className={`toggle-switch ${bildirişlər ? 'active' : ''}`} onClick={toggleBildirişlər}>
                  <div className="toggle-slider"></div>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>🔊 Səs Effektləri</h4>
                  <p>Hədiyyə və bildiriş səsləri</p>
                </div>
                <div className={`toggle-switch ${səsEffektləri ? 'active' : ''}`} onClick={toggleSəsEffektləri}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              
              {/* Tema Seçimi */}
              <div style={{ marginTop: 'var(--space-8)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.25rem', fontWeight: 700 }}>
                  🎨 Tema Seçimi
                </h3>
                <div className="theme-grid">
                  {temalar.map(tema => (
                    <div
                      key={tema.id}
                      className={`theme-option ${seçilmişTema === tema.id ? 'active' : ''}`}
                      style={{ background: tema.gradient }}
                      onClick={() => temaSeç(tema.id)}
                      title={tema.ad}
                    >
                      {seçilmişTema === tema.id && (
                        <div className="theme-option-check">✓</div>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ 
                  marginTop: 'var(--space-4)', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}>
                  Seçilmiş: <strong>{temalar.find(t => t.id === seçilmişTema)?.ad}</strong>
                </p>
              </div>
            </div>
          )}
          
          {/* Profil Paylaşımı Tab */}
          {aktifTab === 'share' && özProfildir && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                🔗 Profilini Paylaş
              </h3>
              
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: 'var(--space-6)', 
                borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--space-6)'
              }}>
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: 'var(--space-4)'
                }}>
                  {user.profil?.avatar ? (
                    <img 
                      src={user.profil.avatar} 
                      alt={user.istifadəçiAdı}
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid var(--primary)'
                      }}
                    />
                  ) : '👤'}
                </div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                  {user.istifadəçiAdı}
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  {user.profil?.statusMesaj || '🎭'}
                </p>
                
                <div style={{ 
                  background: 'var(--bg-primary)', 
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <input
                    type="text"
                    value={`${window.location.origin}/profil/${user._id}`}
                    readOnly
                    style={{
                      flex: 1,
                      padding: 'var(--space-3)',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/profil/${user._id}`);
                      alert('✅ Link kopyalandı!');
                    }}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📋 Kopyala
                  </button>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--space-3)', 
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => {
                      const text = `${user.istifadəçiAdı} - Etiraf Platforması`;
                      const url = `${window.location.origin}/profil/${user._id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                    }}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      background: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💬 WhatsApp
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = `${user.istifadəçiAdı} - Etiraf Platforması`;
                      const url = `${window.location.origin}/profil/${user._id}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      background: '#0088cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✈️ Telegram
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = `${user.istifadəçiAdı} - Etiraf Platforması`;
                      const url = `${window.location.origin}/profil/${user._id}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    }}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      background: '#1DA1F2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🐦 Twitter
                  </button>
                </div>
              </div>
              
              <div style={{ 
                padding: 'var(--space-4)',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-lg)',
                borderLeft: '4px solid var(--primary)'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  💡 Profilinizi dostlarınızla paylaşın və platformada daha çox tanınsın!
                </p>
              </div>
            </div>
          )}

          {/* Admin İdarəetmə Tab */}
          {aktifTab === 'admin' && adminImkanları && (
            <div className="badge-manager">
              <h3>🏆 Badge Əlavə Et</h3>
              <div className="add-badge-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Badge Adı</label>
                    <input
                      value={badgeForm.ad}
                      onChange={e => setBadgeForm({ ...badgeForm, ad: e.target.value })}
                      placeholder="VIP, Moderator, ..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Emoji</label>
                    <input
                      value={badgeForm.emoji}
                      onChange={e => setBadgeForm({ ...badgeForm, emoji: e.target.value })}
                      placeholder="🏆"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Şəkil URL (GIF/Foto)</label>
                    <input
                      value={badgeForm.şəkil}
                      onChange={e => setBadgeForm({ ...badgeForm, şəkil: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Rəng</label>
                    <input
                      type="color"
                      value={badgeForm.rəng}
                      onChange={e => setBadgeForm({ ...badgeForm, rəng: e.target.value })}
                    />
                  </div>
                </div>
                
                <button 
                  className="save-btn" 
                  onClick={badgeƏlavəEt}
                  disabled={yüklənir || !badgeForm.ad}
                >
                  {yüklənir ? 'Əlavə edilir...' : '➕ Badge Əlavə Et'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
