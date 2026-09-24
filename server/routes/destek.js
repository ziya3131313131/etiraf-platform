import express from 'express';
import Destek from '../models/Destek.js';
import { authYoxla, adminYoxla } from '../middleware/auth.js';

const router = express.Router();

// Yeni dəstək müraciəti yarat
router.post('/', authYoxla, async (req, res) => {
  try {
    const { mövzu, başlıq, mətn, əlaqəliEtiraf } = req.body;

    if (!başlıq || !mətn) {
      return res.status(400).json({ xəta: 'Başlıq və mətn daxil edin' });
    }

    const yeniMüraciət = new Destek({
      istifadəçi: req.user._id,
      istifadəçiAdı: req.user.istifadəçiAdı,
      mövzu: mövzu || 'digər',
      başlıq: başlıq.trim(),
      mətn: mətn.trim(),
      əlaqəliEtiraf
    });

    await yeniMüraciət.save();

    res.status(201).json({
      mesaj: 'Müraciət göndərildi. Tezliklə cavab veriləcək.',
      müraciət: yeniMüraciət
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// İstifadəçinin müraciətlərini gətir
router.get('/menim', authYoxla, async (req, res) => {
  try {
    const müraciətlər = await Destek.find({ istifadəçi: req.user._id })
      .sort({ yaradılmaTarixi: -1 })
      .limit(50);

    res.json(müraciətlər);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Tək müraciəti gətir
router.get('/:id', authYoxla, async (req, res) => {
  try {
    const müraciət = await Destek.findById(req.params.id)
      .populate('istifadəçi', 'istifadəçiAdı profil')
      .populate('cavablar.admin', 'istifadəçiAdı');

    if (!müraciət) {
      return res.status(404).json({ xəta: 'Müraciət tapılmadı' });
    }

    // Yalnız sahibi və ya admin görə bilər
    if (
      müraciət.istifadəçi._id.toString() !== req.user._id.toString() &&
      req.user.rol !== 'admin' &&
      req.user.rol !== 'moderator'
    ) {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }

    res.json(müraciət);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// ===== ADMIN ROUTES =====

// Bütün müraciətləri gətir (admin)
router.get('/admin/hamisi', authYoxla, adminYoxla, async (req, res) => {
  try {
    const { status, mövzu, səhifə = 1, limit = 20 } = req.query;

    const sorğu = {};
    if (status) sorğu.status = status;
    if (mövzu) sorğu.mövzu = mövzu;

    const müraciətlər = await Destek.find(sorğu)
      .populate('istifadəçi', 'istifadəçiAdı')
      .sort({ prioritet: -1, yaradılmaTarixi: -1 })
      .limit(limit * 1)
      .skip((səhifə - 1) * limit);

    const ümumi = await Destek.countDocuments(sorğu);

    res.json({
      müraciətlər,
      ümumi,
      səhifə: Number(səhifə),
      səhifələr: Math.ceil(ümumi / limit)
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Cavab əlavə et (admin)
router.post('/:id/cavab', authYoxla, adminYoxla, async (req, res) => {
  try {
    const { mətn } = req.body;

    if (!mətn || mətn.trim().length === 0) {
      return res.status(400).json({ xəta: 'Cavab mətni daxil edin' });
    }

    const müraciət = await Destek.findById(req.params.id);
    if (!müraciət) {
      return res.status(404).json({ xəta: 'Müraciət tapılmadı' });
    }

    await müraciət.cavabƏlavəEt(
      req.user._id,
      req.user.istifadəçiAdı,
      mətn.trim()
    );

    // Status dəyişdir
    if (müraciət.status === 'açıq') {
      await müraciət.statusDəyişdir('baxılır');
    }

    res.json({
      mesaj: 'Cavab əlavə edildi',
      müraciət
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Status dəyişdir (admin)
router.put('/:id/status', authYoxla, adminYoxla, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['açıq', 'baxılır', 'həll olundu', 'bağlandı'].includes(status)) {
      return res.status(400).json({ xəta: 'Etibarsız status' });
    }

    const müraciət = await Destek.findById(req.params.id);
    if (!müraciət) {
      return res.status(404).json({ xəta: 'Müraciət tapılmadı' });
    }

    await müraciət.statusDəyişdir(status);

    res.json({
      mesaj: 'Status dəyişdirildi',
      müraciət
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Prioritet dəyişdir (admin)
router.put('/:id/prioritet', authYoxla, adminYoxla, async (req, res) => {
  try {
    const { prioritet } = req.body;

    if (!['aşağı', 'orta', 'yüksək', 'təcili'].includes(prioritet)) {
      return res.status(400).json({ xəta: 'Etibarsız prioritet' });
    }

    const müraciət = await Destek.findByIdAndUpdate(
      req.params.id,
      { prioritet, yenilənməTarixi: new Date() },
      { new: true }
    );

    if (!müraciət) {
      return res.status(404).json({ xəta: 'Müraciət tapılmadı' });
    }

    res.json({
      mesaj: 'Prioritet dəyişdirildi',
      müraciət
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
