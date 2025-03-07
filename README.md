# Düşünce Eşleştirme Oyunu

Çok oyunculu bir düşünce eşleştirme oyunu. Oyuncular farklı düşünce modlarını doğru şekilde eşleştirmeye çalışırlar.

## Özellikler

- Çok oyunculu destek (maksimum 100 oyuncu)
- 20 saniyelik bekleme süresi
- 5 dakikalık oyun süresi
- Gerçek zamanlı skor takibi
- Otomatik oyun başlatma
- Liderlik tablosu

## Oyun Kuralları

1. Oyuncu isim girerek oyuna katılır
2. İlk oyuncu katıldığında 20 saniyelik bekleme süresi başlar
3. Bu süre içinde başka oyuncular da katılabilir
4. 20 saniye sonunda oyun otomatik olarak başlar
5. Oyun maksimum 5 dakika sürer
6. En çok doğru cevabı veren oyuncu kazanır
7. Oyun başladıktan sonra yeni oyuncu katılamaz

## Teknik Özellikler

- Next.js 15.1.0
- Socket.IO
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion

## Kurulum

1. Repoyu klonlayın:
```bash
git clone [repo-url]
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
# Terminal 1: Socket.IO sunucusu
node server.js

# Terminal 2: Next.js uygulaması
npm run dev
```

4. Tarayıcıda açın:
```
http://localhost:3000
```

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Test

Socket.IO olaylarını test etmek için:

```bash
node test-socket.js
```

## Dağıtım

1. Projeyi derleyin:
```bash
npm run build
```

2. Sunucuyu başlatın:
```bash
node server.js
npm start
```

## Lisans

MIT 