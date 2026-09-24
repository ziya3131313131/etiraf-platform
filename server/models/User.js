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
    bio: { type: String, default: '', maxlength: 500 }
  },
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
