import mongoose from 'mongoose';

const canliYayimSchema = new mongoose.Schema({
  yayımçı: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  başlıq: {
    type: String,
    required: true,
    trim: true
  },
  təsvir: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['canlı', 'bitdi', 'gözləmədə'],
    default: 'gözləmədə'
  },
  
  // Konuklar (multi-host)
  konuklar: [{
    istifadəçi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: ['gözləyir', 'qəbul', 'rədd', 'çıxdı'],
      default: 'gözləyir'
    },
    qoşulmaTarixi: { type: Date, default: Date.now },
    səsAktiv: { type: Boolean, default: true },
    videoAktiv: { type: Boolean, default: true }
  }],

  // PK (Player vs Player battle)
  pkStatus: {
    aktiv: { type: Boolean, default: false },
    rəqib: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    başlamaTarixi: Date,
    bitməTarixi: Date,
    müddət: { type: Number, default: 300 }, // 5 dəqiqə (saniyə)
    nəticə: {
      qələbəçi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      yayımçıJeton: { type: Number, default: 0 },
      rəqibJeton: { type: Number, default: 0 }
    }
  },

  // Hədiyyələr
  hədiyyələr: [{
    göndərən: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    göndərənAdı: String,
    hədiyyəId: String,
    hədiyyəAdı: String,
    qiymət: Number,
    tarix: { type: Date, default: Date.now },
    // PK zamanı hansı tərəfə göndərilib
    pkTərəfi: { 
      type: String, 
      enum: ['yayımçı', 'rəqib', null],
      default: null
    }
  }],

  izləyicilər: [{
    istifadəçi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    qoşulmaTarixi: { type: Date, default: Date.now }
  }],
  
  chat: [{
    istifadəçi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    istifadəçiAdı: String,
    mesaj: String,
    tarix: { type: Date, default: Date.now }
  }],
  
  statistika: {
    maksİzləyici: { type: Number, default: 0 },
    ümumiBaxış: { type: Number, default: 0 },
    müddət: { type: Number, default: 0 }, // dəqiqə
    ümumİJeton: { type: Number, default: 0 }, // Cəmi qazanılan jeton
    pkSayı: { type: Number, default: 0 }
  },
  
  başlamaTarixi: Date,
  bitməTarixi: Date,
  yaradılmaTarixi: {
    type: Date,
    default: Date.now
  }
});

// İzləyici əlavə et
canliYayimSchema.methods.izləyiciƏlavəEt = function(userId) {
  const artıqVar = this.izləyicilər.some(i => i.istifadəçi.toString() === userId.toString());
  
  if (!artıqVar) {
    this.izləyicilər.push({ istifadəçi: userId });
    this.statistika.ümumiBaxış += 1;
    
    if (this.izləyicilər.length > this.statistika.maksİzləyici) {
      this.statistika.maksİzləyici = this.izləyicilər.length;
    }
  }
  
  return this.save();
};

// İzləyici sil
canliYayimSchema.methods.izləyiciSil = function(userId) {
  this.izləyicilər = this.izləyicilər.filter(
    i => i.istifadəçi.toString() !== userId.toString()
  );
  return this.save();
};

// Chat mesajı əlavə et
canliYayimSchema.methods.mesajƏlavəEt = function(userId, istifadəçiAdı, mesaj) {
  this.chat.push({
    istifadəçi: userId,
    istifadəçiAdı,
    mesaj
  });
  return this.save();
};

// Konuk əlavə et
canliYayimSchema.methods.konukƏlavəEt = function(userId) {
  const artıqVar = this.konuklar.some(k => k.istifadəçi.toString() === userId.toString());
  
  if (!artıqVar) {
    this.konuklar.push({ 
      istifadəçi: userId,
      status: 'gözləyir'
    });
  }
  
  return this.save();
};

// Konuk statusunu yenilə
canliYayimSchema.methods.konukStatusYenilə = function(userId, status) {
  const konuk = this.konuklar.find(k => k.istifadəçi.toString() === userId.toString());
  if (konuk) {
    konuk.status = status;
  }
  return this.save();
};

// Hədiyyə əlavə et
canliYayimSchema.methods.hədiyyəƏlavəEt = function(göndərənId, göndərənAdı, hədiyyə, pkTərəfi = null) {
  this.hədiyyələr.push({
    göndərən: göndərənId,
    göndərənAdı,
    hədiyyəId: hədiyyə.id,
    hədiyyəAdı: hədiyyə.ad,
    qiymət: hədiyyə.qiymət,
    pkTərəfi
  });
  
  this.statistika.ümumİJeton += hədiyyə.qiymət;
  
  // PK aktivdirsə, jetonları say
  if (this.pkStatus.aktiv && pkTərəfi) {
    if (pkTərəfi === 'yayımçı') {
      this.pkStatus.nəticə.yayımçıJeton += hədiyyə.qiymət;
    } else if (pkTərəfi === 'rəqib') {
      this.pkStatus.nəticə.rəqibJeton += hədiyyə.qiymət;
    }
  }
  
  return this.save();
};

// PK başlat
canliYayimSchema.methods.pkBaşlat = function(rəqibId, müddət = 300) {
  this.pkStatus = {
    aktiv: true,
    rəqib: rəqibId,
    başlamaTarixi: new Date(),
    müddət,
    nəticə: {
      yayımçıJeton: 0,
      rəqibJeton: 0
    }
  };
  this.statistika.pkSayı += 1;
  return this.save();
};

// PK bitir
canliYayimSchema.methods.pkBitir = function() {
  if (!this.pkStatus.aktiv) return this.save();
  
  this.pkStatus.aktiv = false;
  this.pkStatus.bitməTarixi = new Date();
  
  // Qələbəçini təyin et
  if (this.pkStatus.nəticə.yayımçıJeton > this.pkStatus.nəticə.rəqibJeton) {
    this.pkStatus.nəticə.qələbəçi = this.yayımçı;
  } else if (this.pkStatus.nəticə.rəqibJeton > this.pkStatus.nəticə.yayımçıJeton) {
    this.pkStatus.nəticə.qələbəçi = this.pkStatus.rəqib;
  }
  // Bərabərdirsə qələbəçi null qalır
  
  return this.save();
};

export default mongoose.model('CanliYayim', canliYayimSchema);
