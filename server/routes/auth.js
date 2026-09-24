import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { tokenYarat, authYoxla } from '../middleware/auth.js';

const router = express.Router();

// Qeydiyyat (sadə: ad + şifrə)
router.post('/qeydiyyat',
  [
    body('istifadəçiAdı').isLength({ min: 3 }).withMessage('İstifadəçi adı ən azı 3 simvol olmalıdır'),
    body('şifrə').isLength({ min: 3 }).withMessage('Şifrə ən azı 3 simvol olmalıdır')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ xətalar: errors.array() });
      }

      const { istifadəçiAdı, şifrə } = req.body;

      // İstifadəçi artıq varmı yoxla
      const mövcudUser = await User.findOne({ istifadəçiAdı });

      if (mövcudUser) {
        return res.status(400).json({ 
          xəta: 'Bu istifadəçi adı artıq istifadə olunur' 
        });
      }

      // Yeni istifadəçi yarat
      const yeniUser = new User({
        istifadəçiAdı,
        şifrə,
        jeton: 100 // Başlanğıc jetonlar (artırıldı)
      });

      await yeniUser.save();

      // Token yarat
      const token = tokenYarat(yeniUser._id, yeniUser.rol);

      res.status(201).json({
        mesaj: 'Qeydiyyat uğurlu',
        token,
        user: {
          id: yeniUser._id,
          istifadəçiAdı: yeniUser.istifadəçiAdı,
          rol: yeniUser.rol,
          jeton: yeniUser.jeton
        }
      });
    } catch (error) {
      res.status(500).json({ xəta: error.message });
    }
  }
);

// Giriş (sadə: ad + şifrə)
router.post('/giris',
  [
    body('istifadəçiAdı').notEmpty().withMessage('İstifadəçi adı daxil edin'),
    body('şifrə').notEmpty().withMessage('Şifrə daxil edin')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ xətalar: errors.array() });
      }

      const { istifadəçiAdı, şifrə } = req.body;

      // İstifadəçini tap
      const user = await User.findOne({ istifadəçiAdı });
      if (!user) {
        return res.status(401).json({ xəta: 'İstifadəçi adı və ya şifrə səhvdir' });
      }

      // Şifrəni yoxla
      const şifrəDüzdür = await user.şifrəYoxla(şifrə);
      if (!şifrəDüzdür) {
        return res.status(401).json({ xəta: 'İstifadəçi adı və ya şifrə səhvdir' });
      }

      if (!user.aktiv) {
        return res.status(403).json({ xəta: 'Hesabınız deaktiv edilib' });
      }

      // Son giriş tarixini yenilə
      user.sonGiriş = new Date();
      await user.save();

      // Token yarat
      const token = tokenYarat(user._id, user.rol);

      res.json({
        mesaj: 'Giriş uğurlu',
        token,
        user: {
          id: user._id,
          istifadəçiAdı: user.istifadəçiAdı,
          rol: user.rol,
          jeton: user.jeton,
          profil: user.profil,
          statistika: user.statistika
        }
      });
    } catch (error) {
      res.status(500).json({ xəta: error.message });
    }
  }
);

// Profil məlumatlarını gətir
router.get('/profil', authYoxla, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-şifrə');
    res.json(user);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Profili yenilə
router.put('/profil', authYoxla, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (bio !== undefined) user.profil.bio = bio;
    if (avatar !== undefined) user.profil.avatar = avatar;
    
    await user.save();
    
    res.json({ mesaj: 'Profil yeniləndi', user });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Token-i yoxla (frontend üçün)
router.get('/yoxla', authYoxla, (req, res) => {
  res.json({ 
    etibarlı: true, 
    user: req.user 
  });
});

export default router;
