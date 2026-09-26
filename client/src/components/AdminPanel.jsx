import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const API_URL = API_BASE;

function AdminPanel() {
  const { user } = useAuth();
  const [statistika, setStatistika] = useState(null);
  const [istifadəçilər, setİstifadəçilər] = useState([]);
  const [yarışmalar, setYarışmalar] = useState([]);
  const [seçiləcək, setSeçiləcək] = useState('statistika');
  const [axtarış, setAxtarış] = useState('');
  
  // Yarışma formu state
  const [yarışmaFormu, setYarışmaFormu] = useState({
    başlıq: '',
    təsvir: '',
    şəkil: '',
    status: 'gələcək',
    mükafat: {
      növ: 'jeton',
      miqdar: 100
    },
    başlama: '',
    bitmə: ''
  });
  const [redaktəYarışmaId, setRedaktəYarışmaId] = useState(null);

  useEffect(() => {
    if (seçiləcək === 'statistika') {
      statistikaGətir();
    } else if (seçiləcək === 'istifadəçilər') {
      istifadəçiləriGətir();
    } else if (seçiləcək === 'yarışmalar') {
      yarışmalarıGətir();
    }
  }, [seçiləcək]);

  const statistikaGətir = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/statistika`);
      setStatistika(response.data);
    } catch (error) {
      console.error('Statistika gətirilərkən xəta:', error);
    }
  };

  const istifadəçiləriGətir = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/istifadeciler`, {
        params: { axtarış }
      });
      setİstifadəçilər(response.data.istifadəçilər || []);
    } catch (error) {
      console.error('İstifadəçilər gətirilərkən xəta:', error);
    }
  };

  const jetonVer = async (userId) => {
    const miqdar = prompt('Neçə jeton vermək istəyirsiniz?');
    if (!miqdar || isNaN(miqdar) || miqdar <= 0) return;

    const səbəb = prompt('Səbəb (optional):') || 'Admin tərəfindən verildi';

    try {
      await axios.post(`${API_URL}/admin/jeton-ver/${userId}`, {
        miqdar: Number(miqdar),
        səbəb
      });
      alert(`${miqdar} jeton uğurla verildi!`);
      istifadəçiləriGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  const rolDəyiş = async (userId, cariRol) => {
    const yeniRol = prompt(
      `Yeni rol seçin (admin/moderator/istifadəçi):`,
      cariRol
    );
    
    if (!yeniRol || !['admin', 'moderator', 'istifadəçi'].includes(yeniRol)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/admin/rol-deyis/${userId}`, {
        rol: yeniRol
      });
      alert('Rol uğurla dəyişdirildi!');
      istifadəçiləriGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  const statusDəyiş = async (userId, cariStatus) => {
    const təsdiq = confirm(
      cariStatus 
        ? 'İstifadəçini deaktiv etmək istəyirsiniz?' 
        : 'İstifadəçini aktivləşdirmək istəyirsiniz?'
    );

    if (!təsdiq) return;

    try {
      await axios.put(`${API_URL}/admin/istifadeci-status/${userId}`, {
        aktiv: !cariStatus
      });
      istifadəçiləriGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  // Yarışma əməliyyatları
  const yarışmalarıGətir = async () => {
    try {
      const response = await axios.get(`${API_URL}/yarisma`);
      setYarışmalar(response.data.yarışmalar || []);
    } catch (error) {
      console.error('Yarışmalar gətirilərkən xəta:', error);
    }
  };

  const yarışmaYarat = async (e) => {
    e.preventDefault();
    
    if (!yarışmaFormu.başlıq || !yarışmaFormu.təsvir) {
      alert('Başlıq və təsvir doldurulmalıdır!');
      return;
    }

    try {
      if (redaktəYarışmaId) {
        // Redaktə
        await axios.put(`${API_URL}/yarisma/${redaktəYarışmaId}`, yarışmaFormu);
        alert('Yarışma uğurla yeniləndi!');
        setRedaktəYarışmaId(null);
      } else {
        // Yeni yaradılış
        await axios.post(`${API_URL}/yarisma`, yarışmaFormu);
        alert('Yarışma uğurla yaradıldı!');
      }
      
      // Formu təmizlə
      setYarışmaFormu({
        başlıq: '',
        təsvir: '',
        şəkil: '',
        status: 'gələcək',
        mükafat: { növ: 'jeton', miqdar: 100 },
        başlama: '',
        bitmə: ''
      });
      
      yarışmalarıGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  const yarışmaSil = async (yarışmaId) => {
    if (!confirm('Bu yarışmanı silmək istədiyinizə əminsiniz?')) return;

    try {
      await axios.delete(`${API_URL}/yarisma/${yarışmaId}`);
      alert('Yarışma uğurla silindi!');
      yarışmalarıGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  const yarışmaRedaktəEt = (yarışma) => {
    setYarışmaFormu({
      başlıq: yarışma.başlıq,
      təsvir: yarışma.təsvir,
      şəkil: yarışma.şəkil || '',
      status: yarışma.status,
      mükafat: yarışma.mükafat,
      başlama: yarışma.başlama ? new Date(yarışma.başlama).toISOString().slice(0, 16) : '',
      bitmə: yarışma.bitmə ? new Date(yarışma.bitmə).toISOString().slice(0, 16) : ''
    });
    setRedaktəYarışmaId(yarışma._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const qalib = async (yarışmaId) => {
    const userId = prompt('Qalibin istifadəçi ID-sini daxil edin:');
    if (!userId) return;

    try {
      await axios.post(`${API_URL}/yarisma/${yarışmaId}/qalib`, { qalibId: userId });
      alert('Qalib təyin edildi!');
      yarışmalarıGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  const avtoQalib = async (yarışmaId) => {
    if (!confirm('Avtomatik qalib seçilsin? (Ən çox səs alan)')) return;

    try {
      await axios.post(`${API_URL}/yarisma/${yarışmaId}/avto-qalib`);
      alert('Qalib avtomatik seçildi!');
      yarışmalarıGətir();
    } catch (error) {
      alert('Xəta baş verdi: ' + error.response?.data?.xəta);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛠️ Admin Paneli</h1>
        <p>Xoş gəldiniz, {user?.istifadəçiAdı}!</p>
      </div>

      <div className="admin-tabs">
        <button
          className={seçiləcək === 'statistika' ? 'active' : ''}
          onClick={() => setSeçiləcək('statistika')}
        >
          📊 Statistika
        </button>
        <button
          className={seçiləcək === 'istifadəçilər' ? 'active' : ''}
          onClick={() => setSeçiləcək('istifadəçilər')}
        >
          👥 İstifadəçilər
        </button>
        <button
          className={seçiləcək === 'yarışmalar' ? 'active' : ''}
          onClick={() => setSeçiləcək('yarışmalar')}
        >
          🏆 Yarışmalar
        </button>
      </div>

      <div className="admin-content">
        {seçiləcək === 'statistika' && statistika && (
          <div className="statistika-grid">
            <div className="stat-card">
              <h3>👥 İstifadəçilər</h3>
              <p className="stat-number">{statistika.istifadəçilər}</p>
            </div>
            <div className="stat-card">
              <h3>💭 Etiraflar</h3>
              <p className="stat-number">{statistika.etiraflar}</p>
            </div>
            <div className="stat-card">
              <h3>📹 Canlı Yayımlar</h3>
              <p className="stat-number">{statistika.canlıYayımlar}</p>
            </div>
            <div className="stat-card">
              <h3>🔴 Aktiv Yayımlar</h3>
              <p className="stat-number">{statistika.aktivYayımlar}</p>
            </div>
          </div>
        )}

        {seçiləcək === 'istifadəçilər' && (
          <div className="istifadeci-panel">
            <div className="search-bar">
              <input
                type="text"
                placeholder="İstifadəçi axtar..."
                value={axtarış}
                onChange={(e) => setAxtarış(e.target.value)}
              />
              <button onClick={istifadəçiləriGətir}>Axtar</button>
            </div>

            <div className="istifadeci-table">
              <table>
                <thead>
                  <tr>
                    <th>İstifadəçi</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Jeton</th>
                    <th>Status</th>
                    <th>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {istifadəçilər.map((ist) => (
                    <tr key={ist._id}>
                      <td>{ist.istifadəçiAdı}</td>
                      <td>{ist.email}</td>
                      <td>
                        <span className={`rol-badge rol-${ist.rol}`}>
                          {ist.rol}
                        </span>
                      </td>
                      <td>{ist.jeton} 🪙</td>
                      <td>
                        <span className={`status-badge ${ist.aktiv ? 'aktiv' : 'deaktiv'}`}>
                          {ist.aktiv ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn-sm"
                          onClick={() => jetonVer(ist._id)}
                          title="Jeton ver"
                        >
                          🪙
                        </button>
                        <button
                          className="action-btn-sm"
                          onClick={() => rolDəyiş(ist._id, ist.rol)}
                          title="Rol dəyişdir"
                        >
                          👤
                        </button>
                        <button
                          className="action-btn-sm"
                          onClick={() => statusDəyiş(ist._id, ist.aktiv)}
                          title={ist.aktiv ? 'Deaktiv et' : 'Aktivləşdir'}
                        >
                          {ist.aktiv ? '🔴' : '🟢'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {seçiləcək === 'yarışmalar' && (
          <div className="yarisma-panel">
            {/* Yarışma yaratma/redaktə formu */}
            <div className="yarisma-form-container">
              <h2>{redaktəYarışmaId ? '✏️ Yarışmanı Redaktə Et' : '➕ Yeni Yarışma Yarat'}</h2>
              <form onSubmit={yarışmaYarat} className="yarisma-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Başlıq *</label>
                    <input
                      type="text"
                      value={yarışmaFormu.başlıq}
                      onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, başlıq: e.target.value })}
                      placeholder="Yarışma başlığı"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={yarışmaFormu.status}
                      onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, status: e.target.value })}
                    >
                      <option value="gələcək">🔵 Gələcək</option>
                      <option value="aktiv">🟢 Aktiv</option>
                      <option value="bitmiş">🔴 Bitmiş</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Təsvir *</label>
                  <textarea
                    value={yarışmaFormu.təsvir}
                    onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, təsvir: e.target.value })}
                    placeholder="Yarışma haqqında ətraflı məlumat..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Şəkil URL (optional)</label>
                  <input
                    type="text"
                    value={yarışmaFormu.şəkil}
                    onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, şəkil: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {yarışmaFormu.şəkil && (
                    <div className="image-preview-small">
                      <img src={yarışmaFormu.şəkil} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mükafat Növü</label>
                    <select
                      value={yarışmaFormu.mükafat.növ}
                      onChange={(e) => setYarışmaFormu({ 
                        ...yarışmaFormu, 
                        mükafat: { ...yarışmaFormu.mükafat, növ: e.target.value }
                      })}
                    >
                      <option value="jeton">🪙 Jeton</option>
                      <option value="badge">🏅 Badge</option>
                      <option value="xüsusi">⭐ Xüsusi</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Mükafat Miqdarı</label>
                    <input
                      type="number"
                      value={yarışmaFormu.mükafat.miqdar}
                      onChange={(e) => setYarışmaFormu({ 
                        ...yarışmaFormu, 
                        mükafat: { ...yarışmaFormu.mükafat, miqdar: Number(e.target.value) }
                      })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Başlama Tarixi</label>
                    <input
                      type="datetime-local"
                      value={yarışmaFormu.başlama}
                      onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, başlama: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Bitmə Tarixi</label>
                    <input
                      type="datetime-local"
                      value={yarışmaFormu.bitmə}
                      onChange={(e) => setYarışmaFormu({ ...yarışmaFormu, bitmə: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {redaktəYarışmaId ? '💾 Yenilə' : '➕ Yarat'}
                  </button>
                  {redaktəYarışmaId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setRedaktəYarışmaId(null);
                        setYarışmaFormu({
                          başlıq: '',
                          təsvir: '',
                          şəkil: '',
                          status: 'gələcək',
                          mükafat: { növ: 'jeton', miqdar: 100 },
                          başlama: '',
                          bitmə: ''
                        });
                      }}
                    >
                      ❌ Ləğv et
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Yarışmalar siyahısı */}
            <div className="yarisma-list">
              <h2>📋 Mövcud Yarışmalar ({yarışmalar.length})</h2>
              
              {yarışmalar.length === 0 ? (
                <div className="empty-state">
                  <p>Hələ heç bir yarışma yoxdur.</p>
                </div>
              ) : (
                <div className="yarisma-grid">
                  {yarışmalar.map((yarışma) => (
                    <div key={yarışma._id} className="yarisma-admin-card">
                      <div className="yarisma-admin-header">
                        <h3>{yarışma.başlıq}</h3>
                        <span className={`status-badge status-${yarışma.status}`}>
                          {yarışma.status === 'gələcək' && '🔵 Gələcək'}
                          {yarışma.status === 'aktiv' && '🟢 Aktiv'}
                          {yarışma.status === 'bitmiş' && '🔴 Bitmiş'}
                        </span>
                      </div>

                      {yarışma.şəkil && (
                        <div className="yarisma-admin-image">
                          <img src={yarışma.şəkil} alt={yarışma.başlıq} />
                        </div>
                      )}

                      <p className="yarisma-admin-desc">{yarışma.təsvir}</p>

                      <div className="yarisma-admin-info">
                        <div className="info-item">
                          <span className="info-label">Mükafat:</span>
                          <span className="info-value">
                            {yarışma.mükafat?.növ === 'jeton' && '🪙'}
                            {yarışma.mükafat?.növ === 'badge' && '🏅'}
                            {yarışma.mükafat?.növ === 'xüsusi' && '⭐'}
                            {' '}{yarışma.mükafat?.miqdar}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">İştirakçılar:</span>
                          <span className="info-value">{yarışma.iştirakçılar?.length || 0}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Səslər:</span>
                          <span className="info-value">{yarışma.səslər?.length || 0}</span>
                        </div>
                      </div>

                      {yarışma.qalib && (
                        <div className="qalib-info">
                          <span className="qalib-badge">🏆 Qalib:</span>
                          <span className="qalib-name">{yarışma.qalib.istifadəçiAdı}</span>
                        </div>
                      )}

                      {yarışma.başlama && (
                        <div className="date-info">
                          <small>📅 Başlama: {new Date(yarışma.başlama).toLocaleString('az-AZ')}</small>
                        </div>
                      )}
                      {yarışma.bitmə && (
                        <div className="date-info">
                          <small>🏁 Bitmə: {new Date(yarışma.bitmə).toLocaleString('az-AZ')}</small>
                        </div>
                      )}

                      <div className="yarisma-admin-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => yarışmaRedaktəEt(yarışma)}
                          title="Redaktə et"
                        >
                          ✏️ Redaktə
                        </button>
                        
                        {!yarışma.qalib && yarışma.status === 'bitmiş' && (
                          <>
                            <button
                              className="action-btn winner-btn"
                              onClick={() => avtoQalib(yarışma._id)}
                              title="Avtomatik qalib seç"
                            >
                              🤖 Avto Qalib
                            </button>
                            <button
                              className="action-btn winner-btn"
                              onClick={() => qalib(yarışma._id)}
                              title="Qalib təyin et"
                            >
                              🏆 Qalib Təyin Et
                            </button>
                          </>
                        )}
                        
                        <button
                          className="action-btn delete-btn"
                          onClick={() => yarışmaSil(yarışma._id)}
                          title="Sil"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
