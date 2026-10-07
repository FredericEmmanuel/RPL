# StudyBuddy

StudyBuddy adalah aplikasi web responsif untuk membantu siswa dan mahasiswa menemukan teman
belajar atau membentuk kelompok berdasarkan mata pelajaran, jadwal, dan lokasi. Antarmuka dan
pesan aplikasi menggunakan Bahasa Indonesia.

## Fitur

- Pendaftaran dan masuk menggunakan email serta kata sandi lokal.
- Profil berisi nama, sekolah/kampus, mata pelajaran favorit, dan area pilihan.
- Dasbor jadwal untuk sesi yang dibuat atau diikuti.
- Pencarian sesi berdasarkan mata pelajaran dan area/lokasi.
- Buat, lihat, ubah, dan hapus sesi; hanya pembuat sesi yang dapat mengubah atau menghapusnya.
- Bergabung ke sesi dengan pencegahan peserta ganda dan pemeriksaan kapasitas.
- Obrolan teks anggota sesi dengan pembaruan otomatis setiap lima detik.
- Paket `@studybuddy/shared` sebagai satu-satunya sumber tipe domain dan DTO untuk frontend
  serta backend.

## Teknologi dan Struktur

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router.
- Backend: Node.js, TypeScript, Express, REST API.
- Data: PostgreSQL, Prisma ORM, Prisma migrations.
- Monorepo: npm workspaces.

```text
apps/
  api/       Express API, Prisma schema/migrations, dan seed
  web/       Aplikasi React
packages/
  shared/    Model domain, enum, DTO, serta konstanta bersama
docker-compose.yml
.env.example
```

API memetakan entitas Prisma ke model dari `@studybuddy/shared`; frontend tidak bergantung pada
Prisma. Kata sandi disimpan sebagai hash bcrypt. Endpoint selain pendaftaran dan masuk memerlukan
token bearer. Hanya anggota sesi yang bisa membaca atau mengirim pesan. Data profil publik dan
detail sesi dapat dilihat setelah masuk.

## Persyaratan

- Node.js 20 atau lebih baru dan npm.
- Docker dengan plugin Docker Compose, atau PostgreSQL 14 atau lebih baru.

## Menyiapkan Database dan Environment

Salin `.env.example` menjadi `.env` di root proyek. Sesuaikan `JWT_SECRET` dengan nilai acak
yang panjang sebelum menjalankan aplikasi. Nilai URL database contoh cocok dengan konfigurasi
Docker Compose.

Jalankan PostgreSQL:

```bash
docker compose up -d database
```

Instal dependensi dari root:

```bash
npm install
```

Jalankan migrasi, buat Prisma Client, dan masukkan data contoh:

```bash
npm run db:migrate
npm run db:seed
```

Seed menyediakan tiga akun, dua sesi terbuka, peserta, dan pesan obrolan. Akun demo:

| Email | Kata sandi |
| --- | --- |
| `alya@studybuddy.id` | `belajar123` |
| `bima@studybuddy.id` | `belajar123` |
| `citra@studybuddy.id` | `belajar123` |

Data seed hanya untuk pengembangan lokal. Jangan gunakan kredensial contoh di lingkungan publik.

## Menjalankan Aplikasi

Untuk menjalankan frontend dan API bersamaan:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3001/api>
- Pemeriksaan API: <http://localhost:3001/api/health>

Atau jalankan masing-masing di terminal terpisah:

```bash
npm run dev --workspace @studybuddy/api
npm run dev --workspace @studybuddy/web
```

API membaca `.env` root saat dijalankan dari monorepo. Vite menggunakan `VITE_API_URL`, dengan
nilai bawaan `http://localhost:3001/api`. `WEB_ORIGIN` mengatur asal frontend yang diizinkan
oleh CORS.

## Build dan Utilitas

```bash
npm run build
npm run db:studio
docker compose down
```

Build root mengompilasi paket shared, API, lalu frontend. `docker compose down` menghentikan
database; volume `studybuddy-postgres` tetap menyimpan data. Untuk menghapus data development
sepenuhnya, hapus volume tersebut secara eksplisit dengan `docker compose down -v`.

## API REST

Semua rute berada di bawah `/api`. Rute yang ditandai autentikasi menerima header
`Authorization: Bearer <token>`. Respons sukses memakai bentuk `{ "data": ... }`; respons galat
memakai `{ "error": "..." }`.

| Metode | Rute | Akses |
| --- | --- | --- |
| `POST` | `/auth/register` | Publik |
| `POST` | `/auth/login` | Publik |
| `GET`, `PUT` | `/users/me` | Autentikasi |
| `GET`, `POST` | `/sessions` | Autentikasi |
| `GET`, `PUT`, `DELETE` | `/sessions/:Id` | Autentikasi; perubahan hanya oleh pembuat |
| `POST` | `/sessions/:Id/join` | Autentikasi |
| `GET`, `POST` | `/sessions/:Id/messages` | Autentikasi dan anggota sesi |

`GET /sessions` menerima filter `subject`, `location`, dan `search`. Pencarian lokasi mengabaikan
huruf besar/kecil; `search` mencocokkan judul, mata pelajaran, atau lokasi. Kapasitas mencakup
pembuat sesi, kapasitas minimal dua orang, dan satu akun tidak dapat bergabung dua kali.
Transaksi serializable menjaga kapasitas tetap konsisten saat beberapa permintaan bergabung
bersamaan.

## Catatan Batasan

- Lokasi berupa teks; peta dan GPS tidak termasuk.
- Obrolan menggunakan polling HTTP sederhana, bukan Socket.io.
- Kata sandi awal demo hanya untuk pengembangan; gunakan akun dan rahasia berbeda di produksi.
