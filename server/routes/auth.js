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

// Profili yenilə (genişləndirilmiş)
router.put('/profil', authYoxla, async (req, res) => {
  try {
    const { profil } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (profil) {
      if (profil.bio !== undefined) user.profil.bio = profil.bio;
      if (profil.avatar !== undefined) user.profil.avatar = profil.avatar;
      if (profil.banner !== undefined) user.profil.banner = profil.banner;
      if (profil.haqqında !== undefined) user.profil.haqqında = profil.haqqında;
      if (profil.statusMesaj !== undefined) user.profil.statusMesaj = profil.statusMesaj;
      if (profil.spotify !== undefined) user.profil.spotify = profil.spotify;
      if (profil.rəng !== undefined) user.profil.rəng = profil.rəng;
    }
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-şifrə');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçi məlumatlarını gətir (ID ilə)
router.get('/user/:id', authYoxla, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-şifrə');
    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Badge əlavə et (admin/mod)
router.post('/badge/add', authYoxla, async (req, res) => {
  try {
    // Yalnız admin və moderator
    if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }

    const { istifadəçiId, badge } = req.body;
    const user = await User.findById(istifadəçiId);
    
    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    if (!user.badges) user.badges = [];
    user.badges.push({
      ad: badge.ad,
      emoji: badge.emoji,
      şəkil: badge.şəkil,
      rəng: badge.rəng,
      tarix: new Date()
    });

    // Fəaliyyət əlavə et
    if (!user.fəaliyyətlər) user.fəaliyyətlər = [];
    user.fəaliyyətlər.unshift({
      növ: 'badge',
      təsvir: `🏆 ${badge.ad} badge alındı`,
      tarix: new Date()
    });

    await user.save();
    res.json({ mesaj: 'Badge əlavə edildi', user });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Badge sil (admin/mod)
router.post('/badge/remove', authYoxla, async (req, res) => {
  try {
    if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }

    const { istifadəçiId, badgeIndex } = req.body;
    const user = await User.findById(istifadəçiId);
    
    if (!user || !user.badges || !user.badges[badgeIndex]) {
      return res.status(404).json({ xəta: 'Badge tapılmadı' });
    }

    user.badges.splice(badgeIndex, 1);
    await user.save();
    
    res.json({ mesaj: 'Badge silindi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Achievement unlock et
router.post('/achievement/unlock', authYoxla, async (req, res) => {
  try {
    const { achievementId, ad, təsvir, emoji } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.achievements) user.achievements = [];
    
    // Artıq varsa, yenidən əlavə etmə
    const mövcud = user.achievements.find(a => a.id === achievementId);
    if (mövcud) {
      return res.json({ mesaj: 'Artıq mövcuddur' });
    }

    user.achievements.push({
      id: achievementId,
      ad,
      təsvir,
      emoji,
      unlockTarixi: new Date()
    });

    // Fəaliyyət əlavə et
    if (!user.fəaliyyətlər) user.fəaliyyətlər = [];
    user.fəaliyyətlər.unshift({
      növ: 'achievement',
      təsvir: `⭐ ${ad} nailiyyəti açıldı`,
      tarix: new Date()
    });

    await user.save();
    res.json({ mesaj: 'Achievement unlocked!', achievement: user.achievements[user.achievements.length - 1] });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Bildirişləri gətir
router.get('/bildirislər', authYoxla, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bildirişlər');
    res.json(user.bildirişlər || []);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Bildirişi oxunmuş et
router.post('/bildiris/oxu', authYoxla, async (req, res) => {
  try {
    const { bildirişId } = req.body;
    const user = await User.findById(req.user._id);
    
    const bildiris = user.bildirişlər.id(bildirişId);
    if (bildiris) {
      bildiris.oxundu = true;
      await user.save();
    }
    
    res.json({ mesaj: 'Oxundu' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Bütün bildirişləri oxunmuş et
router.post('/bildiris/hamisini-oxu', authYoxla, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.bildirişlər) {
      user.bildirişlər.forEach(b => {
        b.oxundu = true;
      });
      await user.save();
    }
    
    res.json({ mesaj: 'Hamısı oxundu' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Profil şəkli yüklə (base64 və ya URL)
router.post('/profil/sekil', authYoxla, async (req, res) => {
  try {
    const { avatar, avatarType } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ xəta: 'Şəkil məlumatı göndərilmədi' });
    }

    const user = await User.findById(req.user._id);
    
    // GIF yalnız admin və moderator üçün
    if (avatarType === 'gif' && user.rol === 'istifadəçi') {
      return res.status(403).json({ xəta: 'GIF yalnız admin və moderator üçündür' });
    }
    
    user.profil.avatar = avatar;
    user.profil.avatarType = avatarType || 'image';
    
    await user.save();
    
    res.json({ 
      mesaj: 'Profil şəkli yeniləndi', 
      avatar: user.profil.avatar,
      avatarType: user.profil.avatarType
    });
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
