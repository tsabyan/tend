# Tend — Rencana Implementasi

Port dari prototype `productivity-suite.jsx` (React single-file, localStorage) menjadi aplikasi web production-ready bernama **Tend** dengan Next.js + Supabase.

## Ringkasan Produk

Tend adalah suite produktivitas dengan 3 modul, dinavigasi lewat bottom nav (mobile-first, max-width 520px):

1. **Focus** — daftar goal, tiap goal punya steps berurutan. Mode fokus menampilkan satu step aktif + pomodoro timer (15/25/50 menit, break 5 menit) + akumulasi total waktu fokus per goal. AI bisa men-draft steps dari judul goal.
2. **Habits** — identitas ("I want to become …") berisi habits dengan jadwal per hari-dalam-minggu. Log harian, streak (current/longest), completion rate 30 hari, kalender bulanan, strip 14 hari. AI bisa men-draft habits dari nama identitas.
3. **Tasks** — todo capture cepat, flag "today" (ikon matahari), seksi Today / Later / Done, clear done.

Detail interaksi (chime saat selesai, animasi pop, empty states, immersive focus tanpa navbar) dipertahankan dari prototype.

## Keputusan Arsitektur

| Area | Keputusan |
|---|---|
| Framework | Next.js 15, App Router, TypeScript, `src/` dir, tanpa Tailwind (port CSS custom prototype) |
| Database | Supabase Postgres, semua tabel pakai RLS per `auth.uid()` |
| Auth | Supabase Auth email+password via `@supabase/ssr` (cookie session), middleware guard untuk route app |
| Data access | Query Supabase langsung dari client components + optimistic update lokal (mempertahankan pola state prototype); tidak perlu API layer sendiri untuk CRUD |
| AI suggest | Route handlers `/api/ai/suggest-steps` & `/api/ai/suggest-habits` memanggil Gemini API server-side (`GEMINI_API_KEY` di env, tidak pernah ke browser); model `gemini-2.5-flash-lite`, structured output + thinking off + maxOutputTokens dibatasi supaya hemat token |
| Suara | Web Audio API langsung (ganti dependency Tone.js — hanya dipakai untuk 2 nada sine) |
| Font | `next/font/google`: Fraunces, Hanken Grotesk, Spline Sans Mono |
| Styling | Design tokens global (`--ink`, `--amber`, dst.) + CSS per modul, dipindah apa adanya dari prototype |
| Timer | Tetap client-side; `focus_seconds` di-flush ke DB saat pause/reset/selesai sesi (pola sama dengan prototype `flushFocus`) |

## Skema Database

```
goals       id uuid pk, user_id uuid → auth.users, title text, focus_seconds int default 0, created_at
steps       id uuid pk, goal_id uuid → goals (cascade), user_id, text, done bool, position int, created_at
identities  id uuid pk, user_id, name text, created_at
habits      id uuid pk, identity_id uuid → identities (cascade), user_id, name text,
            schedule smallint[] default '{0,1,2,3,4,5,6}', created_at
habit_logs  habit_id uuid → habits (cascade), user_id, day date, pk (habit_id, day)
todos       id uuid pk, user_id, text, done bool, today bool, created_at
```

Semua tabel: RLS enable, policy `user_id = auth.uid()` untuk select/insert/update/delete, `user_id` default `auth.uid()`.

## Breakdown Task

- [x] **T1. Scaffold** — create-next-app (TS, App Router, src dir, no Tailwind), pindahkan prototype ke `reference/`, install `@supabase/supabase-js @supabase/ssr @anthropic-ai/sdk lucide-react`. `.env.example`.
- [x] **T2. Skema Supabase** — `supabase init` + migration SQL (tabel, index, RLS) + README setup.
- [x] **T3. Supabase clients & auth plumbing** — browser client, server client, middleware refresh session + guard, tipe `Database`.
- [x] **T4. Halaman auth** — `/login` (sign in / sign up satu halaman, gaya design system), route handler sign out, redirect flow.
- [x] **T5. Design system & shell** — globals.css (tokens + nav CSS), font setup, layout root, komponen shell bottom-nav 3 tab + immersive mode.
- [x] **T6. Modul Tasks** — CRUD todos ke Supabase, optimistic update, seksi Today/Later/Done, clear done, chime + pop.
- [x] **T7. Modul Habits** — identities + habits + logs, tab Today/Identities, detail identitas, detail habit (stats, jadwal, kalender), streak/rate util, toggle log per tanggal.
- [x] **T8. Modul Focus** — goals + steps, view home/plan/focus, pomodoro timer, flush focus_seconds, progress bar, immersive.
- [x] **T9. AI routes** — dua route handler Anthropic (suggest steps, suggest habits), validasi output JSON, wiring ke tombol Sparkles di Focus & Habits.
- [x] **T10. Chime util** — modul Web Audio kecil (nada C5/G5, E5, A5) dipakai ketiga modul.
- [x] **T11. Verifikasi** — `npm run build` bersih, lint bersih, smoke test dev server.

Urutan eksekusi: T1 → T2 → T3 → T4 → T5 → T10 → T6 → T7 → T8 → T9 → T11 (T10 didahulukan karena dipakai T6–T8).

## Yang Dibutuhkan dari Kamu (setelah implementasi)

1. Buat project di [supabase.com](https://supabase.com) (atau `supabase start` lokal, butuh Docker).
2. Isi `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
3. Jalankan migration: `supabase db push` (atau paste SQL ke SQL Editor dashboard).
