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

