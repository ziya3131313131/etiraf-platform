import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function EtirafForm({ onSubmit }) {
  const { authenticated, user } = useAuth();
  const [başlıq, setBaşlıq] = useState('');
  const [metn, setMetn] = useState('');
  const [anonim, setAnonim] = useState(true);
  const [gondərilir, setGondərilir] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (başlıq.trim().length === 0) {
      alert('Başlıq daxil edin');
      return;
    }

    if (metn.trim().length === 0) {
      alert('Etiraf yazın');
      return;
    }

    setGondərilir(true);
    try {
      await onSubmit(başlıq, metn, anonim);
      setBaşlıq('');
      setMetn('');
      setAnonim(true);
    } catch (error) {
      alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setGondərilir(false);
    }
  };

  return (
    <div className="etiraf-form">
      <h2>✍️ Etirafını Paylaş</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="bashliq-input"
          placeholder="Başlıq (məsələn: İtirilmiş sevgi, Keçmiş xatirələr...)"
          value={başlıq}
          onChange={(e) => setBaşlıq(e.target.value)}
          maxLength={200}
          disabled={gondərilir}
        />
        
        <textarea
          placeholder="Etirafını bura yaz..."
          value={metn}
          onChange={(e) => setMetn(e.target.value)}
          maxLength={2000}
          disabled={gondərilir}
        />
        
        <div className="form-footer">
          {authenticated && (
            <label className="anonim-checkbox">
              <input
                type="checkbox"
                checked={anonim}
                onChange={(e) => setAnonim(e.target.checked)}
                disabled={gondərilir}
              />
              <span>{anonim ? '🎭 Anonim' : `📝 ${user?.istifadəçiAdı}`}</span>
            </label>
          )}

          <button type="submit" className="submit-btn" disabled={gondərilir}>
            {gondərilir ? '⏳ Göndərilir...' : '🚀 Paylaş'}
          </button>
        </div>

        {!authenticated && (
          <p className="guest-note">
            💡 Qeydiyyatdan keçsəniz, etirafınızı adınızla da paylaşa bilərsiniz!
          </p>
        )}
      </form>
    </div>
  );
}

export default EtirafForm;
