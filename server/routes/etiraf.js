import express from 'express';
import Etiraf from '../models/Etiraf.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { io } from '../index.js';

const router = express.Router();

// Bütün etirafları gətir
router.get('/', async (req, res) => {
  try {
    const etiraflar = await Etiraf.find({ aktiv: true })
      .populate('müəllif', 'istifadəçiAdı profil')
      .sort({ tarix: -1 })
      .limit(50);
    res.json(etiraflar);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Tək etirafı gətir
router.get('/:id', async (req, res) => {
  try {
    const etiraf = await Etiraf.findById(req.params.id);
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }
    res.json(etiraf);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Yeni etiraf yarat
router.post('/', async (req, res) => {
  try {
    const { metn, kateqoriya, anonim, token } = req.body;
    
    if (!metn || metn.trim().length === 0) {
      return res.status(400).json({ xəta: 'Etiraf mətni boş ola bilməz' });
    }

    const etirafData = {
      metn: metn.trim(),
      kateqoriya: kateqoriya || 'digər',
      anonim: anonim !== false // default true
    };

    // Əgər anonim deyilsə və token varsa, müəllifi əlavə et
    if (!anonim && token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'etiraf-secret-key-2024');
        const user = await User.findById(decoded.userId);
        if (user) {
          etirafData.müəllif = user._id;
          etirafData.müəllifAdı = user.istifadəçiAdı;
          
          // İstifadəçi statistikası
          user.statistika.etirafSayı += 1;
          await user.save();
        }
      } catch (err) {
        // Token yoxdursa və ya səhvdirsə, anonim olaraq qəbul et
        etirafData.anonim = true;
      }
    }

    const yeniEtiraf = new Etiraf(etirafData);
    await yeniEtiraf.save();
    
    // Populate müəllif (əgər varsa)
    if (!anonim && etirafData.müəllif) {
      await yeniEtiraf.populate('müəllif', 'istifadəçiAdı profil');
    }
    
    // Real-time: Bütün clientlərə yeni etirafı göndər
    io.emit('yeni-etiraf', yeniEtiraf);
    
    res.status(201).json(yeniEtiraf);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Etirafı bəyən
router.post('/:id/beyenme', async (req, res) => {
  try {
    const etiraf = await Etiraf.findByIdAndUpdate(
      req.params.id,
      { $inc: { bəyənilmələr: 1 } },
      { new: true }
    );
    
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }

    // Real-time: Bəyənilmə yenilənməsini göndər
    io.emit('beyenme-yenilendi', { 
      etirafId: etiraf._id, 
      bəyənilmələr: etiraf.bəyənilmələr 
    });
    
    res.json(etiraf);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Şərh əlavə et
router.post('/:id/serh', async (req, res) => {
  try {
    const { metn } = req.body;
    
    if (!metn || metn.trim().length === 0) {
      return res.status(400).json({ xəta: 'Şərh mətni boş ola bilməz' });
    }

    const etiraf = await Etiraf.findById(req.params.id);
    
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }

    const yeniSerh = {
      metn: metn.trim(),
      tarix: new Date()
    };

    etiraf.şərhlər.push(yeniSerh);
    await etiraf.save();

    // Real-time: Yeni şərhi göndər
    io.emit('yeni-serh', { 
      etirafId: etiraf._id, 
      şərh: yeniSerh 
    });
    
    res.status(201).json(etiraf);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
