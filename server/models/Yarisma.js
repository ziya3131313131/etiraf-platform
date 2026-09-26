import mongoose from 'mongoose';

const yarışmaSchema = new mongoose.Schema({
  başlıq: {
    type: String,
    required: true,
    trim: true
  },
  təsvir: {
    type: String,
    required: true
  },
  şəkil: {
    type: String,
    default: ''
  },
  növ: {
    type: String,
    enum: ['etiraf', 'foto', 'video', 'yaradıcılıq', 'digər'],
    default: 'etiraf'
  },
  mükafat: {
    növ: {
      type: String,
      enum: ['jeton', 'badge', 'xüsusi'],
      default: 'jeton'
    },
    miqdar: {
      type: Number,
      default: 100
    },
    badge: { 
      ad: String,
      şəkil: String,
      rəng: String
    },
    xüsusi: String
  },
  başlama: {
    type: Date
  },
  bitmə: {
    type: Date
  },
  status: {
    type: String,
    enum: ['gələcək', 'aktiv', 'bitmiş', 'ləğv'],
    default: 'gələcək'
  },
  qaydalar: [{
    type: String
  }],
  iştirakçılar: [{
    istifadəçi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    iş: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'iştirakçılar.işNövü'
    },
    işNövü: {
      type: String,
      enum: ['Etiraf', 'CanliYayim']
    },
    qeydiyyatTarixi: {
      type: Date,
      default: Date.now
    }
  }],
  səslər: [{
    istifadəçi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    iştirakçı: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tarix: {
      type: Date,
      default: Date.now
    }
  }],
  qalib: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parametrlər: {
    səsLimiti: { type: Number, default: 1 },
    minimumIştirakçı: { type: Number, default: 3 },
    maksimumIştirakçı: { type: Number, default: 100 },
    avtomatikQalib: { type: Boolean, default: true }
  },
  yaradıcı: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  yaradılmaTarixi: {
    type: Date,
    default: Date.now
  }
});

// Virtual field - səs sayını hesabla
yarışmaSchema.virtual('səsSayı').get(function() {
  return this.səslər.length;
});

// Status-u avtomatik yenilə
yarışmaSchema.methods.statusYenilə = function() {
  const indi = new Date();
  
  if (this.başlama && this.bitmə) {
    if (indi < this.başlama) {
      this.status = 'gələcək';
    } else if (indi >= this.başlama && indi <= this.bitmə) {
      this.status = 'aktiv';
    } else if (indi > this.bitmə) {
      this.status = 'bitmiş';
    }
  }
  
  return this.save();
};

// Səs ver
yarışmaSchema.methods.səsVer = async function(istifadəçiId, iştirakçıId) {
  // Yoxla ki, artıq səs veribmi
  const səsVerib = this.səslər.some(
    s => s.istifadəçi.toString() === istifadəçiId.toString() && 
         s.iştirakçı.toString() === iştirakçıId.toString()
  );
  
  if (səsVerib) {
    throw new Error('Artıq bu iştirakçıya səs vermisiniz');
  }
  
  // Yoxla ki, status aktiv olsun
  if (this.status !== 'aktiv') {
    throw new Error('Yarışma aktiv deyil');
  }
  
  // İştirakçını yoxla
  const iştirakçıVar = this.iştirakçılar.some(
    i => i.istifadəçi.toString() === iştirakçıId.toString()
  );
  
  if (!iştirakçıVar) {
    throw new Error('İştirakçı tapılmadı');
  }
  
  // Səs əlavə et
  this.səslər.push({
    istifadəçi: istifadəçiId,
    iştirakçı: iştirakçıId,
    tarix: new Date()
  });
  
  return this.save();
};

// Qatıl
yarışmaSchema.methods.qatıl = async function(istifadəçiId, işId, işNövü) {
  // Yoxla ki, artıq qatılıbmı
  const qatılıb = this.iştirakçılar.some(
    i => i.istifadəçi.toString() === istifadəçiId.toString()
  );
  
  if (qatılıb) {
    throw new Error('Artıq qatılmısınız');
  }
  
  // Yoxla ki, maksimum iştirakçı sayı keçilməsin
  if (this.iştirakçılar.length >= this.parametrlər.maksimumIştirakçı) {
    throw new Error('Maksimum iştirakçı sayına çatılıb');
  }
  
  // Qatıl
  this.iştirakçılar.push({
    istifadəçi: istifadəçiId,
    iş: işId,
    işNövü: işNövü,
    qeydiyyatTarixi: new Date()
  });
  
  return this.save();
};

export default mongoose.model('Yarisma', yarışmaSchema);
