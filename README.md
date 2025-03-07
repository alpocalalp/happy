# Düşünce Eşleştirme Oyunu

Bu proje, psikolojik modları öğretmeyi amaçlayan interaktif bir çok oyunculu web oyunudur.

## Özellikler

- Çok oyunculu gerçek zamanlı oyun deneyimi
- 20 saniyelik bekleme süresi ile oyuncu eşleştirme
- Maksimum 100 oyuncu desteği
- 5 dakikalık oyun süresi
- Otomatik puan hesaplama ve liderlik tablosu
- Farklı psikolojik modları öğrenme fırsatı

## Teknolojiler

- Next.js 15.1.0
- React 19
- Socket.IO
- TypeScript
- Tailwind CSS
- Framer Motion

## Kurulum

1. Projeyi klonlayın:
\`\`\`bash
git clone [repo-url]
cd thought-matching-game
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
\`\`\`

3. Geliştirme sunucusunu başlatın:
\`\`\`bash
# Terminal 1: Socket.IO sunucusu
node server.js

# Terminal 2: Next.js uygulaması
npm run dev
\`\`\`

4. Tarayıcınızda http://localhost:3000 adresini açın

## Oyun Kuralları

1. Kullanıcı Kaydı ve Oyun Başlatma:
   - Oyuna giriş yapıldığında kurallar ekranı gösterilir
   - İsim girişi yapılır
   - 20 saniyelik bekleme süresi başlar
   - Bu süre içinde başka oyuncular katılabilir
   - Süre sonunda oyun otomatik başlar

2. Oyun Mekanikleri:
   - Her soru için belirli bir süre vardır
   - Doğru cevaplar puan kazandırır
   - En çok puanı toplayan oyuncu kazanır

3. Katılım Kuralları:
   - 20 saniyelik bekleme süresi boyunca maksimum 100 oyuncu katılabilir
   - Oyun başladıktan sonra yeni oyuncular katılamaz
   - Yeni gelen oyuncular için yeni bir oturum oluşturulur

4. Oyun Süresi:
   - Her oyun maksimum 5 dakika sürer
   - Süre bitiminde otomatik olarak sonuçlar gösterilir

## Test

Oyun mantığını test etmek için:

\`\`\`bash
node test-socket.js
\`\`\`

## Lisans

MIT 