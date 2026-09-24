import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE } from '../config';

const API_URL = API_BASE;

function ProfilPanel({ onClose }) {
  const { user, jetonYenilə } = useAuth();
  const [yüklənir, setYüklənir] = useState(false);
  const [şəkilÖnizləmə, setŞəkilÖnizləmə] = useState(user?.profil?.avatar || '');
  const [şəkilURL, setŞəkilURL] = useState('');

  const handleŞəkilSeç = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Şəkil növünü yoxla
    const isGif = file.type === 'image/gif';
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      alert('Yalnız şəkil faylları seçə bilərsiniz');
      return;
    }

    // GIF yalnız admin və moderator üçün
    if (isGif && user.rol === 'istifadəçi') {
      alert('GIF avatarlar yalnız Admin və Moderator üçündür');
      return;
    }

    // Fayl ölçüsü yoxla (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Şəkil ölçüsü 5MB-dan böyük ola bilməz');
      return;
    }

    // Base64-ə çevir
    const reader = new FileReader();
    reader.onloadend = () => {
      setŞəkilÖnizləmə(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleURLİstifadə = () => {
    if (!şəkilURL.trim()) {
      alert('URL daxil edin');
      return;
    }

    // URL-in şəkil olduğunu yoxla
    const img = new Image();
    img.onload = () => {
      setŞəkilÖnizləmə(şəkilURL);
    };
    img.onerror = () => {
      alert('Şəkil yüklənə bilmədi. URL-i yoxlayın.');
    };
    img.src = şəkilURL;
  };

  const handleŞəkilYüklə = async () => {
    if (!şəkilÖnizləmə) {
      alert('Şəkil seçin');
      return;
    }

    setYüklənir(true);
    try {
      const token = localStorage.getItem('token');
      
      // Şəkil növünü təyin et
      const isGif = şəkilÖnizləmə.includes('data:image/gif') || şəkilÖnizləmə.endsWith('.gif');
      
      await axios.post(
        `${API_URL}/auth/profil/sekil`,
        {
          avatar: şəkilÖnizləmə,
          avatarType: isGif ? 'gif' : 'image'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Profil şəkli yeniləndi! 🎉');
      jetonYenilə(); // User məlumatlarını yenilə
      onClose();
    } catch (error) {
      alert('Xəta: ' + (error.response?.data?.xəta || 'Şəkil yüklənmədi'));
    } finally {
      setYüklənir(false);
    }
  };

  const handleŞəkilSil = async () => {
    if (!window.confirm('Profil şəklini silmək istədiyinizdən əminsiniz?')) return;

    setYüklənir(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/auth/profil/sekil`,
        {
          avatar: '',
          avatarType: 'image'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Profil şəkli silindi');
      setŞəkilÖnizləmə('');
      jetonYenilə();
      onClose();
    } catch (error) {
      alert('Xəta baş verdi');
    } finally {
      setYüklənir(false);
    }
  };

  return (
    <div className="profil-panel-overlay" onClick={onClose}>
      <div className="profil-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profil-panel-header">
          <h2>👤 Profil Parametrləri</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profil-panel-body">
          {/* İstifadəçi məlumatları */}
          <div className="user-info-section">
            <div className="current-avatar">
              {şəkilÖnizləmə ? (
                <img src={şəkilÖnizləmə} alt="Avatar" />
              ) : (
                <div className="no-avatar">📷</div>
              )}
            </div>
            <div className="user-details">
              <h3>{user?.istifadəçiAdı}</h3>
              <p className="user-role">
                {user?.rol === 'admin' ? '👑 Admin' : user?.rol === 'moderator' ? '🛡️ Moderator' : '👤 İstifadəçi'}
              </p>
              <p className="user-jeton">🪙 {user?.jeton || 0} Jeton</p>
            </div>
          </div>

          {/* Şəkil yükləmə */}
          <div className="upload-section">
            <h3>🖼️ Profil Şəkli</h3>
            
            {/* Fayl seçimi */}
            <div className="upload-option">
              <label className="upload-btn">
                📁 Kompüterdən Seç
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleŞəkilSeç}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="upload-hint">
                {user?.rol === 'admin' || user?.rol === 'moderator' 
                  ? 'PNG, JPG və ya GIF (max 5MB)' 
                  : 'PNG və ya JPG (max 5MB)'}
              </p>
            </div>

            {/* URL ilə */}
            <div className="upload-option">
              <p className="upload-label">🔗 Və ya URL daxil edin:</p>
              <div className="url-input-group">
                <input 
                  type="text" 
                  placeholder="https://example.com/avatar.png"
                  value={şəkilURL}
                  onChange={(e) => setŞəkilURL(e.target.value)}
                />
                <button onClick={handleURLİstifadə} className="url-btn">
                  Yüklə
                </button>
              </div>
            </div>

            {/* Əməliyyat düymələri */}
            <div className="action-buttons">
              <button 
                className="save-btn" 
                onClick={handleŞəkilYüklə}
                disabled={yüklənir || !şəkilÖnizləmə}
              >
                {yüklənir ? '⏳ Yüklənir...' : '✅ Yadda Saxla'}
              </button>
              
              {user?.profil?.avatar && (
                <button 
                  className="delete-btn" 
                  onClick={handleŞəkilSil}
                  disabled={yüklənir}
                >
                  🗑️ Şəkli Sil
                </button>
              )}
            </div>
          </div>

          {/* Statistika */}
          <div className="stats-section">
            <h3>📊 Statistika</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">💭</span>
                <span className="stat-value">{user?.statistika?.etirafSayı || 0}</span>
                <span className="stat-label">Etiraf</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{user?.statistika?.şərhSayı || 0}</span>
                <span className="stat-label">Şərh</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❤️</span>
                <span className="stat-value">{user?.statistika?.bəyənilmələr || 0}</span>
                <span className="stat-label">Bəyənilmə</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilPanel;
