import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook AuthProvider içində istifadə edilməlidir');
  }
  return context;
};

const API_URL = API_BASE;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      yoxla();
    } else {
      setLoading(false);
    }
  }, [token]);

  const yoxla = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/yoxla`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Token yoxlanarkən xəta:', error);
      çıxış();
    } finally {
      setLoading(false);
    }
  };

  const qeydiyyat = async (istifadəçiAdı, şifrə) => {
    try {
      const response = await axios.post(`${API_URL}/auth/qeydiyyat`, {
        istifadəçiAdı,
        şifrə
      });

      const { token: yeniToken, user: yeniUser } = response.data;
      
      localStorage.setItem('token', yeniToken);
      setToken(yeniToken);
      setUser(yeniUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        xəta: error.response?.data?.xəta || 'Qeydiyyat zamanı xəta baş verdi' 
      };
    }
  };

  const giriş = async (istifadəçiAdı, şifrə) => {
    try {
      const response = await axios.post(`${API_URL}/auth/giris`, {
        istifadəçiAdı,
        şifrə
      });

      const { token: yeniToken, user: yeniUser } = response.data;
      
      localStorage.setItem('token', yeniToken);
      setToken(yeniToken);
      setUser(yeniUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        xəta: error.response?.data?.xəta || 'Giriş zamanı xəta baş verdi' 
      };
    }
  };

  const çıxış = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const profilYenilə = async (məlumatlar) => {
    try {
      const response = await axios.put(`${API_URL}/auth/profil`, məlumatlar);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        xəta: error.response?.data?.xəta || 'Profil yenilənərkən xəta baş verdi' 
      };
    }
  };

  const updateUser = (yeniUser) => {
    setUser(yeniUser);
  };

  const jetonYenilə = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profil`);
      setUser(response.data);
    } catch (error) {
      console.error('Jeton yenilənərkən xəta:', error);
    }
  };

  const value = {
    user,
    loading,
    authenticated: !!user,
    qeydiyyat,
    giriş,
    çıxış,
    profilYenilə,
    jetonYenilə,
    updateUser,
    isAdmin: user?.rol === 'admin',
    isModerator: user?.rol === 'moderator' || user?.rol === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
