"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface Character {
  _id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  setting_id?: string;
  session_id?: string | null;
  image_url?: string;
  setting_name?: string;
}

function CharacterCard({ char }: { char: Character }) {
  const [imgError, setImgError] = useState(false);
  const hasPortrait = Boolean(char.image_url) && !imgError;
  const params = new URLSearchParams();
  if (char.session_id) params.set("gameId", char.session_id);
  params.set("characterId", char._id);
  const href = char.setting_id ? `/play/${char.setting_id}?${params.toString()}` : `/`;

  return (
    <Link href={href} className="group block overflow-hidden rounded-2xl border border-white/8 bg-white/4 transition hover:border-white/25">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {hasPortrait ? (
          <img
            src={char.image_url!}
            alt={char.name}
            className="h-full w-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-rose-950/40 via-[#0f0810] to-[#0a060e]">
            <span className="text-5xl font-bold text-white/10 select-none">
              {char.name?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8">
          {char.setting_name && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-0.5 truncate">{char.setting_name}</p>
          )}
          <p className="font-semibold text-white leading-tight text-sm">{char.name}</p>
          <p className="text-xs text-white/55 mt-0.5">Lv.{char.level} · {char.race} {char.class}</p>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
      <span className="text-2xl font-semibold text-white">{value}</span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.3em] text-white/45">{label}</span>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charsLoading, setCharsLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setCharsLoading(true);
    fetch(`/api/characters?userId=${session.user.id}`)
      .then((r) => r.json())
      .then(async (data) => {
        const list: Character[] = Array.isArray(data) ? data : [];
        // Resolve unique setting names in parallel
        const uniqueSettingIds = Array.from(new Set(list.map((c) => c.setting_id).filter((id): id is string => Boolean(id))));
        const settingNames: Record<string, string> = {};
        await Promise.all(
          uniqueSettingIds.map((id) =>
            fetch(`/api/settings?settingId=${id}`)
              .then((r) => r.json())
              .then((s) => { if (s?.name) settingNames[id] = s.name; })
              .catch(() => {})
          )
        );
        setCharacters(list.map((c) => ({
          ...c,
          setting_name: c.setting_id ? (settingNames[c.setting_id] ?? "Unknown World") : "Unknown World",
        })));
      })
      .catch(() => setCharacters([]))
      .finally(() => setCharsLoading(false));
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-rose-400" />
      </div>
    );
  }

  if (!session) return null;

  const { name, email, image, votes = [], achievements = [], friends = [] } = session.user as any;

  return (
    <div data-full-width="true" className="flex min-h-full w-full flex-col text-gray-100">
      <div className="relative mx-auto h-full w-full max-w-3xl px-5 py-10 pb-36 md:px-10">

        {/* ── Profile header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left"
        >
          {image && !avatarError ? (
            <img
              src={image}
              alt={name ?? "Avatar"}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/15"
              onError={() => setAvatarError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1a0a0e] ring-2 ring-white/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-white/50" aria-hidden>
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-white">{name}</h1>
            <p className="text-sm text-white/55">{email}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Adventurer</p>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard label="Characters" value={characters.length} />
          <StatCard label="Votes Cast" value={Array.isArray(votes) ? votes.length : 0} />
          <StatCard label="Achievements" value={Array.isArray(achievements) ? achievements.length : 0} />
          <StatCard label="Friends" value={Array.isArray(friends) ? friends.length : 0} />
        </motion.div>

        {/* ── Characters ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-base font-semibold text-white">My Characters</h2>
          {charsLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-white/8 bg-white/4" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-8 text-center">
              <p className="text-sm text-white/45">No characters yet.</p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm text-rose-400 hover:text-rose-300 transition"
              >
                Browse worlds to start one →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {characters.map((char) => (
                <CharacterCard key={char._id} char={char} />
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Achievements ── */}
        {Array.isArray(achievements) && achievements.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="mb-8"
          >
            <h2 className="mb-4 text-base font-semibold text-white">Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full border border-amber-400/25 bg-amber-400/8 px-3 py-1.5 text-xs font-medium text-amber-300"
                >
                  {a}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Account actions ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white"
          >
            Sign Out
          </button>
        </motion.section>
      </div>
    </div>
  );
}
