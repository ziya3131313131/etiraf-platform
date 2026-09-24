import User from '../models/User.js';

export async function createAdmin() {
  try {
    // Admin var mı yoxla
    const adminVar = await User.findOne({ istifadəçiAdı: 'reyllas' });
    
    if (!adminVar) {
      // İlk admin yarat
      const admin = new User({
        istifadəçiAdı: 'reyllas',
        şifrə: 'reylasbaba2019z',
        rol: 'admin',
        jeton: 999999
      });

      await admin.save();
      console.log('✅ Admin istifadəçi yaradıldı:');
      console.log('   İstifadəçi adı: reyllas');
      console.log('   Şifrə: reylasbaba2019z');
      console.log('   🎉 Admin hazırdır!');
    }
  } catch (error) {
    console.error('Admin yaradılarkən xəta:', error.message);
  }
}
