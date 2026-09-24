import express from 'express';
import User from '../models/User.js';
import Etiraf from '../models/Etiraf.js';
import CanliYayim from '../models/CanliYayim.js';
import { authYoxla, adminYoxla } from '../middleware/auth.js';

const router = express.Router();

// Bütün middleware-lər üçün auth və admin yoxlaması
router.use(authYoxla);
router.use(adminYoxla);

// Ümumi statistika
router.get('/statistika', async (req, res) => {
  try {
    const istifadəçiSayı = await User.countDocuments();
    const etirafSayı = await Etiraf.countDocuments();
    const canlıYayımSayı = await CanliYayim.countDocuments();
    const aktivYayımlar = await CanliYayim.countDocuments({ status: 'canlı' });

    res.json({
      istifadəçilər: istifadəçiSayı,
      etiraflar: etirafSayı,
      canlıYayımlar: canlıYayımSayı,
      aktivYayımlar
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Bütün istifadəçiləri gətir
router.get('/istifadeciler', async (req, res) => {
  try {
    const { səhifə = 1, limit = 20, axtarış = '' } = req.query;
    
    const sorğu = axtarış 
      ? { 
          $or: [
            { istifadəçiAdı: new RegExp(axtarış, 'i') },
            { email: new RegExp(axtarış, 'i') }
          ]
        }
      : {};

    const istifadəçilər = await User.find(sorğu)
      .select('-şifrə')
      .sort({ qeydiyyatTarixi: -1 })
      .limit(limit * 1)
      .skip((səhifə - 1) * limit);

    const ümumi = await User.countDocuments(sorğu);

    res.json({
      istifadəçilər,
      ümumi,
      səhifə: Number(səhifə),
      səhifələr: Math.ceil(ümumi / limit)
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçiyə jeton ver
router.post('/jeton-ver/:userId', async (req, res) => {
  try {
    const { miqdar, səbəb } = req.body;
    
    if (!miqdar || miqdar <= 0) {
      return res.status(400).json({ xəta: 'Düzgün miqdar daxil edin' });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    await user.jetonƏlavəEt(miqdar, səbəb || 'Admin tərəfindən verildi');

    res.json({ 
      mesaj: 'Jeton uğurla əlavə edildi',
      yeniJetonSayı: user.jeton
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçinin rolunu dəyişdir
router.put('/rol-deyis/:userId', async (req, res) => {
  try {
    const { rol } = req.body;
    
    if (!['admin', 'moderator', 'istifadəçi'].includes(rol)) {
      return res.status(400).json({ xəta: 'Etibarsız rol' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { rol },
      { new: true }
    ).select('-şifrə');

    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    res.json({ 
      mesaj: 'Rol dəyişdirildi',
      user
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçini aktiv/deaktiv et
router.put('/istifadeci-status/:userId', async (req, res) => {
  try {
    const { aktiv } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { aktiv },
      { new: true }
    ).select('-şifrə');

    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    res.json({ 
      mesaj: aktiv ? 'İstifadəçi aktivləşdirildi' : 'İstifadəçi deaktiv edildi',
      user
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Etirafı sil (moderasiya)
router.delete('/etiraf/:id', async (req, res) => {
  try {
    const etiraf = await Etiraf.findByIdAndDelete(req.params.id);
    
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }

    res.json({ mesaj: 'Etiraf silindi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçinin jeton tarixçəsini gətir
router.get('/jeton-tarixce/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('istifadəçiAdı jeton jetonTarixçəsi');
    
    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
