import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const kateqoriyalar = ['sevgi', 'dostluq', 'iş', 'ailə', 'digər'];

function EtirafForm({ onSubmit }) {
  const { authenticated, user } = useAuth();
  const [metn, setMetn] = useState('');
  const [kateqoriya, setKateqoriya] = useState('digər');
  const [anonim, setAnonim] = useState(true);
  const [gondərilir, setGondərilir] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (metn.trim().length === 0) {
      alert('Xahiş olunur etiraf yazın');
      return;
    }

    setGondərilir(true);
    try {
      await onSubmit(metn, kateqoriya, anonim);
      setMetn('');
      setKateqoriya('digər');
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
        <textarea
          placeholder="Etirafını bura yaz..."
          value={metn}
          onChange={(e) => setMetn(e.target.value)}
          maxLength={1000}
          disabled={gondərilir}
        />
        
        <div className="form-footer">
          <select 
            value={kateqoriya} 
            onChange={(e) => setKateqoriya(e.target.value)}
            disabled={gondərilir}
          >
            {kateqoriyalar.map(k => (
              <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
            ))}
          </select>

          {authenticated && (
            <label className="anonim-checkbox">
              <input
                type="checkbox"
                checked={anonim}
                onChange={(e) => setAnonim(e.target.checked)}
                disabled={gondərilir}
              />
              <span>Anonim</span>
            </label>
          )}

          <button type="submit" disabled={gondərilir}>
            {gondərilir ? 'Göndərilir...' : 'Göndər 🚀'}
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
