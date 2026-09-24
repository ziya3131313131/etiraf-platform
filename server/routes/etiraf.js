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
    const { başlıq, metn, anonim, token } = req.body;
    
    if (!başlıq || başlıq.trim().length === 0) {
      return res.status(400).json({ xəta: 'Başlıq boş ola bilməz' });
    }

    if (!metn || metn.trim().length === 0) {
      return res.status(400).json({ xəta: 'Etiraf mətni boş ola bilməz' });
    }

    const etirafData = {
      başlıq: başlıq.trim(),
      metn: metn.trim(),
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
          
          // Fəaliyyət əlavə et
          if (!user.fəaliyyətlər) user.fəaliyyətlər = [];
          user.fəaliyyətlər.unshift({
            növ: 'etiraf',
            təsvir: `💭 Yeni etiraf paylaşdı: "${başlıq}"`,
            tarix: new Date()
          });
          if (user.fəaliyyətlər.length > 100) {
            user.fəaliyyətlər = user.fəaliyyətlər.slice(0, 100);
          }
          
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
    const { token } = req.body;
    const etiraf = await Etiraf.findByIdAndUpdate(
      req.params.id,
      { $inc: { bəyənilmələr: 1 } },
      { new: true }
    );
    
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }

    // Bəyənən istifadəçini tap
    let beğenenAdı = 'Anonim';
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'etiraf-secret-key-2024');
        const beğenen = await User.findById(decoded.userId);
        if (beğenen) {
          beğenenAdı = beğenen.istifadəçiAdı;
          
          // Fəaliyyət əlavə et
          if (!beğenen.fəaliyyətlər) beğenen.fəaliyyətlər = [];
          beğenen.fəaliyyətlər.unshift({
            növ: 'beğenme',
            təsvir: `❤️ "${etiraf.başlıq}" etirafını bəyəndi`,
            link: `/etiraf/${etiraf._id}`,
            tarix: new Date()
          });
          
          // Son 100 fəaliyyəti saxla
          if (beğenen.fəaliyyətlər.length > 100) {
            beğenen.fəaliyyətlər = beğenen.fəaliyyətlər.slice(0, 100);
          }
          
          await beğenen.save();
        }
      } catch (err) {
        console.error('Token xətası:', err);
      }
    }

    // Etiraf müəllifinə bildiriş göndər
    if (etiraf.müəllif && !etiraf.anonim) {
      const müəllif = await User.findById(etiraf.müəllif);
      if (müəllif) {
        // Statistika yenilə
        müəllif.statistika.bəyənilmələr = (müəllif.statistika.bəyənilmələr || 0) + 1;
        
        // Bildiriş əlavə et
        if (!müəllif.bildirişlər) müəllif.bildirişlər = [];
        müəllif.bildirişlər.unshift({
          növ: 'beğenme',
          başlıq: '❤️ Yeni Bəyənmə',
          mesaj: `${beğenenAdı} etirafını bəyəndi: "${etiraf.başlıq}"`,
          link: `/etiraf/${etiraf._id}`,
          oxundu: false,
          tarix: new Date()
        });
        
        // Son 50 bildirişi saxla
        if (müəllif.bildirişlər.length > 50) {
          müəllif.bildirişlər = müəllif.bildirişlər.slice(0, 50);
        }
        
        await müəllif.save();
        
        // Real-time bildiriş
        io.to(`user-${müəllif._id}`).emit('yeni-bildiris', müəllif.bildirişlər[0]);
      }
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
    const { metn, token } = req.body;
    
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

    let şərhçiAdı = 'Anonim';

    // Token varsa, müəllif məlumatlarını əlavə et
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'etiraf-secret-key-2024');
        const user = await User.findById(decoded.userId);
        if (user) {
          yeniSerh.müəllif = user._id;
          yeniSerh.müəllifAdı = user.istifadəçiAdı;
          şərhçiAdı = user.istifadəçiAdı;
          
          // İstifadəçi statistikası
          user.statistika.şərhSayı += 1;
          
          // Fəaliyyət əlavə et
          if (!user.fəaliyyətlər) user.fəaliyyətlər = [];
          user.fəaliyyətlər.unshift({
            növ: 'şerh',
            təsvir: `💬 "${etiraf.başlıq}" etirafına şərh yazdı`,
            link: `/etiraf/${etiraf._id}`,
            tarix: new Date()
          });
          if (user.fəaliyyətlər.length > 100) {
            user.fəaliyyətlər = user.fəaliyyətlər.slice(0, 100);
          }
          
          await user.save();
        }
      } catch (err) {
        // Token səhvdirsə, anonim olaraq qəbul et
      }
    }

    etiraf.şərhlər.push(yeniSerh);
    await etiraf.save();
    
    // Müəllif məlumatını populate et
    await etiraf.populate('şərhlər.müəllif', 'istifadəçiAdı profil');

    // Etiraf müəllifinə bildiriş göndər
    if (etiraf.müəllif && !etiraf.anonim) {
      const müəllif = await User.findById(etiraf.müəllif);
      if (müəllif) {
        // Bildiriş əlavə et
        if (!müəllif.bildirişlər) müəllif.bildirişlər = [];
        müəllif.bildirişlər.unshift({
          növ: 'şerh',
          başlıq: '💬 Yeni Şərh',
          mesaj: `${şərhçiAdı} etirafına şərh yazdı: "${etiraf.başlıq}"`,
          link: `/etiraf/${etiraf._id}`,
          oxundu: false,
          tarix: new Date()
        });
        
        if (müəllif.bildirişlər.length > 50) {
          müəllif.bildirişlər = müəllif.bildirişlər.slice(0, 50);
        }
        
        await müəllif.save();
        
        // Real-time bildiriş
        io.to(`user-${müəllif._id}`).emit('yeni-bildiris', müəllif.bildirişlər[0]);
      }
    }

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

// Etirafı sil (istifadəçi öz etirafını, admin/moderator hamsını)
router.delete('/:id', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ xəta: 'Giriş tələb olunur' });
    }

    // Token-dan istifadəçini tap
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'etiraf-secret-key-2024');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ xəta: 'İstifadəçi tapılmadı' });
    }

    const etiraf = await Etiraf.findById(req.params.id);
    
    if (!etiraf) {
      return res.status(404).json({ xəta: 'Etiraf tapılmadı' });
    }

    // Yoxla: admin/moderator və ya öz etirafı
    const isAdminOrModerator = user.rol === 'admin' || user.rol === 'moderator';
    const isOwner = etiraf.müəllif && etiraf.müəllif.toString() === user._id.toString();
    
    if (!isAdminOrModerator && !isOwner) {
      return res.status(403).json({ xəta: 'Silmə icazəniz yoxdur' });
    }

    // Etirafı sil
    await Etiraf.findByIdAndDelete(req.params.id);
    
    // Real-time: Silinməni bildir
    io.emit('etiraf-silindi', { etirafId: req.params.id });
    
    res.json({ mesaj: 'Etiraf silindi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
