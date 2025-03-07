const { io } = require("socket.io-client");

// Test için üç farklı oyuncu bağlantısı oluşturacağız
const socket1 = io("http://localhost:3001", {
  transports: ["websocket"],
});

const socket2 = io("http://localhost:3001", {
  transports: ["websocket"],
});

const socket3 = io("http://localhost:3001", {
  transports: ["websocket"],
});

// Event dinleyicileri için yardımcı fonksiyon
const listenToEvents = (socket, playerName) => {
  socket.on("connect", () => {
    console.log(`${playerName} bağlandı. Socket ID: ${socket.id}`);
  });

  socket.on("players_updated", (players) => {
    console.log(`${playerName} - Oyuncular güncellendi:`, players);
  });

  socket.on("countdown_update", (seconds) => {
    console.log(`${playerName} - Geri sayım: ${seconds} saniye`);
  });

  socket.on("game_start", (data) => {
    console.log(`${playerName} - Oyun başladı!`, data);
  });

  socket.on("game_timer", (seconds) => {
    console.log(`${playerName} - Kalan süre: ${seconds} saniye`);
  });

  socket.on("game_finished", (leaderboard) => {
    console.log(`${playerName} - Oyun bitti! Liderlik tablosu:`, leaderboard);
  });

  socket.on("error", (error) => {
    console.error(`${playerName} - Hata:`, error);
  });
};

// Her üç oyuncu için event dinleyicilerini ayarla
listenToEvents(socket1, "Oyuncu 1");
listenToEvents(socket2, "Oyuncu 2");
listenToEvents(socket3, "Oyuncu 3");

// Test senaryosu
const runTest = async () => {
  try {
    // 1. İlk oyuncu katılıyor ve 20 saniyelik bekleme başlıyor
    console.log("\n1. Test: İlk oyuncu katılıyor");
    socket1.emit("join_game", { playerName: "Oyuncu 1" });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. İkinci oyuncu katılıyor
    console.log("\n2. Test: İkinci oyuncu katılıyor");
    socket2.emit("join_game", { playerName: "Oyuncu 2" });
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 3. Oyun başladıktan sonra cevaplar gönderiliyor
    console.log("\n3. Test: Cevaplar gönderiliyor");
    socket1.emit("submit_answer", {
      answer: { isCorrect: true },
      timeElapsed: 5000
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    socket2.emit("submit_answer", {
      answer: { isCorrect: false },
      timeElapsed: 6000
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Üçüncü oyuncu oyun başladıktan sonra katılmaya çalışıyor
    console.log("\n4. Test: Üçüncü oyuncu aktif oyuna katılmaya çalışıyor");
    socket3.emit("join_game", { playerName: "Oyuncu 3" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Bir süre bekleyip bağlantıyı kesiyoruz
    console.log("\n5. Test: Bağlantı kesiliyor");
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();

  } catch (error) {
    console.error("Test sırasında hata oluştu:", error);
  }
};

// Testleri çalıştır
console.log("Socket.IO Event Testleri Başlıyor...");
runTest(); 