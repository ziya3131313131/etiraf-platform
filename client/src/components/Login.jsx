import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [rejim, setRejim] = useState('giriş'); // 'giriş' və ya 'qeydiyyat'
  const [formData, setFormData] = useState({
    istifadəçiAdı: '',
    şifrə: ''
  });
  const [xəta, setXəta] = useState('');
  const [yüklənir, setYüklənir] = useState(false);

  const { giriş, qeydiyyat } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setXəta('');
    setYüklənir(true);

    try {
      let result;
      
      if (rejim === 'giriş') {
        result = await giriş(formData.istifadəçiAdı, formData.şifrə);
      } else {
        result = await qeydiyyat(formData.istifadəçiAdı, formData.şifrə);
      }

      if (!result.success) {
        setXəta(result.xəta);
      }
    } catch (error) {
      setXəta('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setYüklənir(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>💭 Etiraf Platforması</h1>
        <p className="login-subtitle">
          {rejim === 'giriş' 
            ? 'Hesabınıza giriş edin' 
            : 'Yeni hesab yaradın'}
        </p>

        {xəta && <div className="error-message">{xəta}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>İstifadəçi Adı</label>
            <input
              type="text"
              name="istifadəçiAdı"
              value={formData.istifadəçiAdı}
              onChange={handleChange}
              placeholder="İstifadəçi adınızı daxil edin"
              required
              minLength={3}
              disabled={yüklənir}
            />
          </div>

          <div className="form-group">
            <label>Şifrə</label>
            <input
              type="password"
              name="şifrə"
              value={formData.şifrə}
              onChange={handleChange}
              placeholder="Şifrənizi daxil edin"
              required
              minLength={3}
              disabled={yüklənir}
            />
          </div>

          <button type="submit" className="login-btn" disabled={yüklənir}>
            {yüklənir 
              ? 'Yüklənir...' 
              : (rejim === 'giriş' ? 'Giriş' : 'Qeydiyyat')}
          </button>
        </form>

        <div className="login-switch">
          {rejim === 'giriş' ? (
            <p>
              Hesabınız yoxdur?{' '}
              <button onClick={() => setRejim('qeydiyyat')}>
                Qeydiyyatdan keç
              </button>
            </p>
          ) : (
            <p>
              Artıq hesabınız var?{' '}
              <button onClick={() => setRejim('giriş')}>
                Giriş et
              </button>
            </p>
          )}
        </div>

        <div className="guest-info">
          <p>🎁 Yeni istifadəçilər 100 pulsuz jeton alır!</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
