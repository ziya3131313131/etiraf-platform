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
    jeton: { type: Number, default: 0 },
    badge: { 
      ad: String,
      şəkil: String,
      rəng: String
    },
    xüsusi: String // Xüsusi mükafat təsviri
  },
  başlanğıcTarixi: {
    type: Date,
    required: true
  },
  bitişTarixi: {
    type: Date,
    required: true
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
    },
    səslər: {
      type: Number,
      default: 0
    }
  }],
  qalibər: [{
    yer: Number, // 1, 2, 3
    istifadəçi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mükafatVerildi: {
      type: Boolean,
      default: false
    }
  }],
  səsVerənlər: [{
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
  parametrlər: {
    səsLimiti: { type: Number, default: 1 }, // Hər istifadəçi neçə səs verə bilər
    minimumIştirakçı: { type: Number, default: 3 },
    maksimumIştirakçı: { type: Number, default: 100 },
    avtomatikQalib: { type: Boolean, default: true } // Bitdikdə avtomatik qalib elan et
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

// Status-u avtomatik yenilə
yarışmaSchema.methods.statusYenilə = function() {
  const indi = new Date();
  
  if (indi < this.başlanğıcTarixi) {
    this.status = 'gələcək';
  } else if (indi >= this.başlanğıcTarixi && indi <= this.bitişTarixi) {
    this.status = 'aktiv';
  } else if (indi > this.bitişTarixi) {
    this.status = 'bitmiş';
    
    // Avtomatik qalib elan et
    if (this.parametrlər.avtomatikQalib && this.qalibər.length === 0) {
      this.qalibləriTəyinEt();
    }
  }
  
  return this.save();
};

// Qalibləri təyin et
yarişmaSchema.methods.qalibləriTəyinEt = function() {
  // Səslərə görə sırala
  const sıralanmış = this.iştirakçılar
    .sort((a, b) => b.səslər - a.səslər)
    .slice(0, 3);
  
  this.qalibər = sıralanmış.map((iştirakçı, index) => ({
    yer: index + 1,
    istifadəçi: iştirakçı.istifadəçi,
    mükafatVerildi: false
  }));
  
  return this.save();
};

// Səs ver
yarişmaSchema.methods.səsVer = async function(istifadəçiId, iştirakçıId) {
  // Yoxla ki, artıq səs veribmi
  const səsVerib = this.səsVerənlər.some(
    s => s.istifadəçi.toString() === istifadəçiId.toString()
  );
  
  if (səsVerib) {
    throw new Error('Artıq səs vermisiniz');
  }
  
  // Yoxla ki, status aktiv olsun
  if (this.status !== 'aktiv') {
    throw new Error('Yarışma aktiv deyil');
  }
  
  // İştirakçını tap
  const iştirakçı = this.iştirakçılar.find(
    i => i.istifadəçi.toString() === iştirakçıId.toString()
  );
  
  if (!iştirakçı) {
    throw new Error('İştirakçı tapılmadı');
  }
  
  // Səs əlavə et
  iştirakçı.səslər += 1;
  
  this.səsVerənlər.push({
    istifadəçi: istifadəçiId,
    iştirakçı: iştirakçıId,
    tarix: new Date()
  });
  
  return this.save();
};

export default mongoose.model('Yarisma', yarişmaSchema);
