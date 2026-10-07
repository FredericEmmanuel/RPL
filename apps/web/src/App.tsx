import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  CapacityStatus,
  SUBJECTS,
  type ChatMessage,
  type CreateSessionRequest,
  type StudySession,
  type UpdateProfileRequest,
  type User
} from "@studybuddy/shared";
import { apiRequest } from "./api";
import { useAuth } from "./auth";

const dateLabel = (value: string, includeTime = true) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined
  }).format(new Date(value));

function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ink">Memuat StudyBuddy…</div>;
  }
  return (
    <Routes>
      <Route path="/masuk" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/daftar" element={user ? <Navigate to="/" replace /> : <AuthPage register />} />
      <Route element={user ? <AppLayout /> : <Navigate to="/masuk" replace />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/jelajahi" element={<ExplorePage />} />
        <Route path="/buat-sesi" element={<CreateSessionPage />} />
        <Route path="/sesi/:id" element={<SessionDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/masuk"} replace />} />
    </Routes>
  );
}

function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-ink/5 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white">
              <BookOpen size={20} />
            </span>
            <span className="text-xl">study<span className="text-orange">buddy</span></span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" icon={<CalendarDays size={17} />}>Jadwal saya</NavLink>
            <NavLink to="/jelajahi" icon={<Compass size={17} />}>Jelajahi</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1.5 pl-1.5 pr-3"
              aria-label="Atur profil"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-sm font-bold">
                {user?.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
                {user?.name.split(" ")[0]}
              </span>
              <ChevronDown size={15} className="text-ink/50" />
            </button>
            <button onClick={logout} className="rounded-full p-2 text-ink/55 hover:bg-leaf" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ink/10 bg-white px-5 py-2 sm:hidden">
        <MobileLink to="/" icon={<CalendarDays size={19} />} label="Jadwal" />
        <MobileLink to="/jelajahi" icon={<Compass size={19} />} label="Jelajahi" />
        <MobileLink to="/buat-sesi" icon={<Plus size={19} />} label="Buat sesi" />
      </nav>
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 sm:pt-10">
        <Outlet />
      </main>
      {profileOpen && user && (
        <ProfileModal
          user={user}
          close={() => setProfileOpen(false)}
          saved={updateUser}
        />
      )}
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink/65 hover:bg-leaf hover:text-ink"
    >
      {icon}{children}
    </Link>
  );
}

function MobileLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-1 flex-col items-center gap-1 py-1 text-xs text-ink/65">
      {icon}{label}
    </Link>
  );
}

