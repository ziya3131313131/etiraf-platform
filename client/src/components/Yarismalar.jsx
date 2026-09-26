import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const API_URL = API_BASE;
const socket = io(API_BASE.replace('/api', ''));

export default function Yarismalar() {
  const { user, isAdmin, isModerator } = useAuth();
  const [yarışmalar, setYarışmalar] = useState([]);
  const [seçilmişTab, setSeçilmişTab] = useState('aktiv'); // aktiv, gələcək, bitmiş
  const [loading, setLoading] = useState(true);
  const [seçilmişYarışma, setSeçilmişYarışma] = useState(null);

  useEffect(() => {
    loadYarışmalar();
    
    // Socket listeners
    socket.on('yeni-yarisma', (yarışma) => {
      setYarışmalar(prev => [yarışma, ...prev]);
    });
    
    socket.on('yarisma-yenilendi', (yarışma) => {
      setYarışmalar(prev => 
        prev.map(y => y._id === yarışma._id ? yarışma : y)
      );
    });
    
    socket.on('yarisma-ses-yenilendi', ({ yarışmaId, iştirakçılar }) => {
      setYarışmalar(prev =>
        prev.map(y => y._id === yarışmaId ? { ...y, iştirakçılar } : y)
      );
    });
    
    return () => {
      socket.off('yeni-yarisma');
      socket.off('yarisma-yenilendi');
      socket.off('yarisma-ses-yenilendi');
    };
  }, []);

  const loadYarışmalar = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/yarisma`);
      setYarışmalar(response.data);
    } catch (error) {
      console.error('Yarışmalar yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const səsVer = async (yarışmaId, iştirakçıId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/yarisma/${yarışmaId}/ses-ver`, {
        iştirakçıId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Səsiniz qeydə alındı!');
      loadYarışmalar();
    } catch (error) {
      alert(error.response?.data?.xəta || 'Xəta baş verdi');
    }
  };

  const filteredYarışmalar = yarışmalar.filter(y => {
    if (seçilmişTab === 'aktiv') return y.status === 'aktiv';
    if (seçilmişTab === 'gələcək') return y.status === 'gələcək';
    if (seçilmişTab === 'bitmiş') return y.status === 'bitmiş';
    return true;
  });

  if (loading) {
    return <div className="loading">Yüklənir...</div>;
  }

  return (
    <div className="yarismalar-container">
      <div className="yarismalar-header">
        <h1>🏆 Yarışmalar</h1>
        <p>Yarışmalara qatıl, səs ver və mükafat qazan!</p>
      </div>

      {/* Tabs */}
      <div className="yarisma-tabs">
        <button 
          className={seçilmişTab === 'aktiv' ? 'active' : ''}
          onClick={() => setSeçilmişTab('aktiv')}
        >
          🔥 Aktiv ({yarışmalar.filter(y => y.status === 'aktiv').length})
        </button>
        <button 
          className={seçilmişTab === 'gələcək' ? 'active' : ''}
          onClick={() => setSeçilmişTab('gələcək')}
        >
          ⏰ Gələcək ({yarışmalar.filter(y => y.status === 'gələcək').length})
        </button>
        <button 
          className={seçilmişTab === 'bitmiş' ? 'active' : ''}
          onClick={() => setSeçilmişTab('bitmiş')}
        >
          ✅ Bitmiş ({yarışmalar.filter(y => y.status === 'bitmiş').length})
        </button>
      </div>

      {/* Yarışma Cards */}
      <div className="yarisma-grid">
        {filteredYarışmalar.length === 0 ? (
          <div className="yarisma-bos">
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
              {seçilmişTab === 'aktiv' && '🏆'}
              {seçilmişTab === 'gələcək' && '⏰'}
              {seçilmişTab === 'bitmiş' && '✅'}
            </div>
            <h3>Hələ ki yarışma yoxdur</h3>
            <p>
              {seçilmişTab === 'aktiv' && 'Aktiv yarışma olmadığı üçün gələcək yarışmalara baxın'}
              {seçilmişTab === 'gələcək' && 'Tezliklə yeni yarışmalar elan ediləcək'}
              {seçilmişTab === 'bitmiş' && 'Keçmiş yarışmalar burada görünəcək'}
            </p>
          </div>
        ) : (
          filteredYarışmalar.map(yarışma => (
            <div key={yarışma._id} className="yarisma-card">
              {/* Şəkil */}
              {yarışma.şəkil && (
                <div className="yarisma-image">
                  <img src={yarışma.şəkil} alt={yarışma.başlıq} />
                  <div className="yarisma-status-badge">
                    {yarışma.status === 'aktiv' && '🔥 AKTİV'}
                    {yarışma.status === 'gələcək' && '⏰ TEZLIKLƏ'}
                    {yarışma.status === 'bitmiş' && '✅ BİTMİŞ'}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="yarisma-content">
                <div className="yarisma-nov-badge">{yarışma.növ}</div>
                <h3>{yarışma.başlıq}</h3>
                <p className="yarisma-tesvir">{yarışma.təsvir}</p>
                
                {/* Tarix */}
                <div className="yarisma-dates">
                  <div>
                    <span className="label">Başlama:</span>
                    <span>{new Date(yarışma.başlanğıcTarixi).toLocaleString('az-AZ')}</span>
                  </div>
                  <div>
                    <span className="label">Bitmə:</span>
                    <span>{new Date(yarışma.bitişTarixi).toLocaleString('az-AZ')}</span>
                  </div>
                </div>
                
                {/* Mükafat */}
                {yarışma.mükafat && (
                  <div className="yarisma-mukafat">
                    <h4>🎁 Mükafat:</h4>
                    {yarışma.mükafat.jeton && (
                      <div className="mukafat-item">
                        🪙 {yarışma.mükafat.jeton} Jeton
                      </div>
                    )}
                    {yarışma.mükafat.badge && (
                      <div className="mukafat-item">
                        🏅 {yarışma.mükafat.badge.ad} Badge
                      </div>
                    )}
                    {yarışma.mükafat.xüsusi && (
                      <div className="mukafat-item">
                        ⭐ {yarışma.mükafat.xüsusi}
                      </div>
                    )}
                  </div>
                )}
                
                {/* İştirakçılar */}
                <div className="yarisma-stats">
                  <span>👥 {yarışma.iştirakçılar.length} İştirakçı</span>
                  <span>🗳️ {yarışma.səsVerənlər.length} Səs</span>
                </div>
                
                {/* Ətraflı button */}
                <button 
                  className="yarisma-detail-btn"
                  onClick={() => setSeçilmişYarışma(yarışma)}
                >
                  Ətraflı Bax
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Ətraflı */}
      {seçilmişYarışma && (
        <div className="profil-modal" onClick={() => setSeçilmişYarışma(null)}>
          <div 
            className="profil-content yarisma-modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '900px' }}
          >
            <button className="modal-close" onClick={() => setSeçilmişYarışma(null)}>×</button>
            
            <div style={{ padding: 'var(--space-8)' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: 'var(--space-6)' }}>
                {seçilmişYarışma.başlıq}
              </h2>
              
              {/* İştirakçılar */}
              {seçilmişYarışma.iştirakçılar.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 'var(--space-4)' }}>👥 İştirakçılar və Səslər:</h3>
                  <div className="yarisma-istirakci-list">
                    {seçilmişYarışma.iştirakçılar
                      .sort((a, b) => b.səslər - a.səslər)
                      .map((iştirakçı, index) => (
                        <div key={index} className="yarisma-istirakci-item">
                          <div className="istirakci-info">
                            <span className="istirakci-yer">#{index + 1}</span>
                            {iştirakçı.istifadəçi?.profil?.avatar && (
                              <img 
                                src={iştirakçı.istifadəçi.profil.avatar} 
                                alt={iştirakçı.istifadəçi.istifadəçiAdı}
                                className="istirakci-avatar"
                              />
                            )}
                            <span className="istirakci-name">
                              {iştirakçı.istifadəçi?.istifadəçiAdı || 'Anonim'}
                            </span>
                            <span className="istirakci-sesler">
                              🗳️ {iştirakçı.səslər} səs
                            </span>
                          </div>
                          
                          {seçilmişYarışma.status === 'aktiv' && (
                            <button
                              className="ses-ver-btn"
                              onClick={() => səsVer(seçilmişYarışma._id, iştirakçı.istifadəçi._id)}
                              disabled={seçilmişYarışma.səsVerənlər.some(
                                s => s.istifadəçi === user._id
                              )}
                            >
                              {seçilmişYarışma.səsVerənlər.some(
                                s => s.istifadəçi === user._id
                              ) ? '✅ Səs verildi' : '🗳️ Səs ver'}
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
              
              {/* Qaliblər */}
              {seçilmişYarışma.qalibər.length > 0 && (
                <>
                  <h3 style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
                    🏆 Qaliblər:
                  </h3>
                  <div className="yarisma-qalibler">
                    {seçilmişYarışma.qalibər.map((qalib) => (
                      <div key={qalib.yer} className={`qalib-card qalib-${qalib.yer}`}>
                        <div className="qalib-medal">
                          {qalib.yer === 1 && '🥇'}
                          {qalib.yer === 2 && '🥈'}
                          {qalib.yer === 3 && '🥉'}
                        </div>
                        <div className="qalib-name">
                          {qalib.istifadəçi?.istifadəçiAdı || 'Anonim'}
                        </div>
                        <div className="qalib-yer">{qalib.yer}. Yer</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
