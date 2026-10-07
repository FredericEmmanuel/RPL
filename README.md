# StudyBuddy - Platform Web Komunitas Belajar Lokal

**StudyBuddy** adalah platform web responsif berbasis komunitas lokal yang dirancang untuk membantu pelajar dan mahasiswa menemukan teman belajar atau membentuk grup belajar berdasarkan mata pelajaran/mata kuliah, ketersediaan waktu, dan lokasi yang berdekatan.

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
| 1 | **Autentikasi & Profil Pengguna** | Pendaftaran dan login akun sederhana (Email & Password), pengisian profil mencakup Nama, Instansi/Sekolah, Mata Pelajaran/Kuliah favorit, serta Lokasi/Area. |
| 2 | **Eksplorasi & Pencarian Sesi Belajar** | Pencarian dan penyaringan (*filtering*) daftar sesi belajar berdasarkan Mata Pelajaran/Mata Kuliah dan Area/Lokasi. |
| 3 | **Manajemen Sesi Belajar (*Study Session*)** | Fitur untuk membuat sesi belajar baru (Judul, Mata Pelajaran, Waktu, Lokasi/Tempat, Kapasitas) serta bergabung ke sesi yang sudah ada. |
| 4 | **Sistem Ruang Obrolan Sederhana (*Group Chat*)** | Ruang diskusi berupa pesan teks sederhana untuk koordinasi internal antar-anggota grup sesi belajar. |
| 5 | **Dashboard / Jadwal Saya** | Halaman khusus yang menampilkan daftar sesi belajar yang telah dibuat atau diikuti beserta status jadwalnya. |

---

## Fitur yang Tidak Dikerjakan

Untuk memastikan proyek selesai tepat waktu dalam **12 kali pertemuan**, fitur-fitur berikut tidak termasuk dalam cakupan pengembanan:

1. **Peta Integrasi Real-Time / Google Maps API:** Tidak menggunakan penentuan titik lokasi via GPS interaktif/Live Maps (cukup input teks nama area/lokasi, misal: *"Perpustakaan Kampus A"* atau *"Cafe X"*).
2. **Panggilan Video / Audio Call:** Tidak menyediakan platform *video conference* bawaan (koordinasi penuh via *text chat* atau tautan Zoom/Meet eksternal).
3. **Sistem Rating / Ulasan Kompleks:** Belum ada penilaian sistem *reputation score* atau ulasan antar-pengguna.
4. **Notifikasi Push (*Push Notifications*):** Tidak ada pengiriman notifikasi ke perangkat pengguna secara *real-time* (hanya indikator di dalam web).
5. **Autentikasi Media Sosial / OAuth:** Login terbatas menggunakan akun lokal (Email & Password), tidak menggunakan Google/Facebook Sign-In.

---

## Kriteria Aplikasi Dinyatakan Berhasil

Aplikasi **StudyBuddy** dinyatakan selesai dan sukses dikembangkan jika memenuhi kriteria berikut:

### 1. Fungsionalitas Utama (*Core Flow*) Berjalan Smooth
* Pengguna dapat mendaftar akun dan mengatur profil pelajaran favorit & lokasi.
* Pengguna dapat membuat sesi belajar baru dan menentukan kapasitas peserta.
* Pengguna lain dapat menemukan sesi tersebut melalui pencarian/filter dan menekan tombol *Join*.
* Peserta yang terdaftar dalam sesi dapat saling mengirim dan membaca pesan teks di *group chat* sesi.

### 2. Keberhasilan Teknis
* Semua operasi **CRUD** (*Create, Read, Update, Delete*) pada data Sesi Belajar dan Profil berjalan tanpa galat.
* Pengujian dasar (*Black Box Testing*) mencatat tidak adanya *critical bug* pada alur utama pendaftaran hingga bergabung sesi.

### 3. Pengujian Antarmuka (*UI/UX*)
* Antarmuka aplikasi dapat diakses secara responsif baik melalui *desktop* maupun perangkat *mobile*.

---

## Tech Stack
* **Frontend:** React + TypeScript + Vite + Tailwind CSS
* **Backend:** Node.js + TypeScript + Express
* **Database:** PostgreSQL (atau MySQL)
* **ORM:** Prisma
* **API Style:** REST API
* **Real-time Communication:** Socket.io (atau HTTP Polling)
* **Deployment/Local Env:** Docker Compose (untuk database)
* **Konfigurasi Environment:** `.env.example` untuk URL database dan variabel lingkungan

