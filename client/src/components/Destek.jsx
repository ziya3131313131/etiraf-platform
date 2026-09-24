import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Destek() {
  const { user } = useAuth();
  const [müraciətlər, setMüraciətlər] = useState([]);
  const [formAçıq, setFormAçıq] = useState(false);
  const [yüklənir, setYüklənir] = useState(false);
  
  const [form, setForm] = useState({
    mövzu: 'digər',
    başlıq: '',
    mətn: ''
  });

  useEffect(() => {
    müraciətləriGətir();
  }, []);

  const müraciətləriGətir = async () => {
    try {
      setYüklənir(true);
      const response = await axios.get(`${API_URL}/destek/menim`);
      setMüraciətlər(response.data);
    } catch (error) {
      console.error('Müraciətlər gətiriləmədi:', error);
    } finally {
      setYüklənir(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.başlıq || !form.mətn) {
      alert('Xahiş olunur bütün xanaları doldurun');
      return;
    }

    try {
      setYüklənir(true);
      await axios.post(`${API_URL}/destek`, form);
      alert('Müraciət göndərildi! Tezliklə cavab veriləcək.');
      setForm({ mövzu: 'digər', başlıq: '', mətn: '' });
      setFormAçıq(false);
      müraciətləriGətir();
    } catch (error) {
      alert('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setYüklənir(false);
    }
  };

  return (
    <div className="destek-container">
      <div className="destek-header">
        <h2>📞 Dəstək Mərkəzi</h2>
        <button 
          className="yeni-muraciet-btn"
          onClick={() => setFormAçıq(!formAçıq)}
        >
          {formAçıq ? 'Bağla' : 'Yeni Müraciət'}
        </button>
      </div>

      {formAçıq && (
        <div className="destek-form">
          <h3>Yeni Müraciət</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Mövzu</label>
              <select
                value={form.mövzu}
                onChange={(e) => setForm({...form, mövzu: e.target.value})}
              >
                <option value="texniki">Texniki Dəstək</option>
                <option value="şikayət">Şikayət</option>
                <option value="təklif">Təklif</option>
                <option value="hesab">Hesab Məsələsi</option>
                <option value="digər">Digər</option>
              </select>
            </div>

            <div className="form-group">
              <label>Başlıq</label>
              <input
                type="text"
                value={form.başlıq}
                onChange={(e) => setForm({...form, başlıq: e.target.value})}
                placeholder="Qısa başlıq"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Mətn</label>
              <textarea
                value={form.mətn}
                onChange={(e) => setForm({...form, mətn: e.target.value})}
                placeholder="Müraciətinizi ətraflı izah edin..."
                rows={6}
                maxLength={1000}
              />
            </div>

            <button type="submit" disabled={yüklənir}>
              {yüklənir ? 'Göndərilir...' : 'Göndər'}
            </button>
          </form>
        </div>
      )}

      <div className="muracietler-list">
        <h3>Müraciətləriniz</h3>
        {yüklənir && müraciətlər.length === 0 ? (
          <p className="loading">Yüklənir...</p>
        ) : müraciətlər.length === 0 ? (
          <p className="no-data">Hələ ki müraciətiniz yoxdur</p>
        ) : (
          müraciətlər.map((m) => (
            <div key={m._id} className="muraciet-card">
              <div className="muraciet-header">
                <span className={`status-badge status-${m.status}`}>
                  {m.status === 'açıq' && '🆕 Açıq'}
                  {m.status === 'baxılır' && '👀 Baxılır'}
                  {m.status === 'həll olundu' && '✅ Həll olundu'}
                  {m.status === 'bağlandı' && '🔒 Bağlandı'}
                </span>
                <span className="movzu-badge">{m.mövzu}</span>
              </div>
              <h4>{m.başlıq}</h4>
              <p className="muraciet-metn">{m.mətn}</p>
              <div className="muraciet-footer">
                <span className="tarix">
                  {new Date(m.yaradılmaTarixi).toLocaleDateString('az')}
                </span>
                {m.cavablar && m.cavablar.length > 0 && (
                  <span className="cavab-sayi">
                    💬 {m.cavablar.length} cavab
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Destek;