function AuthPage({ register = false }: { register?: boolean }) {
  const { login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (register) {
        const subjects = form.getAll("favoriteSubjects").map(String);
        await createAccount({
          name: String(form.get("name")),
          email: String(form.get("email")),
          password: String(form.get("password")),
          schoolOrUniversity: String(form.get("schoolOrUniversity")),
          favoriteSubjects: subjects,
          preferredLocation: String(form.get("preferredLocation"))
        });
      } else {
        await login({ email: String(form.get("email")), password: String(form.get("password")) });
      }
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/masuk" className="flex items-center gap-2.5 text-xl font-bold">
          <BookOpen size={24} /> study<span className="text-orange">buddy</span>
        </Link>
        <div className="relative z-10 max-w-lg pb-12">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Sparkles size={16} className="text-orange" /> Ruang tumbuh untuk semua pelajar
          </span>
          <h1 className="text-5xl font-semibold leading-tight">
            Belajar bareng,<br />lebih berkembang.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-white/70">
            Temukan teman belajar yang cocok dengan mata pelajaran, jadwal, dan tempat favoritmu.
          </p>
          <div className="mt-9 flex -space-x-2">
            {["A", "B", "C", "D"].map((letter, index) => (
              <span
                key={letter}
                className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink font-semibold text-ink ${
                  ["bg-orange", "bg-lime-200", "bg-sky-200", "bg-pink-200"][index]
                }`}
              >{letter}</span>
            ))}
            <span className="ml-5 self-center text-sm text-white/70">Belajar lebih asyik bersama.</span>
          </div>
        </div>
        <div className="absolute -bottom-20 -right-10 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-8 -right-2 h-72 w-72 rounded-full border border-white/10" />
        <p className="text-xs text-white/40">Teman belajar yang tepat ada di dekatmu.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-xl font-bold lg:hidden">
            <BookOpen size={22} /> study<span className="text-orange">buddy</span>
          </div>
          <span className="text-sm font-semibold uppercase tracking-widest text-ink/40">
            {register ? "Mulai perjalananmu" : "Selamat datang kembali"}
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {register ? "Buat akun StudyBuddy" : "Masuk ke akunmu"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/55">
            {register ? "Lengkapi profil agar teman belajar mudah menemukanmu." : "Teman belajarmu sudah menunggu."}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {register && (
              <>
                <Field label="Nama lengkap" name="name" placeholder="Nama kamu" required minLength={2} />
                <Field label="Sekolah atau universitas" name="schoolOrUniversity" placeholder="Contoh: Universitas Indonesia" required />
              </>
            )}
            <Field label="Email" name="email" type="email" placeholder="nama@email.com" required />
            <Field
              label="Kata sandi"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              minLength={register ? 8 : 1}
            />
            {register && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Mata pelajaran favorit</label>
                  <select name="favoriteSubjects" multiple className="input h-28" defaultValue={["Matematika"]}>
                    {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <p className="mt-1 text-xs text-ink/45">Pilih satu atau beberapa mata pelajaran.</p>
                </div>
                <Field label="Area pilihan" name="preferredLocation" placeholder="Contoh: Depok" required />
              </>
            )}
            {error && <Alert>{error}</Alert>}
            <button className="button-primary w-full" disabled={busy}>
              {busy ? "Mohon tunggu…" : register ? "Buat akun" : "Masuk"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-ink/55">
            {register ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <Link className="font-bold text-ink underline decoration-orange decoration-2 underline-offset-4" to={register ? "/masuk" : "/daftar"}>
              {register ? "Masuk di sini" : "Daftar sekarang"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<StudySession[]>("/sessions")
      .then((items) => setSessions(
        items.filter((session) => session.participants.some((participant) => participant.userId === user?.id))
      ))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Jadwal tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const upcoming = sessions.filter((session) => new Date(session.startTime).getTime() >= Date.now());
  const nextSession = upcoming[0];
  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-9 text-white sm:px-10 sm:py-11">
        <div className="relative z-10 max-w-2xl">
          <p className="flex items-center gap-2 text-sm text-white/70">
            <Sparkles size={16} className="text-orange" /> Halo, {user?.name.split(" ")[0]}!
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Siap belajar sesuatu<br className="hidden sm:block" /> yang baru hari ini?
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
            Langkah kecil jadi lebih menyenangkan kalau dilakukan bersama.
          </p>
          <Link to="/jelajahi" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-leaf">
            Temukan teman belajar <ArrowRight size={16} />
          </Link>
        </div>
        <div className="absolute -right-12 -top-24 h-80 w-80 rounded-full border border-white/10 sm:right-10" />
        <div className="absolute -right-1 -top-12 h-56 w-56 rounded-full border border-white/10 sm:right-20" />
        <BookOpen className="absolute bottom-7 right-8 hidden text-white/15 sm:block" size={84} />
      </section>

      {nextSession && (
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-orange/40 bg-[#fff7ef] p-5 sm:flex-row sm:items-center sm:px-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-orange">
              <Clock3 size={21} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Sesi berikutnya</p>
              <p className="mt-1 font-semibold">{nextSession.title}</p>
              <p className="mt-1 text-sm text-ink/55">{dateLabel(nextSession.startTime)} · {nextSession.location}</p>
            </div>
          </div>
          <Link to={`/sesi/${nextSession.id}`} className="inline-flex items-center gap-2 self-start text-sm font-bold sm:self-center">
            Lihat sesi <ArrowRight size={16} />
          </Link>
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Aktivitas belajarmu</p>
            <h2 className="mt-1 text-2xl font-semibold">Jadwal saya</h2>
          </div>
          <Link to="/buat-sesi" className="hidden items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold hover:bg-white sm:inline-flex">
            <Plus size={17} /> Buat sesi
          </Link>
        </div>
        {error && <Alert>{error}</Alert>}
        {loading ? <Loading /> : sessions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} showScheduleStatus />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="Belum ada jadwal belajar"
            text="Jelajahi sesi yang tersedia atau buat sesi belajar pertamamu."
            action={<Link to="/buat-sesi" className="button-primary">Buat sesi belajar <Plus size={16} /></Link>}
          />
        )}
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Users size={19} />} label="Sesi diikuti" value={String(sessions.length)} />
        <StatCard icon={<BookOpen size={19} />} label="Mata pelajaran favorit" value={user?.favoriteSubjects.length ? user.favoriteSubjects.slice(0, 2).join(", ") : "Belum diatur"} />
      </div>
    </div>
  );
}

function ExplorePage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("location", search.trim());
    if (subject) params.set("subject", subject);
    setLoading(true);
    apiRequest<StudySession[]>(`/sessions?${params.toString()}`)
      .then(setSessions)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Sesi tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [search, subject]);

  async function joinSession(sessionId: string) {
    try {
      await apiRequest<StudySession>(`/sessions/${sessionId}/join`, { method: "POST" });
      navigate(`/sesi/${sessionId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak dapat bergabung ke sesi.");
    }
  }

  const openCount = useMemo(() => sessions.filter(
    (session) => session.capacityStatus === CapacityStatus.Open
  ).length, [sessions]);

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Komunitas belajarmu</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Jelajahi sesi</h1>
            <p className="mt-2 text-ink/55">Temukan kelompok belajar yang cocok untukmu.</p>
          </div>
          <Link to="/buat-sesi" className="button-primary"><Plus size={17} /> Buat sesi</Link>
        </div>
      </section>
      <section className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-card sm:grid-cols-[1fr_240px]">
        <label className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="input pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari area atau lokasi…" />
        </label>
        <select className="input" value={subject} onChange={(event) => setSubject(event.target.value)}>
          <option value="">Semua mata pelajaran</option>
          {SUBJECTS.map((option) => <option key={option}>{option}</option>)}
        </select>
      </section>
      <div className="flex items-center justify-between text-sm text-ink/55">
        <span>{loading ? "Mencari sesi…" : `${sessions.length} sesi ditemukan`}</span>
        <span className="rounded-full bg-leaf px-3 py-1 font-semibold text-ink">{openCount} masih tersedia</span>
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : sessions.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              showJoin
              isMember={session.participants.some((participant) => participant.userId === user?.id)}
              onJoin={() => joinSession(session.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Compass size={24} />}
          title="Belum ada sesi yang cocok"
          text="Coba ubah kata pencarian atau jadilah orang pertama yang membuat sesi di area ini."
          action={<Link to="/buat-sesi" className="button-primary">Buat sesi <Plus size={16} /></Link>}
        />
      )}
    </div>
  );
}

function CreateSessionPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const startTime = new Date(String(form.get("startTime"))).toISOString();
    const input: CreateSessionRequest = {
      title: String(form.get("title")),
      subject: String(form.get("subject")),
      startTime,
      location: String(form.get("location")),
      capacity: Number(form.get("capacity"))
    };
    try {
      const session = await apiRequest<StudySession>("/sessions", {
        method: "POST",
        body: JSON.stringify(input)
      });
      navigate(`/sesi/${session.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sesi tidak dapat dibuat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/jelajahi" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft size={16} /> Kembali ke jelajahi
      </Link>
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf"><Plus size={22} /></span>
        <h1 className="mt-5 text-3xl font-semibold">Buat sesi belajar</h1>
        <p className="mt-2 text-sm text-ink/55">Ajak teman-teman belajar bersama sesuai rencanamu.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Nama sesi" name="title" placeholder="Contoh: Persiapan Ujian Kalkulus" required minLength={3} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">Mata pelajaran</label>
              <select name="subject" className="input" required defaultValue="">
                <option value="" disabled>Pilih mata pelajaran</option>
                {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
            </div>
            <Field label="Waktu mulai" name="startTime" type="datetime-local" required min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} />
          </div>
          <Field label="Tempat belajar" name="location" placeholder="Contoh: Perpustakaan UI, Depok" required minLength={2} />
          <div>
            <label className="mb-2 block text-sm font-semibold">Kapasitas peserta</label>
            <input className="input" name="capacity" type="number" min="2" max="100" defaultValue="5" required />
            <p className="mt-1 text-xs text-ink/45">Termasuk dirimu sebagai pembuat sesi.</p>
          </div>
          {error && <Alert>{error}</Alert>}
          <button className="button-primary w-full" disabled={busy}>
            {busy ? "Membuat sesi…" : "Buat sesi belajar"} <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SessionDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState<StudySession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const isMember = session?.participants.some((participant) => participant.userId === user?.id) ?? false;

  useEffect(() => {
    apiRequest<StudySession>(`/sessions/${id}`)
      .then(setSession)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Sesi tidak ditemukan."));
  }, [id]);

  useEffect(() => {
    if (!isMember) return;
    const loadMessages = () => apiRequest<ChatMessage[]>(`/sessions/${id}/messages`)
      .then(setMessages)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Obrolan tidak dapat dimuat."));
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(timer);
  }, [id, isMember]);

  async function join() {
    try {
      setSession(await apiRequest<StudySession>(`/sessions/${id}/join`, { method: "POST" }));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak dapat bergabung ke sesi.");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    try {
      const sent = await apiRequest<ChatMessage>(`/sessions/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: message.trim() })
      });
      setMessages((current) => [...current, sent]);
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesan tidak dapat dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession() {
    if (!window.confirm("Hapus sesi belajar ini? Semua obrolan dan daftar peserta juga akan dihapus.")) return;
    try {
      await apiRequest<void>(`/sessions/${id}`, { method: "DELETE" });
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sesi tidak dapat dihapus.");
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const updated = await apiRequest<StudySession>(`/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: String(form.get("title")),
          subject: String(form.get("subject")),
          startTime: new Date(String(form.get("startTime"))).toISOString(),
          location: String(form.get("location")),
          capacity: Number(form.get("capacity"))
        })
      });
      setSession(updated);
      setEditOpen(false);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Perubahan tidak dapat disimpan.");
    }
  }

  if (!session) {
    return <div className="mx-auto max-w-4xl">{error ? <Alert>{error}</Alert> : <Loading />}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/jelajahi" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft size={16} /> Kembali ke jelajahi
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="rounded-3xl bg-ink p-7 text-white sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{session.subject}</span>
              <CapacityBadge session={session} />
            </div>
            <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{session.title}</h1>
            <p className="mt-3 text-sm text-white/60">Dibuat oleh {session.creator.name}</p>
            <div className="mt-7 grid gap-4 border-t border-white/15 pt-6 sm:grid-cols-2">
              <DetailItem icon={<CalendarDays size={18} />} label="Waktu" value={dateLabel(session.startTime)} />
              <DetailItem icon={<MapPin size={18} />} label="Lokasi" value={session.location} />
              <DetailItem icon={<Users size={18} />} label="Peserta" value={`${session.participantCount} dari ${session.capacity} orang`} />
              <DetailItem icon={<BookOpen size={18} />} label="Mata pelajaran" value={session.subject} />
            </div>
            {!isMember && (
              <button
                onClick={join}
                disabled={session.capacityStatus === CapacityStatus.Full}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-50"
              >
                {session.capacityStatus === CapacityStatus.Full ? "Sesi sudah penuh" : "Gabung ke sesi"}
                {session.capacityStatus !== CapacityStatus.Full && <ArrowRight size={16} />}
              </button>
            )}
            {session.creatorId === user?.id && (
              <div className="mt-6 flex gap-3 border-t border-white/15 pt-5">
                <button onClick={() => setEditOpen(!editOpen)} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
                  {editOpen ? "Tutup edit" : "Ubah sesi"}
                </button>
                <button onClick={deleteSession} className="rounded-full bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-400/25">
                  Hapus sesi
                </button>
              </div>
            )}
          </section>
          {editOpen && (
            <form onSubmit={saveEdit} className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
              <h2 className="text-lg font-semibold">Ubah informasi sesi</h2>
              <Field label="Nama sesi" name="title" defaultValue={session.title} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Mata pelajaran</label>
                  <select className="input" name="subject" defaultValue={session.subject}>
                    {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
                  </select>
                </div>
                <Field label="Waktu mulai" name="startTime" type="datetime-local" defaultValue={new Date(session.startTime).toISOString().slice(0, 16)} required />
              </div>
              <Field label="Lokasi" name="location" defaultValue={session.location} required />
              <Field label="Kapasitas" name="capacity" type="number" min="2" max="100" defaultValue={session.capacity} required />
              <button className="button-primary">Simpan perubahan <Check size={16} /></button>
            </form>
          )}
          <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users size={20} /> Teman satu sesi <span className="text-sm font-medium text-ink/45">({session.participantCount})</span>
            </h2>
            <div className="mt-5 space-y-3">
              {session.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-leaf font-bold">
                    {participant.user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{participant.user.name}{participant.userId === session.creatorId ? " · Pembuat" : ""}</p>
                    <p className="text-xs text-ink/45">Bergabung {dateLabel(participant.joinedAt, false)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 font-semibold"><MessageCircle size={19} /> Obrolan kelompok</h2>
              <p className="mt-1 text-xs text-ink/45">{session.participantCount} anggota dalam percakapan</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" title="Pesan diperbarui otomatis" />
          </div>
          {isMember ? (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8f9f6] px-4 py-5 sm:px-6">
                {messages.length ? messages.map((chat) => (
                  <ChatBubble key={chat.id} chat={chat} own={chat.senderId === user?.id} />
                )) : (
                  <div className="grid h-full place-items-center text-center text-sm text-ink/45">
                    <div><MessageCircle size={28} className="mx-auto mb-3 opacity-50" />Belum ada pesan. Sapa teman kelompokmu!</div>
                  </div>
                )}
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-ink/10 p-3 sm:p-4">
                <input
                  className="input flex-1"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tulis pesan…"
                  maxLength={2000}
                />
                <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white hover:bg-ink/85 disabled:opacity-40" disabled={busy || !message.trim()} aria-label="Kirim pesan">
                  <ArrowRight size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-leaf"><MessageCircle size={24} /></span>
                <h3 className="mt-4 font-semibold">Obrolan untuk anggota</h3>
                <p className="mt-2 text-sm leading-6 text-ink/50">Gabung ke sesi ini untuk membaca dan mengirim pesan.</p>
              </div>
            </div>
          )}
        </section>
      </div>
      {error && <div className="fixed bottom-20 left-1/2 z-30 w-[min(92%,520px)] -translate-x-1/2"><Alert>{error}</Alert></div>}
    </div>
  );
}

function SessionCard({
  session,
  showJoin = false,
  showScheduleStatus = false,
  isMember = false,
  onJoin
}: {
  session: StudySession;
  showJoin?: boolean;
  showScheduleStatus?: boolean;
  isMember?: boolean;
  onJoin?: () => void;
}) {
  return (
    <article className="flex flex-col rounded-3xl border border-ink/10 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-leaf px-3 py-1 text-xs font-bold text-ink">{session.subject}</span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showScheduleStatus && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              new Date(session.startTime).getTime() >= Date.now()
                ? "bg-sky-50 text-sky-700"
                : "bg-stone-100 text-stone-600"
            }`}>
              {new Date(session.startTime).getTime() >= Date.now() ? "Akan datang" : "Selesai"}
            </span>
          )}
          <CapacityBadge session={session} />
        </div>
      </div>
      <Link to={`/sesi/${session.id}`} className="mt-4 text-lg font-semibold leading-snug hover:underline">
        {session.title}
      </Link>
      <p className="mt-1 text-xs text-ink/45">Oleh {session.creator.name}</p>
      <div className="mt-5 space-y-3 text-sm text-ink/65">
        <p className="flex items-center gap-2"><CalendarDays size={16} className="shrink-0 text-ink/40" />{dateLabel(session.startTime)}</p>
        <p className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-ink/40" />{session.location}</p>
        <p className="flex items-center gap-2"><Users size={16} className="shrink-0 text-ink/40" />{session.participantCount}/{session.capacity} peserta</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-ink/50">
          <GraduationCap size={16} /> {session.participantCount} teman belajar
        </span>
        {showJoin && (isMember ? (
          <Link to={`/sesi/${session.id}`} className="text-sm font-bold">Lihat sesi <ArrowRight size={15} className="inline" /></Link>
        ) : (
          <button
            onClick={onJoin}
            disabled={session.capacityStatus === CapacityStatus.Full}
            className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-ink/20"
          >{session.capacityStatus === CapacityStatus.Full ? "Penuh" : "Gabung"}</button>
        ))}
        {!showJoin && <Link to={`/sesi/${session.id}`} className="text-sm font-bold text-ink">Detail <ArrowRight size={15} className="inline" /></Link>}
      </div>
    </article>
  );
}

