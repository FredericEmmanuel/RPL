# StudyBuddy - Platform Web Komunitas Belajar Lokal

**StudyBuddy** adalah platform web responsif berbasis komunitas lokal yang dirancang untuk membantu pelajar dan mahasiswa menemukan teman belajar atau membentuk grup belajar berdasarkan mata pelajaran/mata kuliah, ketersediaan waktu, dan lokasi yang berdekatan. Antarmuka dan seluruh pesan aplikasi menggunakan Bahasa Indonesia.

---

## Tema & Gambaran Umum

> **"Platform Web Responsif Berbasis Komunitas Lokal untuk Pencarian Teman Belajar dan Pembentukan Grup Belajar Spesifik Mata Pelajaran/Mata Kuliah"**

Projek ini dikembangkan sebagai solusi praktis atas permasalahan koordinasi belajar kelompok yang tidak terarah. Aplikasi ini difokuskan pada fitur-fitur inti (*core features*) yang realistis untuk diselesaikan dalam durasi **12 pertemuan pengembangan**.

---

## Deskripsi Masalah

* **Masalah Utama:** Banyak pelajar dan mahasiswa kesulitan menemukan teman belajar kelompok yang memiliki kebutuhan mata pelajaran/mata kuliah yang sama, kecocokan waktu, serta lokasi belajar yang berdekatan.
* **Dampak:** Proses belajar mandiri sering kali stagnan karena kurangnya diskusi/pemahaman materi, sementara koordinasi pembentukan kelompok belajar secara manual (melalui grup *chat* umum) sering kali tidak terarah dan tidak efektif.

---

## Profil Target Pengguna

* **Pengguna Utama:** Siswa & Mahasiswa.
* **Kebutuhan:** 
  * Mencari pendorong semangat belajar (*study buddy*).
  * Memahami materi yang sulit melalui diskusi *peer-to-peer*.
  * Menemukan tempat dan jadwal belajar yang fleksibel.
* **Karakteristik:** Terbiasa menggunakan aplikasi dengan antarmuka *mobile-friendly* dan *web-responsive*.

---

## Manfaat Aplikasi

1. **Bagi Pengguna:** Memudahkan penemuan teman/grup belajar secara efisien berdasarkan lokasi, waktu, dan mata pelajaran yang sama tanpa perlu melakukan pengumuman manual di media sosial.
2. **Bagi Proses Belajar:** Meningkatkan kolaborasi dan produktivitas belajar kelompok melalui wadah koordinasi yang terpusat.

---

## Fitur Inti

| No | Fitur | Deskripsi |
| :--- | :--- | :--- |
| 1 | **Autentikasi & Profil Pengguna** | Pendaftaran dan masuk menggunakan email serta kata sandi lokal. Profil berisi nama, sekolah/kampus, mata pelajaran favorit, dan area pilihan. |
| 2 | **Eksplorasi & Pencarian Sesi Belajar** | Pencarian sesi berdasarkan mata pelajaran dan area/lokasi. |
| 3 | **Manajemen Sesi Belajar (*Study Session*)** | Buat, lihat, ubah, dan hapus sesi; hanya pembuat sesi yang dapat mengubah atau menghapusnya. Bergabung ke sesi dengan pencegahan peserta ganda dan pemeriksaan kapasitas. |
| 4 | **Sistem Ruang Obrolan Sederhana** | Obrolan teks anggota sesi dengan pembaruan otomatis (menggunakan *HTTP Polling* setiap 5 detik). |
| 5 | **Dashboard / Jadwal Saya** | Dasbor jadwal khusus yang menampilkan daftar sesi belajar yang telah dibuat atau diikuti beserta status jadwalnya. |

---

## Fitur yang Tidak Dikerjakan (*Out of Scope*)

Untuk memastikan proyek selesai tepat waktu dalam **12 kali pertemuan**, fitur-fitur berikut dikecualikan:

1. **Peta Integrasi Real-Time / Google Maps API:** Tidak menggunakan penentuan titik lokasi via GPS interaktif/Live Maps (lokasi berupa input teks biasa, misal: *"Perpustakaan Kampus A"*).
2. **Panggilan Video / Audio Call:** Tidak menyediakan platform *video conference* bawaan (koordinasi penuh via teks atau tautan Zoom/Meet eksternal).
3. **Sistem Rating / Ulasan Kompleks:** Belum ada penilaian sistem *reputation score* atau ulasan antar-pengguna.
4. **Notifikasi Push (*Push Notifications*):** Tidak ada pengiriman notifikasi ke perangkat pengguna secara *real-time*.
5. **Autentikasi Media Sosial / OAuth:** Login terbatas menggunakan akun lokal (Email & Password), tidak menggunakan Google/Facebook Sign-In.

---

## Kriteria Aplikasi Dinyatakan Berhasil

Aplikasi **StudyBuddy** dinyatakan sukses dikembangkan jika memenuhi kriteria berikut:

### 1. Fungsionalitas Utama (*Core Flow*) Berjalan Smooth
- [ ] Pengguna dapat mendaftar akun dan mengatur profil pelajaran favorit & lokasi.
- [ ] Pengguna dapat membuat sesi belajar baru dan menentukan kapasitas peserta.
- [ ] Pengguna lain dapat menemukan sesi tersebut melalui pencarian/filter dan menekan tombol *Join*.
- [ ] Peserta yang terdaftar dalam sesi dapat saling mengirim dan membaca pesan teks di *group chat* sesi.

### 2. Keberhasilan Teknis
- [ ] Semua operasi **CRUD** (*Create, Read, Update, Delete*) pada data Sesi Belajar dan Profil berjalan tanpa galat.
- [ ] Pengujian dasar (*Black Box Testing*) mencatat tidak adanya *critical bug* pada alur utama pendaftaran hingga bergabung sesi.

### 3. Pengujian Antarmuka (*UI/UX*)
- [ ] Antarmuka aplikasi dapat diakses secara responsif baik melalui *desktop* maupun perangkat *mobile*.

---

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


## Struktur Proyek (Monorepo)

Proyek ini menggunakan struktur *TypeScript Monorepo* berbasis `npm workspaces`:

```text
studybuddy/
├── .env.example                # Template variabel lingkungan
├── docker-compose.yml          # Konfigurasi container PostgreSQL
├── package.json                # Root package.json (npm workspaces config)
├── README.md                   # Dokumen spesifikasi dan instruksi proyek
│
├── apps/
│   ├── web/                    # Aplikasi Frontend (React + Vite + Tailwind CSS)
│   └── api/                    # Aplikasi Backend (Node.js + Express + Prisma schema/migrations, dan seed)
│
└── packages/
    └── shared/                 # Paket Shared TypeScript (@studybuddy/shared)
        └── src/
            ├── models/         # Definisi tipe domain
            ├── enums/          # Status Enum 
            └── dto/            # Data Transfer Objects untuk API


