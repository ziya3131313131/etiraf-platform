import mongoose from 'mongoose';

const destekSchema = new mongoose.Schema({
  istifadəçi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  istifadəçiAdı: {
    type: String,
    required: true
  },
  mövzu: {
    type: String,
    required: true,
    enum: ['texniki', 'şikayət', 'təklif', 'hesab', 'digər'],
    default: 'digər'
  },
  başlıq: {
    type: String,
    required: true,
    trim: true
  },
  mətn: {
    type: String,
    required: true,
    trim: true
  },
  // Əgər etiraf şikayətidirsə
  əlaqəliEtiraf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etiraf'
  },
  status: {
    type: String,
    enum: ['açıq', 'baxılır', 'həll olundu', 'bağlandı'],
    default: 'açıq'
  },
  cavablar: [{
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminAdı: String,
    mətn: String,
    tarix: { type: Date, default: Date.now }
  }],
  prioritet: {
    type: String,
    enum: ['aşağı', 'orta', 'yüksək', 'təcili'],
    default: 'orta'
  },
  yaradılmaTarixi: {
    type: Date,
    default: Date.now
  },
  yenilənməTarixi: {
    type: Date,
    default: Date.now
  }
});

// Cavab əlavə et
destekSchema.methods.cavabƏlavəEt = function(adminId, adminAdı, mətn) {
  this.cavablar.push({
    admin: adminId,
    adminAdı,
    mətn
  });
  this.yenilənməTarixi = new Date();
  return this.save();
};

// Status dəyişdir
destekSchema.methods.statusDəyişdir = function(yeniStatus) {
  this.status = yeniStatus;
  this.yenilənməTarixi = new Date();
  return this.save();
};

export default mongoose.model('Destek', destekSchema);
