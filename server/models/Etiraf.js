import mongoose from 'mongoose';

const serhSchema = new mongoose.Schema({
  metn: {
    type: String,
    required: true,
    trim: true
  },
  tarix: {
    type: Date,
    default: Date.now
  }
});

const etirafSchema = new mongoose.Schema({
  başlıq: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  metn: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  şəkil: {
    type: String,
    default: ''
  },
  kateqoriya: {
    type: String,
    enum: ['sevgi', 'dostluq', 'iş', 'ailə', 'digər'],
    default: 'digər'
  },
  // Anonim seçimi
  anonim: {
    type: Boolean,
    default: true
  },
  // Əgər anonim deyilsə, müəllif
  müəllif: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  müəllifAdı: {
    type: String
  },
  bəyənilmələr: {
    type: Number,
    default: 0
  },
  şərhlər: [serhSchema],
  tarix: {
    type: Date,
    default: Date.now
  },
  aktiv: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('Etiraf', etirafSchema);
