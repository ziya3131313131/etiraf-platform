import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

const API_URL = API_BASE;

export default function Bildirislər({ onClose }) {
  const { user } = useAuth();
  const [bildirişlər, setBildirişlər] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBildirislər();
  }, []);

  const loadBildirislər = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/bildirislər`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBildirişlər(response.data);
    } catch (error) {
      console.error('Bildirişlər yüklənərkən xəta:', error);
    } finally {
      setLoading(false);
    }
  };

  const bildirişiOxu = async (bildirişId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/bildiris/oxu`, {
        token,
        bildirişId
      });
      
      // Local state-i yenilə
      setBildirişlər(prev => 
        prev.map(b => b._id === bildirişId ? { ...b, oxundu: true } : b)
      );
    } catch (error) {
      console.error('Bildiriş oxunarkən xəta:', error);
    }
  };

  const hamısınıOxu = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/bildiris/hamisini-oxu`, { token });
      
      setBildirişlər(prev => prev.map(b => ({ ...b, oxundu: true })));
    } catch (error) {
      console.error('Bildirişlər oxunarkən xəta:', error);
    }
  };

  const oxunmayanSay = bildirişlər.filter(b => !b.oxundu).length;

  return (
    <div className="profil-modal" onClick={onClose}>
      <div 
        className="profil-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div style={{ padding: 'var(--space-8)' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-6)'
          }}>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              🔔 Bildirişlər
              {oxunmayanSay > 0 && (
                <span style={{
                  marginLeft: 'var(--space-3)',
                  fontSize: '1rem',
                  color: 'var(--danger)',
                  background: 'var(--gray-100)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {oxunmayanSay} yeni
                </span>
              )}
            </h2>
            
            {oxunmayanSay > 0 && (
              <button 
                onClick={hamısınıOxu}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✓ Hamısını oxu
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading" style={{ color: 'var(--text-primary)' }}>
              Yüklənir...
            </div>
          ) : bildirişlər.length === 0 ? (
            <div 
              className="info-text" 
              style={{ 
                textAlign: 'center',
                padding: 'var(--space-12)',
                color: 'var(--text-secondary)'
              }}
            >
              📭 Hələ ki bildiriş yoxdur
            </div>
          ) : (
            <div className="notifications-list">
              {bildirişlər.map((bildiris) => (
                <div
                  key={bildiris._id || bildiris.tarix}
                  className={`notification-item ${!bildiris.oxundu ? 'unread' : ''}`}
                  onClick={() => {
                    if (!bildiris.oxundu) {
                      bildirişiOxu(bildiris._id);
                    }
                    if (bildiris.link) {
                      // Link-ə keçid (hal-hazırda sadəcə bağlayırıq)
                      onClose();
                    }
                  }}
                >
                  <div className="notification-icon">
                    {bildiris.növ === 'beğenme' && '❤️'}
                    {bildiris.növ === 'şerh' && '💬'}
                    {bildiris.növ === 'badge' && '🏆'}
                    {bildiris.növ === 'achievement' && '⭐'}
                    {bildiris.növ === 'hediyye' && '🎁'}
                    {bildiris.növ === 'mesaj' && '📧'}
                    {bildiris.növ === 'sistem' && '⚙️'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{bildiris.başlıq}</div>
                    <div className="notification-message">{bildiris.mesaj}</div>
                    <div className="notification-time">
                      {new Date(bildiris.tarix).toLocaleString('az-AZ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