function CapacityBadge({ session }: { session: StudySession }) {
  const isFull = session.capacityStatus === CapacityStatus.Full;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
      isFull ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
    }`}>
      {isFull ? "Penuh" : "Tersedia"}
    </span>
  );
}

function ChatBubble({ chat, own }: { chat: ChatMessage; own: boolean }) {
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        own ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-white text-ink"
      }`}>
        {!own && <p className="mb-1 text-xs font-bold text-ink/60">{chat.sender.name}</p>}
        <p className="whitespace-pre-wrap break-words text-sm">{chat.message}</p>
        <p className={`mt-1 text-right text-[10px] ${own ? "text-white/55" : "text-ink/40"}`}>
          {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(chat.sentAt))}
        </p>
      </div>
    </div>
  );
}

function ProfileModal({ user, close, saved }: { user: User; close: () => void; saved: (user: User) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input: UpdateProfileRequest = {
      schoolOrUniversity: String(form.get("schoolOrUniversity")),
      favoriteSubjects: form.getAll("favoriteSubjects").map(String),
      preferredLocation: String(form.get("preferredLocation"))
    };
    try {
      saved(await apiRequest<User>("/users/me", { method: "PUT", body: JSON.stringify(input) }));
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil tidak dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-ink/40">Pengaturan akun</p><h2 className="mt-1 text-2xl font-semibold">Profil belajarmu</h2></div>
          <button onClick={close} aria-label="Tutup" className="rounded-full p-2 hover:bg-leaf"><X size={19} /></button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Sekolah atau universitas" name="schoolOrUniversity" defaultValue={user.schoolOrUniversity ?? ""} required />
          <Field label="Area pilihan" name="preferredLocation" defaultValue={user.preferredLocation ?? ""} required />
          <div>
            <label className="mb-2 block text-sm font-semibold">Mata pelajaran favorit</label>
            <select name="favoriteSubjects" multiple className="input h-32" defaultValue={user.favoriteSubjects}>
              {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
          </div>
          {error && <Alert>{error}</Alert>}
          <button className="button-primary w-full" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan profil"} <Check size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold">{label}</label>
      <input id={name} name={name} className="input" {...props} />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-orange">{icon}</span>
      <div><p className="text-xs text-white/50">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf">{icon}</span>
      <div><p className="text-xs text-ink/50">{label}</p><p className="mt-1 font-semibold">{value}</p></div>
      <Settings2 className="ml-auto text-ink/20" size={18} />
    </div>
  );
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/20 bg-white/50 px-6 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-leaf">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">{text}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{children}</div>;
}

function Loading() {
  return <div className="rounded-2xl border border-ink/10 bg-white px-5 py-12 text-center text-sm text-ink/55">Memuat data…</div>;
}

export default App;
