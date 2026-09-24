import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

function AdminPanel() {
  const { user } = useAuth();
  const [statistika, setStatistika] = useState(null);
  const [istifadəçilər, setİstifadəçilər] = useState([]);
  const [seçiləcək, setSeçiləcək] = useState('statistika');
  const [axtarış, setAxtarış] = useState('');

  useEffect(() => {
    if (seçiləcək === 'statistika') {
      statistikaGətir();
    } else if (seçiləcək === 'istifadəçilər') {
      istifadəçiləriGətir();
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
      </div>
    </div>
  );
}

export default AdminPanel;
