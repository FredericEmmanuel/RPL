# Checklist MVP StudyBuddy

- [x] Autentikasi dan profil: pendaftaran, normalisasi email, hash kata sandi, login, dan pembaruan profil melalui API terautentikasi menggunakan kontrak `@studybuddy/shared`. (unit test: PASSED)
- [x] Eksplorasi sesi: filter mata pelajaran, lokasi, dan pencarian; hasil kosong dan loading ditampilkan di UI. (unit test: PASSED)
- [x] Manajemen sesi: buat, lihat, ubah, dan hapus sesi; pemeriksaan pemilik, waktu mulai di masa depan, kapasitas, serta pencegahan peserta duplikat. (unit test: PASSED)
- [x] Ruang obrolan grup: hanya peserta yang dapat membaca/mengirim pesan; validasi isi pesan dan HTTP polling setiap lima detik. (unit test: PASSED)
- [x] Dashboard jadwal: daftar sesi yang dibuat atau diikuti dimuat dari endpoint khusus dan menunjukkan status jadwal. (unit test: PASSED)

## Bukti validasi

- `npm test` — 12 unit test service API lulus.
- `npm run build` — build TypeScript paket shared, API, dan frontend lulus.
- `npm run db:migrate` — skema Prisma tersinkron dengan PostgreSQL lokal.
- PostgreSQL API smoke test — 18 pemeriksaan alur autentikasi, profil, eksplorasi, sesi,
  kapasitas, peserta, dan obrolan lulus.
- Ikuti skenario demonstrasi di [HowToRun.md](./HowToRun.md) untuk menjalankan alur UI lengkap dengan database.
