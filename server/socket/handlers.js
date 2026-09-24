import CanliYayim from '../models/CanliYayim.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('✅ İstifadəçi bağlandı:', socket.id);

    // İstifadəçi sayını göndər
    io.emit('istifadeci-sayi', io.engine.clientsCount);

    // İstifadəçini user room-a əlavə et
    socket.on('user-qosul', (userId) => {
      socket.join(`user-${userId}`);
    });

    // Canlı yayıma qoşul
    socket.on('canli-yayima-qosul', async ({ yayımId, userId }) => {
      try {
        socket.join(`yayim-${yayımId}`);
        
        const yayım = await CanliYayim.findById(yayımId);
        if (yayım && userId) {
          await yayım.izləyiciƏlavəEt(userId);
          
          // Yayımçıya bildiriş göndər
          io.to(`yayim-${yayımId}`).emit('izleyici-sayisi', {
            sayi: yayım.izləyicilər.length
          });
        }
      } catch (error) {
        console.error('Canlı yayıma qoşulma xətası:', error);
      }
    });

    // Canlı yayımdan ayrıl
    socket.on('canli-yayimdan-ayril', async ({ yayımId, userId }) => {
      try {
        socket.leave(`yayim-${yayımId}`);
        
        const yayım = await CanliYayim.findById(yayımId);
        if (yayım && userId) {
          await yayım.izləyiciSil(userId);
          
          io.to(`yayim-${yayımId}`).emit('izleyici-sayisi', {
            sayi: yayım.izləyicilər.length
          });
        }
      } catch (error) {
        console.error('Canlı yayımdan ayrılma xətası:', error);
      }
    });

    // Konuk səs/video statusunu dəyişdir
    socket.on('konuk-media-status', ({ yayımId, konukId, səsAktiv, videoAktiv }) => {
      io.to(`yayim-${yayımId}`).emit('konuk-media-deyisdi', {
        konukId,
        səsAktiv,
        videoAktiv
      });
    });

    // WebRTC signaling
    socket.on('offer', ({ yayımId, offer }) => {
      socket.to(`yayim-${yayımId}`).emit('offer', offer);
    });

    socket.on('answer', ({ yayımId, answer }) => {
      socket.to(`yayim-${yayımId}`).emit('answer', answer);
    });

    socket.on('ice-candidate', ({ yayımId, candidate }) => {
      socket.to(`yayim-${yayımId}`).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
      console.log('❌ İstifadəçi ayrıldı:', socket.id);
      io.emit('istifadeci-sayi', io.engine.clientsCount);
    });

    // Real-time yazma bildirişi
    socket.on('yazir', (data) => {
      socket.broadcast.emit('kimsə-yazir', data);
    });
  });
}
