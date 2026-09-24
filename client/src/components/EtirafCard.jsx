import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function EtirafCard({ etiraf, onBeyenme, onSerh, onSil }) {
  const { user } = useAuth();
  const [serhAciq, setSerhAciq] = useState(false);
  const [serhMetn, setSerhMetn] = useState('');
  const [serhGondərilir, setSerhGondərilir] = useState(false);

  // İstifadəçi bu etirafı silə bilərmi?
  const silmǝİcazǝsi = () => {
    if (!user) return false;
    
    // Admin və moderator hamsını silə bilər
    if (user.rol === 'admin' || user.rol === 'moderator') return true;
    
    // İstifadəçi öz etirafını silə bilər
    if (!etiraf.anonim && etiraf.müəllif === user.id) return true;
    
    return false;
  };

  const formatTarix = (tarix) => {
    const date = new Date(tarix);
    const indi = new Date();
    const fərq = Math.floor((indi - date) / 1000); // saniyə

    if (fərq < 60) return 'İndicə';
    if (fərq < 3600) return `${Math.floor(fərq / 60)} dəqiqə əvvəl`;
    if (fərq < 86400) return `${Math.floor(fərq / 3600)} saat əvvəl`;
    return `${Math.floor(fərq / 86400)} gün əvvəl`;
  };

  const handleSerhGondər = async (e) => {
    e.preventDefault();
    
    if (serhMetn.trim().length === 0) return;

    setSerhGondərilir(true);
    try {
      await onSerh(etiraf._id, serhMetn);
      setSerhMetn('');
    } catch (error) {
      alert('Şərh göndərilərkən xəta baş verdi');
    } finally {
      setSerhGondərilir(false);
    }
  };

  return (
    <div className="etiraf-card">
      <div className="etiraf-header">
        <h3 className="etiraf-bashliq">{etiraf.başlıq}</h3>
        <span className="tarix">{formatTarix(etiraf.tarix)}</span>
      </div>

      {/* Müəllif məlumatı */}
      {!etiraf.anonim && etiraf.müəllif && (
        <div className="etiraf-author">
          {etiraf.müəllif.profil?.avatar && (
            <img 
              src={etiraf.müəllif.profil.avatar} 
              alt={etiraf.müəllif.istifadəçiAdı}
              className={`author-avatar ${etiraf.müəllif.profil.avatarType === 'gif' ? 'gif-avatar' : ''}`}
            />
          )}
          <span className="author-name">
            📝 {etiraf.müəllif.istifadəçiAdı || etiraf.müəllifAdı}
            {(etiraf.müəllif.rol === 'admin' || etiraf.müəllif.rol === 'moderator') && (
              <span className="role-badge">{etiraf.müəllif.rol === 'admin' ? '👑' : '🛡️'}</span>
            )}
          </span>
        </div>
      )}
      {etiraf.anonim && (
        <div className="etiraf-author">
          <span className="author-name anonymous">🎭 Anonim</span>
        </div>
      )}

      <p className="etiraf-metn">{etiraf.metn}</p>

      <div className="etiraf-actions">
        <button 
          className={`action-btn ${serhAciq ? 'active' : ''}`}
          onClick={() => setSerhAciq(!serhAciq)}
        >
          💬 {etiraf.şərhlər?.length || 0} Şərh
        </button>
        
        {/* Silmə düyməsi */}
        {silmǝİcazǝsi() && onSil && (
          <button 
            className="action-btn delete-btn" 
            onClick={() => {
              if (window.confirm('Etirafı silmək istədiyinizdən əminsiniz?')) {
                onSil(etiraf._id);
              }
            }}
            title="Etirafı sil"
          >
            🗑️
          </button>
        )}
      </div>

      {serhAciq && (
        <div className="serhler">
          {etiraf.şərhlər && etiraf.şərhlər.length > 0 && (
            <>
              <h4>💬 Şərhlər:</h4>
              {etiraf.şərhlər.map((serh, index) => (
                <div key={index} className="serh-item">
                  <div className="serh-header">
                    {serh.müəllif?.profil?.avatar && (
                      <img 
                        src={serh.müəllif.profil.avatar} 
                        alt={serh.müəllifAdı}
                        className="serh-avatar"
                      />
                    )}
                    <span className="serh-author">
                      {serh.müəllifAdı || 'Anonim'}
                    </span>
                    <span className="serh-tarix">{formatTarix(serh.tarix)}</span>
                  </div>
                  <p className="serh-metn">{serh.metn}</p>
                </div>
              ))}
            </>
          )}

          <form className="serh-form" onSubmit={handleSerhGondər}>
            <input
              type="text"
              placeholder="Şərh yaz..."
              value={serhMetn}
              onChange={(e) => setSerhMetn(e.target.value)}
              disabled={serhGondərilir}
              maxLength={500}
            />
            <button type="submit" disabled={serhGondərilir}>
              {serhGondərilir ? '...' : '📤'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EtirafCard;
