import express from 'express';
import CanliYayim from '../models/CanliYayim.js';
import User from '../models/User.js';
import { authYoxla, jetonYoxla } from '../middleware/auth.js';
import { getHediyyeById } from '../models/Hediyye.js';
import { io } from '../index.js';

const router = express.Router();

const CANLI_YAYIM_QIYMƏT = 50; // 50 jeton

// Bütün canlı yayımları gətir
router.get('/', async (req, res) => {
  try {
    const { status = 'canlı' } = req.query;
    
    const yayımlar = await CanliYayim.find({ status })
      .populate('yayımçı', 'istifadəçiAdı profil')
      .populate('pkStatus.rəqib', 'istifadəçiAdı profil')
      .sort({ başlamaTarixi: -1 })
      .limit(20);

    res.json(yayımlar);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Tək canlı yayım
router.get('/:id', async (req, res) => {
  try {
    const yayım = await CanliYayim.findById(req.params.id)
      .populate('yayımçı', 'istifadəçiAdı profil')
      .populate('konuklar.istifadəçi', 'istifadəçiAdı profil')
      .populate('pkStatus.rəqib', 'istifadəçiAdı profil')
      .populate('izləyicilər.istifadəçi', 'istifadəçiAdı profil');

    if (!yayım) {
      return res.status(404).json({ xəta: 'Canlı yayım tapılmadı' });
    }

    res.json(yayım);
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Yeni canlı yayım başlat
router.post('/', authYoxla, jetonYoxla(CANLI_YAYIM_QIYMƏT), async (req, res) => {
  try {
    const { başlıq, təsvir, yayımURL } = req.body;

    if (!başlıq || başlıq.trim().length === 0) {
      return res.status(400).json({ xəta: 'Başlıq daxil edin' });
    }

    // Jetonu xərcə
    await req.user.jetonXərcə(CANLI_YAYIM_QIYMƏT, 'Canlı yayım başlatma');

    // Yeni yayım yarat
    const yeniYayım = new CanliYayim({
      yayımçı: req.user._id,
      başlıq: başlıq.trim(),
      təsvir: təsvir || '',
      yayımURL: yayımURL || '',
      status: 'canlı',
      başlamaTarixi: new Date()
    });

    await yeniYayım.save();
    await yeniYayım.populate('yayımçı', 'istifadəçiAdı profil');

    // İstifadəçi statistikasını yenilə
    req.user.statistika.canlıYayımSayı += 1;
    await req.user.save();

    // Socket.IO ilə bildiriş göndər
    io.emit('yeni-canli-yayim', yeniYayım);

    res.status(201).json({
      mesaj: 'Canlı yayım başladı',
      yayım: yeniYayım
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Canlı yayımı bitir
router.put('/:id/bitir', authYoxla, async (req, res) => {
  try {
    const yayım = await CanliYayim.findById(req.params.id);

    if (!yayım) {
      return res.status(404).json({ xəta: 'Canlı yayım tapılmadı' });
    }

    // Yalnız yayımçı bitirə bilər
    if (yayım.yayımçı.toString() !== req.user._id.toString() && req.user.rol !== 'admin') {
      return res.status(403).json({ xəta: 'Bu əməliyyatı yerinə yetirmək icazəniz yoxdur' });
    }

    // PK aktivdirsə bitir
    if (yayım.pkStatus.aktiv) {
      await yayım.pkBitir();
    }

    yayım.status = 'bitdi';
    yayım.bitməTarixi = new Date();
    
    // Müddəti hesabla (dəqiqə)
    const müddət = Math.floor((yayım.bitməTarixi - yayım.başlamaTarixi) / (1000 * 60));
    yayım.statistika.müddət = müddət;

    await yayım.save();

    // Socket.IO ilə bildiriş göndər
    io.emit('canli-yayim-bitdi', { yayımId: yayım._id });

    res.json({
      mesaj: 'Canlı yayım bitdi',
      yayım
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Chat mesajı göndər
router.post('/:id/chat', authYoxla, async (req, res) => {
  try {
    const { mesaj } = req.body;

    if (!mesaj || mesaj.trim().length === 0) {
      return res.status(400).json({ xəta: 'Mesaj daxil edin' });
    }

    const yayım = await CanliYayim.findById(req.params.id);

    if (!yayım) {
      return res.status(404).json({ xəta: 'Canlı yayım tapılmadı' });
    }

    if (yayım.status !== 'canlı') {
      return res.status(400).json({ xəta: 'Bu yayım artıq aktiv deyil' });
    }

    await yayım.mesajƏlavəEt(req.user._id, req.user.istifadəçiAdı, mesaj.trim());

    // Socket.IO ilə mesajı göndər
    io.to(`yayim-${yayım._id}`).emit('yeni-chat-mesaj', {
      istifadəçiAdı: req.user.istifadəçiAdı,
      mesaj: mesaj.trim(),
      tarix: new Date()
    });

    res.json({ mesaj: 'Mesaj göndərildi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Konuk əlavə et (çağırış göndər)
router.post('/:id/konuk-cagiris', authYoxla, async (req, res) => {
  try {
    const { konukId } = req.body;
    const yayım = await CanliYayim.findById(req.params.id);

    if (!yayım) {
      return res.status(404).json({ xəta: 'Yayım tapılmadı' });
    }

    // Yalnız yayımçı konuk əlavə edə bilər
    if (yayım.yayımçı.toString() !== req.user._id.toString()) {
      return res.status(403).json({ xəta: 'Yalnız yayımçı konuk əlavə edə bilər' });
    }

    await yayım.konukƏlavəEt(konukId);

    // Konuğa bildiriş göndər
    io.to(`user-${konukId}`).emit('konuk-cagiris', {
      yayımId: yayım._id,
      yayımçı: req.user.istifadəçiAdı,
      başlıq: yayım.başlıq
    });

    res.json({ mesaj: 'Konuk çağırışı göndərildi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Konuk çağırışına cavab ver
router.put('/:id/konuk-cavab', authYoxla, async (req, res) => {
  try {
    const { qəbul } = req.body; // true və ya false
    const yayım = await CanliYayim.findById(req.params.id);

    if (!yayım) {
      return res.status(404).json({ xəta: 'Yayım tapılmadı' });
    }

    const status = qəbul ? 'qəbul' : 'rədd';
    await yayım.konukStatusYenilə(req.user._id, status);

    // Yayımçıya bildiriş
    io.to(`yayim-${yayım._id}`).emit('konuk-cavab', {
      konuk: req.user.istifadəçiAdı,
      status
    });

    res.json({ mesaj: qəbul ? 'Konukluq qəbul edildi' : 'Konukluq rədd edildi' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// PK başlat
router.post('/:id/pk-baslat', authYoxla, async (req, res) => {
  try {
    const { rəqibYayımId, müddət } = req.body;
    const yayım = await CanliYayim.findById(req.params.id);
    const rəqibYayım = await CanliYayim.findById(rəqibYayımId);

    if (!yayım || !rəqibYayım) {
      return res.status(404).json({ xəta: 'Yayım tapılmadı' });
    }

    // Yalnız yayımçı PK başlada bilər
    if (yayım.yayımçı.toString() !== req.user._id.toString()) {
      return res.status(403).json({ xəta: 'Yalnız yayımçı PK başlada bilər' });
    }

    // Hər iki yayım canlı olmalıdır
    if (yayım.status !== 'canlı' || rəqibYayım.status !== 'canlı') {
      return res.status(400).json({ xəta: 'Hər iki yayım canlı olmalıdır' });
    }

    // PK başlat
    await yayım.pkBaşlat(rəqibYayım.yayımçı, müddət || 300);
    await rəqibYayım.pkBaşlat(yayım.yayımçı, müddət || 300);

    // Hər iki yayıma bildiriş
    io.to(`yayim-${yayım._id}`).emit('pk-basladi', {
      rəqib: rəqibYayım.yayımçı,
      müddət: müddət || 300
    });

    io.to(`yayim-${rəqibYayım._id}`).emit('pk-basladi', {
      rəqib: yayım.yayımçı,
      müddət: müddət || 300
    });

    res.json({ mesaj: 'PK başladı! 🔥' });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// PK bitir
router.put('/:id/pk-bitir', authYoxla, async (req, res) => {
  try {
    const yayım = await CanliYayim.findById(req.params.id)
      .populate('yayımçı', 'istifadəçiAdı')
      .populate('pkStatus.rəqib', 'istifadəçiAdı');

    if (!yayım) {
      return res.status(404).json({ xəta: 'Yayım tapılmadı' });
    }

    if (!yayım.pkStatus.aktiv) {
      return res.status(400).json({ xəta: 'Aktiv PK yoxdur' });
    }

    await yayım.pkBitir();

    // Nəticəni bildir
    io.to(`yayim-${yayım._id}`).emit('pk-bitdi', {
      nəticə: yayım.pkStatus.nəticə,
      qələbəçi: yayım.pkStatus.nəticə.qələbəçi
    });

    res.json({ 
      mesaj: 'PK bitdi!',
      nəticə: yayım.pkStatus.nəticə
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

// Hədiyyə göndər
router.post('/:id/hediyye', authYoxla, async (req, res) => {
  try {
    const { hədiyyəId, pkTərəfi } = req.body; // pkTərəfi: 'yayımçı' və ya 'rəqib'
    
    const hədiyyə = getHediyyeById(hədiyyəId);
    if (!hədiyyə) {
      return res.status(404).json({ xəta: 'Hədiyyə tapılmadı' });
    }

    // Jeton yoxla
    if (req.user.jeton < hədiyyə.qiymət) {
      return res.status(403).json({ 
        xəta: 'Kifayət qədər jetonunuz yoxdur',
        lazım: hədiyyə.qiymət,
        mövcud: req.user.jeton
      });
    }

    const yayım = await CanliYayim.findById(req.params.id);
    if (!yayım) {
      return res.status(404).json({ xəta: 'Yayım tapılmadı' });
    }

    // Jetonu xərcə
    await req.user.jetonXərcə(hədiyyə.qiymət, `${hədiyyə.ad} hədiyyəsi`);

    // Hədiyyəni əlavə et
    await yayım.hədiyyəƏlavəEt(
      req.user._id,
      req.user.istifadəçiAdı,
      hədiyyə,
      pkTərəfi
    );

    // Real-time hədiyyə animasiyası
    io.to(`yayim-${yayım._id}`).emit('yeni-hediyye', {
      göndərən: req.user.istifadəçiAdı,
      hədiyyə,
      pkTərəfi,
      pkStatus: yayım.pkStatus.aktiv ? {
        yayımçıJeton: yayım.pkStatus.nəticə.yayımçıJeton,
        rəqibJeton: yayım.pkStatus.nəticə.rəqibJeton
      } : null
    });

    res.json({ 
      mesaj: 'Hədiyyə göndərildi! 🎁',
      qalanjeton: req.user.jeton
    });
  } catch (error) {
    res.status(500).json({ xəta: error.message });
  }
});

export default router;
