import { useState } from 'react';

function EtirafCard({ etiraf, onBeyenme, onSerh }) {
  const [serhAciq, setSerhAciq] = useState(false);
  const [serhMetn, setSerhMetn] = useState('');
  const [serhGondərilir, setSerhGondərilir] = useState(false);

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
        <span className={`kateqoriya-badge badge-${etiraf.kateqoriya}`}>
          {etiraf.kateqoriya}
        </span>
        <span className="tarix">{formatTarix(etiraf.tarix)}</span>
      </div>

      {/* Müəllif məlumatı */}
      {!etiraf.anonim && etiraf.müəllifAdı && (
        <div className="etiraf-author">
          <span className="author-name">📝 {etiraf.müəllifAdı}</span>
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
          className="action-btn" 
          onClick={() => onBeyenme(etiraf._id)}
        >
          ❤️ {etiraf.bəyənilmələr || 0}
        </button>
        <button 
          className={`action-btn ${serhAciq ? 'active' : ''}`}
          onClick={() => setSerhAciq(!serhAciq)}
        >
          💬 {etiraf.şərhlər?.length || 0}
        </button>
      </div>

      {serhAciq && (
        <div className="serhler">
          {etiraf.şərhlər && etiraf.şərhlər.length > 0 && (
            <>
              <h4>Şərhlər:</h4>
              {etiraf.şərhlər.map((serh, index) => (
                <div key={index} className="serh-item">
                  <p className="serh-metn">{serh.metn}</p>
                  <span className="serh-tarix">{formatTarix(serh.tarix)}</span>
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
              {serhGondərilir ? '...' : 'Göndər'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EtirafCard;