---

## Aturan Kode (Code Rules)

* Jangan menambahkan komentar kode kecuali untuk logika yang sangat rumit.
* Gunakan `PascalCase` untuk semua *classes*, *types*, *interfaces*, *enums*, komponen React, model database, dan API DTOs.
* Gunakan `camelCase` untuk variabel lokal dan properti JSON.
* Batasi panjang baris kode di bawah 150 karakter jika memungkinkan.
* Gunakan struktur folder yang bersih, sederhana, dan modular.
* Semua label UI, tombol, pesan validasi, dan notifikasi menggunakan **Bahasa Indonesia**.
* Autentikasi menggunakan Email dan Password lokal (tanpa OAuth).

---

## Entitas Utama (Main Entities)

1. **User** (Autentikasi & Profil Pengguna)
   * `Id`: Identifier unik
   * `Name`: Nama lengkap
   * `Email`: Email unik pengguna
   * `PasswordHash`: Hash kata sandi
   * `SchoolOrUniversity`: Instansi/Sekolah/Kampus
   * `FavoriteSubjects`: Mata pelajaran/kuliah favorit
   * `PreferredLocation`: Area/lokasi favorit
   * `CreatedAt`: Waktu pembuatan akun

2. **StudySession** (Sesi Belajar)
   * `Id`: Identifier unik
   * `CreatorId`: Relasi ke `Id` pengguna pembuat sesi
   * `Title`: Judul sesi belajar
   * `Subject`: Mata pelajaran/kuliah
   * `StartTime`: Waktu pelaksanaan
   * `Location`: Lokasi/tempat pelaksanaan (teks)
   * `Capacity`: Kapasitas maksimal peserta
   * `CreatedAt`: Waktu pembuatan sesi

3. **SessionParticipant** (Anggota Grup Belajar)
   * `Id`: Identifier unik
   * `SessionId`: Relasi ke `Id` StudySession
   * `UserId`: Relasi ke `Id` User
   * `JoinedAt`: Waktu bergabung

4. **ChatMessage** (Pesan Ruang Obrolan)
   * `Id`: Identifier unik
   * `SessionId`: Relasi ke `Id` StudySession
   * `SenderId`: Relasi ke `Id` User pengirim
   * `Message`: Isi teks pesan
   * `SentAt`: Waktu pengiriman pesan

---

## Aturan Database

* Atribut `Email` pada tabel **User** harus bersifat unik.
* Kombinasi `SessionId` dan `UserId` pada **SessionParticipant** harus unik (mencegah duplikasi pendaftaran).
* Jumlah anggota dalam suatu sesi (`SessionParticipant`) tidak boleh melebihi `Capacity` pada **StudySession**.
* Menggunakan Prisma *migrations*.
* Menyediakan skrip *seed data* (minimal 3 akun pengguna, 2 sesi belajar terbuka, data peserta, dan beberapa contoh pesan chat).

---

## Fitur Backend & Endpoint API

### 1. Autentikasi & Pengguna
* `POST /api/auth/register` - Pendaftaran akun lokal baru
* `POST /api/auth/login` - Masuk akun
* `GET /api/users/me` - Melihat profil pengguna yang sedang login
* `PUT /api/users/me` - Memperbarui profil pengguna

### 2. Manajemen Sesi Belajar
* `GET /api/sessions` - Melihat dan menyaring sesi belajar (filter berdasarkan `Subject` & `Location`)
* `POST /api/sessions` - Membuat sesi belajar baru
* `GET /api/sessions/:Id` - Melihat detail sesi belajar tertentu
* `PUT /api/sessions/:Id` - Memperbarui informasi sesi belajar
* `DELETE /api/sessions/:Id` - Menghapus sesi belajar

### 3. Partisipasi & Ruang Obrolan
* `POST /api/sessions/:Id/join` - Bergabung ke sesi belajar (dengan validasi kapasitas)
* `GET /api/sessions/:Id/messages` - Mengambil riwayat pesan obrolan grup
* `POST /api/sessions/:Id/messages` - Mengirim pesan teks baru ke grup sesi

---

## Halaman Frontend & UI Requirements

