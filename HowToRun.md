# Menjalankan StudyBuddy

## Persyaratan

- Node.js 20 atau lebih baru dan npm.
- Docker dengan Docker Compose, atau PostgreSQL 14+.

## Persiapan dari awal

1. Masuk ke direktori proyek dan instal dependensi:

   ```bash
   npm install
   ```

2. Buat berkas environment lokal:

   ```bash
   cp .env.example .env
   ```

   Atur `JWT_SECRET` menjadi nilai acak yang panjang dan rahasia. `DATABASE_URL`,
   `API_PORT`, `WEB_ORIGIN`, serta `VITE_API_URL` pada contoh sudah sesuai untuk setup lokal.

3. Jalankan PostgreSQL dengan Docker:

   ```bash
   docker compose up -d database
   ```

   Tunggu sampai container `studybuddy-database` berstatus `healthy`.

4. Buat tabel database dan data demo:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Jalankan API dan frontend:

   ```bash
   npm run dev
   ```

   Buka frontend di <http://localhost:5173>. API tersedia di
   <http://localhost:3001/api>; periksa <http://localhost:3001/api/health> untuk
   memastikan API aktif.

## Akun demo

Seed membuat akun berikut dengan kata sandi `belajar123`:

| Email | Kata sandi |
| --- | --- |
| `alya@studybuddy.id` | `belajar123` |
| `bima@studybuddy.id` | `belajar123` |
| `citra@studybuddy.id` | `belajar123` |

Akun dan kata sandi ini hanya untuk demonstrasi lokal. Jangan gunakan di lingkungan publik.

## Demo

[Link Demo](https://app.guidde.com/share/playbooks/tq8ViCL8ig4UAtNe85LWhU?origin=dJXHPxrU93f86BQ6OlrDEBBsB8N2&mode=videoAndDoc)

## Pengujian dan utilitas

Jalankan dari root monorepo:

```bash
npm test
npm run build
npm run db:studio
docker compose down
```

`npm test` menjalankan unit test service API tanpa koneksi database. Build mengompilasi paket
`@studybuddy/shared`, API, dan frontend. `docker compose down` menghentikan database tanpa
menghapus volume datanya.
