import express from 'express';
import Yarisma from '../models/Yarisma.js';
import User from '../models/User.js';
import { authYoxla } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// Bütün yarışmaları gətir
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }
    
    const yarışmalar = await Yarisma.find(filter)
      .populate('yaradıcı', 'istifadəçiAdı profil')
      .populate('iştirakçılar.istifadəçi', 'istifadəçiAdı profil')
      .populate('qalibər.istifadəçi', 'istifadəçiAdı profil')
      .sort({ yaradılmaTarixi: -1 });
    
    // Status-ları yenilə
    for (const yarışma of yarışmalar) {
      await yarışma.statusYenilə();
    }
    
    res.json(yarışmalar);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Tək yarışma
router.get('/:id', async (req, res) => {
  try {
    const yarışma = await Yarisma.findById(req.params.id)
      .populate('yaradıcı', 'istifadəçiAdı profil')
      .populate('iştirakçılar.istifadəçi', 'istifadəçiAdı profil')
      .populate('qalibər.istifadəçi', 'istifadəçiAdı profil');
    
    if (!yarışma) {
      return res.status(404).json({ xəta: 'Yarışma tapılmadı' });
    }
    
    await yarışma.statusYenilə();
    res.json(yarışma);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Yeni yarışma yarat (admin/mod)
router.post('/', authYoxla, async (req, res) => {
  try {
    // Yalnız admin və moderator
    if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }
    
    const {
      başlıq,
      təsvir,
      şəkil,
      növ,
      mükafat,
      başlanğıcTarixi,
      bitişTarixi,
      qaydalar,
      parametrlər
    } = req.body;
    
    const yarışma = new Yarisma({
      başlıq,
      təsvir,
      şəkil,
      növ,
      mükafat,
      başlanğıcTarixi,
      bitişTarixi,
      qaydalar,
      parametrlər,
      yaradıcı: req.user._id
    });
    
    await yarışma.save();
    await yarışma.populate('yaradıcı', 'istifadəçiAdı profil');
    
    // Real-time bildiriş
    io.emit('yeni-yarisma', yarışma);
    
    res.status(201).json(yarışma);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Yarışmaya qatıl
router.post('/:id/qatil', authYoxla, async (req, res) => {
  try {
    const { işId, işNövü } = req.body;
    
    const yarışma = await Yarisma.findById(req.params.id);
    
    if (!yarışma) {
      return res.status(404).json({ xəta: 'Yarışma tapılmadı' });
    }
    
    // Yoxla ki, status aktiv olsun
    await yarışma.statusYenilə();
    if (yarışma.status !== 'aktiv') {
      return res.status(400).json({ xəta: 'Yarışma aktiv deyil' });
    }
    
    // Yoxla ki, artıq qatılmamış olsun
    const artıqQatılıb = yarışma.iştirakçılar.some(
      i => i.istifadəçi.toString() === req.user._id.toString()
    );
    
    if (artıqQatılıb) {
      return res.status(400).json({ xəta: 'Artıq qatılmısınız' });
    }
    
    // Maksimum iştirakçı limiti
    if (yarışma.iştirakçılar.length >= yarışma.parametrlər.maksimumIştirakçı) {
      return res.status(400).json({ xəta: 'Yarışma doludur' });
    }
    
    // İştirakçı əlavə et
    yarışma.iştirakçılar.push({
      istifadəçi: req.user._id,
      iş: işId,
      işNövü: işNövü || 'Etiraf',
      qeydiyyatTarixi: new Date(),
      səslər: 0
    });
    
    await yarışma.save();
    await yarışma.populate('iştirakçılar.istifadəçi', 'istifadəçiAdı profil');
    
    // Fəaliyyət əlavə et
    const user = await User.findById(req.user._id);
    if (!user.fəaliyyətlər) user.fəaliyyətlər = [];
    user.fəaliyyətlər.unshift({
      növ: 'yarisma',
      təsvir: `🏆 "${yarışma.başlıq}" yarışmasına qatıldı`,
      tarix: new Date()
    });
    await user.save();
    
    // Real-time yenilənmə
    io.emit('yarisma-yenilendi', yarışma);
    
    res.json(yarışma);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Səs ver
router.post('/:id/ses-ver', authYoxla, async (req, res) => {
  try {
    const { iştirakçıId } = req.body;
    
    const yarışma = await Yarisma.findById(req.params.id);
    
    if (!yarışma) {
      return res.status(404).json({ xəta: 'Yarışma tapılmadı' });
    }
    
    await yarışma.səsVer(req.user._id, iştirakçıId);
    await yarışma.populate('iştirakçılar.istifadəçi', 'istifadəçiAdı profil');
    
    // Real-time yenilənmə
    io.emit('yarisma-ses-yenilendi', {
      yarışmaId: yarışma._id,
      iştirakçılar: yarışma.iştirakçılar
    });
    
    res.json(yarışma);
  } catch (error) {
    res.status(400).json({ xəta: error.message });
  }
});

// Yarışmanı yenilə (admin/mod)
router.put('/:id', authYoxla, async (req, res) => {
  try {
    if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }
    
    const yarışma = await Yarisma.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('yaradıcı', 'istifadəçiAdı profil');
    
    if (!yarışma) {
      return res.status(404).json({ xəta: 'Yarışma tapılmadı' });
    }
    
    io.emit('yarisma-yenilendi', yarışma);
    res.json(yarışma);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Yarışmanı sil (admin)
router.delete('/:id', authYoxla, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ xəta: 'Yalnız admin silə bilər' });
    }
    
    await Yarisma.findByIdAndDelete(req.params.id);
    
    io.emit('yarisma-silindi', { yarışmaId: req.params.id });
    res.json({ mesaj: 'Yarışma silindi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Qalibləri təyin et (admin/mod)
router.post('/:id/qalibler', authYoxla, async (req, res) => {
  try {
    if (req.user.rol !== 'admin' && req.user.rol !== 'moderator') {
      return res.status(403).json({ xəta: 'İcazəniz yoxdur' });
    }
    
    const yarışma = await Yarisma.findById(req.params.id);
    
    if (!yarışma) {
      return res.status(404).json({ xəta: 'Yarışma tapılmadı' });
    }
    
    await yarışma.qalibləriTəyinEt();
    await yarışma.populate('qalibər.istifadəçi', 'istifadəçiAdı profil');
    
    // Mükafat ver
    for (const qalib of yarışma.qalibər) {
      if (!qalib.mükafatVerildi && yarışma.mükafat) {
        const user = await User.findById(qalib.istifadəçi);
        
        // Jeton ver
        if (yarışma.mükafat.jeton) {
          await user.jetonƏlavəEt(yarışma.mükafat.jeton, `🏆 ${yarışma.başlıq} - ${qalib.yer}. yer`);
        }
        
        // Badge ver
        if (yarışma.mükafat.badge) {
          if (!user.badges) user.badges = [];
          user.badges.push({
            ...yarışma.mükafat.badge,
            tarix: new Date()
          });
          await user.save();
        }
        
        // Bildiriş göndər
        if (!user.bildirişlər) user.bildirişlər = [];
        user.bildirişlər.unshift({
          növ: 'sistem',
          başlıq: '🎊 Təbriklər!',
          mesaj: `"${yarışma.başlıq}" yarışmasında ${qalib.yer}. yer tutdunuz!`,
          oxundu: false,
          tarix: new Date()
        });
        await user.save();
        
        qalib.mükafatVerildi = true;
      }
    }
    
    await yarışma.save();
    
    io.emit('yarisma-qalibler', yarışma);
    res.json(yarışma);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
