import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageUpload from './ImageUpload';

function EtirafForm({ onSubmit }) {
  const { authenticated, user } = useAuth();
  const [başlıq, setBaşlıq] = useState('');
  const [metn, setMetn] = useState('');
  const [şəkil, setŞəkil] = useState('');
  const [anonim, setAnonim] = useState(true);
  const [gondərilir, setGondərilir] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (başlıq.trim().length === 0) {
      alert('❌ Başlıq daxil edin');
      return;
    }

    if (metn.trim().length === 0) {
      alert('❌ Etiraf yazın');
      return;
    }

    setGondərilir(true);
    try {
      await onSubmit(başlıq, metn, anonim, şəkil);
      setBaşlıq('');
      setMetn('');
      setŞəkil('');
      setAnonim(true);
    } catch (error) {
      alert('❌ Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setGondərilir(false);
    }
  };

  const simvolSayı = metn.length;
  const maksimum = 2000;
  const qalan = maksimum - simvolSayı;

  return (
    <div className="etiraf-form-professional">
      <div className="form-header-modern">
        <div className="form-title-section">
          <h2>✍️ Etirafını Paylaş</h2>
          <p>Duyğularını paylaş, rahatla</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Başlıq */}
        <div className="form-group-modern">
          <label htmlFor="bashliq">
            <span className="label-icon">📌</span>
            Başlıq
          </label>
          <input
            id="bashliq"
            type="text"
            className="input-modern"
            placeholder="Başlıq yaz (məsələn: İtirilmiş sevgi, Keçmiş xatirələr...)"
            value={başlıq}
            onChange={(e) => setBaşlıq(e.target.value)}
            maxLength={200}
            disabled={gondərilir}
          />
          <div className="input-hint">
            {başlıq.length}/200 simvol
          </div>
        </div>

        {/* Mətn */}
        <div className="form-group-modern">
          <label htmlFor="metn">
            <span className="label-icon">💭</span>
            Etirafın
          </label>
          <textarea
            id="metn"
            className="textarea-modern"
            placeholder="Etirafını bura yaz... Keçmiş xatirələr, gizli hisslər, peşmanlıqlar və ya xəyallar - hamısını burada paylaşa bilərsən."
            value={metn}
            onChange={(e) => setMetn(e.target.value)}
            maxLength={2000}
            disabled={gondərilir}
            rows={8}
          />
          <div className="textarea-footer">
            <div className={`char-count ${qalan < 100 ? 'warning' : ''}`}>
              {simvolSayı > 0 && (
                <>
                  <span className="current">{simvolSayı}</span>
                  <span className="separator">/</span>
                  <span className="max">{maksimum}</span>
                  {qalan < 100 && (
                    <span className="remaining"> ({qalan} qalıb)</span>
                  )}
                </>
              )}
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${simvolSayı > maksimum * 0.9 ? 'danger' : ''}`}
                style={{ width: `${(simvolSayı / maksimum) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Şəkil/GIF Yükləmə */}
        <ImageUpload
          onImageSelect={setŞəkil}
          currentImage={şəkil}
          label="📷 Şəkil və ya GIF əlavə et (ixtiyari)"
        />

        {/* Anonim Seçimi */}
        {authenticated && (
          <div className="form-options-modern">
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={anonim}
                onChange={(e) => setAnonim(e.target.checked)}
                disabled={gondərilir}
              />
              <span className="toggle-slider-modern"></span>
              <span className="toggle-label">
                {anonim ? '🎭 Anonim paylaş' : `📝 ${user?.istifadəçiAdı} olaraq paylaş`}
              </span>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" className="submit-btn-modern" disabled={gondərilir}>
          {gondərilir ? (
            <>
              <span className="spinner-small"></span>
              Göndərilir...
            </>
          ) : (
            <>
              <span className="btn-icon">🚀</span>
              Etirafı Paylaş
            </>
          )}
        </button>

        {/* Guest Note */}
        {!authenticated && (
          <div className="form-info-box">
            <div className="info-icon">💡</div>
            <div className="info-content">
              <strong>Qeydiyyatdan keçməyə dəyər!</strong>
              <p>Qeydiyyatdan keçsəniz, etirafınızı adınızla paylaşa, başqalarının etiraflarını bəyənə və şərh yaza bilərsiniz. Həmçinin 100 pulsuz jeton alırsınız!</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default EtirafForm;