### Halaman Aplikasi
1. **Halaman Login & Pendaftaran (Auth Pages):** Formulir pendaftaran/login serta isi profil awal.
2. **Dashboard / Jadwal Saya:** Menampilkan daftar sesi belajar yang diikuti atau dibuat beserta status jadwalnya.
3. **Halaman Eksplorasi (Explore Sessions):** Pencarian teks area/lokasi, dropdown filter mata pelajaran, dan kartu (*cards*) sesi dilengkapi tombol "Join".
4. **Halaman Detail Sesi & Ruang Obrolan:** Menampilkan informasi rinci sesi, daftar anggota, dan ruang percakapan teks.

### Desain Antarmuka (UI Requirements)
* Responsif untuk tampilan *desktop* dan *mobile*.
* Menggunakan komponen sederhana: tabel, kartu (*cards*), lencana status (*status badges*), formulir, dan status kosong (*empty states*).
* Indikator warna lencana status kapasitas sesi:
  * **Tersedia (Open):** Hijau
  * **Penuh (Full):** Merah
* Tidak menyertakan grafik/chart pada versi ini.

---

## Struktur Proyek (Monorepo)

Proyek ini menggunakan struktur *TypeScript Monorepo* berbasis `npm workspaces`:

```
studybuddy/
├── .env.example                # Template variabel lingkungan
├── .gitignore                  # File/folder yang diabaikan oleh Git
├── docker-compose.yml          # Konfigurasi container PostgreSQL/MySQL
├── package.json                # Root package.json (npm workspaces config)
├── tsconfig.json               # Konfigurasi TypeScript root
├── README.md                   # Dokumen spesifikasi dan instruksi proyek
│
├── apps/
│   ├── web/                    # Aplikasi Frontend (React + Vite + Tailwind CSS)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/         # Asset gambar dan ikon
│   │   │   ├── components/     # Komponen UI (Navbar, SessionCard, StatusBadge, Modal)
│   │   │   ├── pages/          # Halaman utama (LoginPage, RegisterPage, DashboardPage, ExplorePage, SessionDetailPage)
│   │   │   ├── services/       # Service panggilan API Axios
│   │   │   ├── context/        # React Context untuk Autentikasi/State
│   │   │   ├── App.tsx         # Komponen Root & React Router
│   │   │   ├── main.tsx        # Entry point React
│   │   │   └── index.css       # Tailwind CSS import
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── api/                    # Aplikasi Backend (Node.js + Express + Prisma)
│       ├── prisma/
│       │   ├── schema.prisma   # Definisikan skema database Prisma
│       │   ├── migrations/     # Riwayat migrasi database
│       │   └── seed.ts         # Skrip seed data awal
│       ├── src/
│       │   ├── config/         # Konfigurasi environment & database Client
│       │   ├── controllers/    # Handler logika endpoint (Auth, User, Session, Message)
│       │   ├── middlewares/    # Middleware auth JWT & error handler
│       │   ├── routes/         # Definisi router Express API
│       │   ├── services/       # Logika bisnis & query Prisma
│       │   ├── socket/         # Handler event real-time Socket.io
│       │   └── index.ts        # Entry point server Express
│       ├── package.json
│       └── tsconfig.json
│
└── packages/
    └── shared/                 # Paket Shared TypeScript (@studybuddy/shared)
        ├── src/
        │   ├── models/         # Definisi tipe User, StudySession, SessionParticipant, ChatMessage
        │   ├── enums/          # Status Enum (misal: CapacityStatus)
        │   ├── dto/            # Data Transfer Objects untuk Request/Response API
        │   └── index.ts        # Export terpusat untuk semua tipe
        ├── package.json
        └── tsconfig.json

```

### Aturan Paket Shared (`@studybuddy/shared`)
* Semua *domain models*, *enums*, tipe *API response*, dan DTOs wajib didefinisikan sekali di `packages/shared`.
* Aplikasi `apps/web` dan `apps/api` harus mengimpor tipe data dari `@studybuddy/shared`.
* *Frontend* dilarang mengimpor tipe data dari Prisma secara langsung.
* *Backend* bertugas memetakan entitas Prisma ke model API *shared* sebelum mengirimkan respons ke *frontend*.

---

## Deliverables Proyek

1. Kode sumber (*source code*) lengkap untuk *frontend*, *backend*, dan *shared package*.
2. Skema Prisma, *migrations*, dan skrip data *seed*.
3. Berkas `docker-compose.yml` untuk menjalankan instance PostgreSQL/MySQL lokal.
4. Berkas `.env.example`.
5. Berkas `README.md` memuat panduan pengoperasian dan *setup*.
