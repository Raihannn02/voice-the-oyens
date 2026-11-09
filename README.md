# 🐱 Voice The Oyens — Discord Alternative (Voice, Screen Share & Chat)

Aplikasi Web Real-Time seperti Discord bertema **The Oyens** untuk Voice Channels (suara), HD Screen Sharing (berbagi layar), dan Text Chat (pesan langsung) dengan arsitektur **Serverless P2P WebRTC**.

Dibuat khusus agar dapat **langsung di-deploy ke Vercel** tanpa memerlukan server backend terpisah!

---

## ✨ Fitur Utama

- 🎙️ **Voice Channel (P2P WebRTC)**:
  - Suara jernih berkecepatan tinggi dengan latensi sangat rendah.
  - **Speaking Ring**: Indikator cincin hijau menyala otomatis di avatar saat Anda berbicara (menggunakan Web Audio API `AudioContext` & `AnalyserNode`).
  - Kontrol suara lengkap: **Mute / Unmute** & **Deafen**.
  - Kontrol volume per-peserta saat hover di kartu peserta.
  - Sound effect sintetis (Join, Leave, Mute, Deafen, New Message) langsung dari browser tanpa file aset eksternal.

- 🖥️ **HD Screen Sharing (Bagi Layar)**:
  - Berbagi layar, tab browser, atau jendela aplikasi dengan satu klik.
  - Mendukung audio sistem saat share screen.
  - Tampilan **Spotlight Mode**: Layar tampil besar di tengah dengan filmstrip peserta di bawah.
  - Dukungan Fullscreen, Multi-stream selector jika lebih dari 1 peserta berbagi layar.

- 💬 **Real-Time Text Chat**:
  - Chat room real-time via DataChannel.
  - Dukungan pengiriman teks, gambar, dan emoji popover.
  - Timestamp dan avatar khas Oyen.
  - Panel chat bisa di-collapse (sembunyikan) agar stage layar lebih lega.

- 🐱 **Kustomisasi & Persona Oyen**:
  - Beragam persona kucing oyen (*Oyen Barbar, Oyen Belang, Oyen Cool, Oyen Bucin, Oyen Koding, dll.*).
  - Ganti display name dan avatar kapan saja via menu Pengaturan (ikon gear).
  - Uji mikrofon langsung dengan visualizer bar di menu pengaturan.

- 🔗 **Link Undangan Otomatis**:
  - Klik tombol share di sidebar atas untuk menyalin link room (contoh: `https://.../?room=ruang-mabar`).
  - Siapa pun yang membuka link tersebut akan langsung bergabung ke Voice, Screen Share, dan Chat yang sama!

---

## 🚀 Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke direktori
cd "Voice The Oyens"

# 2. Jalankan development server
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`) di browser Anda.
*Tips: Anda dapat membuka dua tab browser berbeda atau jendela Incognito untuk menguji panggilan suara & share screen antar dua peserta.*

---

## 🌐 Cara Deploy ke Vercel

Aplikasi ini sudah dilengkapi dengan file `vercel.json` dan struktur Vite standar sehingga siap dideploy ke Vercel dalam hitungan detik:

### Opsi 1: Lewat Vercel CLI
```bash
# Install vercel CLI (jika belum ada)
npm i -g vercel

# Deploy ke Vercel
vercel
```

### Opsi 2: Lewat Dashboard Vercel (GitHub/GitLab)
1. Push project ini ke repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: Voice The Oyens initial release"
   git branch -M main
   git remote add origin https://github.com/USERNAME/voice-the-oyens.git
   git push -u origin main
   ```
2. Buka [Vercel Dashboard](https://vercel.com) -> Klik **"Add New Project"**.
3. Pilih repository GitHub Anda.
4. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik **Deploy**! Website Anda sudah online dan dapat langsung digunakan bersama teman-teman!
