import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  istifadəçiAdı: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  şifrə: {
    type: String,
    required: true,
    minlength: 3
  },
  rol: {
    type: String,
    enum: ['admin', 'moderator', 'istifadəçi'],
    default: 'istifadəçi'
  },
  jeton: {
    type: Number,
    default: 0
  },
  jetonTarixçəsi: [{
    miqdar: Number,
    növ: { type: String, enum: ['əlavə', 'xərc'] },
    səbəb: String,
    tarix: { type: Date, default: Date.now }
  }],
  profil: {
    avatar: { type: String, default: '' },
    avatarType: { type: String, enum: ['image', 'gif'], default: 'image' },
    banner: { type: String, default: '' }, // Discord-style banner
    bio: { type: String, default: '', maxlength: 500 },
    haqqında: { type: String, default: '', maxlength: 1000 },
    statusMesaj: { type: String, default: '🎭', maxlength: 100 },
    spotify: { type: String, default: '' }, // Spotify profil linki
    rəng: { type: String, default: '#6366f1' } // Profil rəngi
  },
  badges: [{
    ad: String,
    emoji: String,
    şəkil: String, // GIF və ya foto URL
    rəng: String,
    tarix: { type: Date, default: Date.now }
  }],
  achievements: [{
    id: String,
    ad: String,
    təsvir: String,
    emoji: String,
    unlockTarixi: { type: Date, default: Date.now }
  }],
  parametrlər: {
    darkMode: { type: Boolean, default: false },
    dil: { type: String, default: 'az', enum: ['az', 'en', 'tr'] },
    bildirişlər: { type: Boolean, default: true },
    səsEffektləri: { type: Boolean, default: true },
    xüsusiRəng: { type: String, default: '#6366f1' },
    tema: { type: String, default: 'default', enum: ['default', 'ocean', 'sunset', 'forest', 'galaxy'] }
  },
  bildirişlər: [{
    növ: { type: String, enum: ['beğenme', 'şerh', 'badge', 'achievement', 'hediyye', 'mesaj', 'sistem'] },
    başlıq: String,
    mesaj: String,
    link: String,
    oxundu: { type: Boolean, default: false },
    tarix: { type: Date, default: Date.now }
  }],
  fəaliyyətlər: [{
    növ: { type: String, enum: ['etiraf', 'şerh', 'beğenme', 'canli', 'hediyye', 'pk', 'badge', 'achievement'] },
    təsvir: String,
    link: String,
    tarix: { type: Date, default: Date.now }
  }],
  statistika: {
    etirafSayı: { type: Number, default: 0 },
    şərhSayı: { type: Number, default: 0 },
    bəyənilmələr: { type: Number, default: 0 },
    canlıYayımSayı: { type: Number, default: 0 }
  },
  aktiv: {
    type: Boolean,
    default: true
  },
  sonGiriş: {
    type: Date,
    default: Date.now
  },
  qeydiyyatTarixi: {
    type: Date,
    default: Date.now
  }
});

// Şifrəni hash-lə
userSchema.pre('save', async function(next) {
  if (!this.isModified('şifrə')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.şifrə = await bcrypt.hash(this.şifrə, salt);
  next();
});

// Şifrəni yoxla
userSchema.methods.şifrəYoxla = async function(şifrə) {
  return await bcrypt.compare(şifrə, this.şifrə);
};

// Jeton əlavə et
userSchema.methods.jetonƏlavəEt = function(miqdar, səbəb = 'Admin tərəfindən') {
  this.jeton += miqdar;
  this.jetonTarixçəsi.push({
    miqdar,
    növ: 'əlavə',
    səbəb
  });
  return this.save();
};

// Jeton xərcə
userSchema.methods.jetonXərcə = function(miqdar, səbəb = 'Xidmət') {
  if (this.jeton < miqdar) {
    throw new Error('Kifayət qədər jeton yoxdur');
  }
  this.jeton -= miqdar;
  this.jetonTarixçəsi.push({
    miqdar: -miqdar,
    növ: 'xərc',
    səbəb
  });
  return this.save();
};

export default mongoose.model('User', userSchema);
