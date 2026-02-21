"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { deriveThemeFromSetting, getSettingTheme } from "@/utils/settingTheme";

const PAGE_SIZE = 12;

function SettingCardSkeleton() {
  return (
    <div className="h-56 w-full animate-pulse rounded-2xl border border-white/12 bg-white/5" />
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  containerClassName?: string;
};

function CustomSelect({ label, options, value, onChange, placeholder, containerClassName }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder || "Select";
  const containerClasses = ["relative"];

  if (containerClassName) {
    containerClasses.push(containerClassName);
  } else {
    containerClasses.push("w-full", "min-w-[220px]");
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={containerClasses.join(" ")} ref={containerRef}>
      <button
        type="button"
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">{label}</p>
            <p className="mt-1 text-sm font-medium text-white">{displayValue}</p>
          </div>
          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/70">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl">
          <ul className="max-h-60 overflow-auto" role="listbox">
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-rose-300">
                        <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

const SettingCard = dynamic(() => import("@/components/SettingCard"), {
  loading: () => <SettingCardSkeleton />,
  ssr: false,
});

type ActiveSession = {
  _id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  image_url?: string;
  setting_id?: string;
  session_id: string;
  setting_name?: string;
  setting_genres?: string[];
  setting_description?: string;
  setting_theme?: import('@/types').SettingTheme;
  pinned?: boolean;
  last_played?: string | null;
};

function ContinueCard({ s, onTogglePin }: { s: ActiveSession; onTogglePin: (id: string, pinned: boolean) => void }) {
  const [imgError, setImgError] = useState(false);
  const hasPortrait = Boolean(s.image_url) && !imgError;
  const href = `/play/${s.setting_id}?gameId=${s.session_id}&characterId=${s._id}`;

  const theme = getSettingTheme({
    name: s.setting_name ?? '',
    genres: s.setting_genres ?? [],
    description: s.setting_description ?? '',
    theme: s.setting_theme,
  } as any);

  return (
    <Link
      href={href}
      className="group flex h-24 overflow-hidden rounded-2xl transition"
      style={{ border: `1px solid ${theme.border}`, background: theme.panel }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px 2px ${theme.glow}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Portrait */}
      <div className="relative w-16 shrink-0 overflow-hidden">
        {hasPortrait ? (
          <img
            src={s.image_url!}
            alt={s.name}
            className="h-full w-full object-cover object-top transition group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${theme.ambientA}, ${theme.ambientB})` }}
          >
            <span className="text-2xl font-bold select-none" style={{ color: theme.accentStrong, opacity: 0.4 }}>{s.name?.[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        {s.setting_name && (
          <p className="text-[10px] uppercase tracking-[0.2em] truncate" style={{ color: theme.accent }}>{s.setting_name}</p>
        )}
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: theme.text }}>{s.name}</p>
        <p className="text-xs" style={{ color: theme.textWeak }}>Lv.{s.level} {s.race}</p>
        <p className="text-xs" style={{ color: theme.muted }}>{s.class}</p>
      </div>
      {/* Actions */}
      <div className="flex flex-col items-center justify-between py-2 pr-2.5 gap-1">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(s._id, !s.pinned); }}
          aria-label={s.pinned ? 'Unpin character' : 'Pin character'}
          className="flex items-center justify-center w-6 h-6 rounded-full transition hover:scale-110"
          style={{ color: s.pinned ? theme.accentStrong : theme.muted, opacity: s.pinned ? 1 : 0.45 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={s.pinned ? 'currentColor' : 'none'}>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ color: theme.accent, opacity: 0.5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function ScrollableRow({ sessions, onTogglePin }: { sessions: ActiveSession[]; onTogglePin: (id: string, pinned: boolean) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [sessions]);

  const scrollRight = () => rowRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  const scrollLeft = () => rowRef.current?.scrollBy({ left: -240, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {sessions.map((s) => (
          <div key={s._id} className="w-56 shrink-0">
            <ContinueCard s={s} onTogglePin={onTogglePin} />
          </div>
        ))}
      </div>
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0f1118] via-[#0f1118]/90 to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0f1118] via-[#0f1118]/90 to-transparent" />
      )}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function About() {
  const { data: session } = useSession();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const sortedActiveSessions = useMemo(() => {
    return [...activeSessions].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.last_played ? new Date(a.last_played).getTime() : 0;
      const bTime = b.last_played ? new Date(b.last_played).getTime() : 0;
      return bTime - aTime;
    });
  }, [activeSessions]);

  const handleTogglePin = useCallback(async (characterId: string, pinned: boolean) => {
    setActiveSessions((prev) =>
      prev.map((s) => (s._id === characterId ? { ...s, pinned } : s))
    );
    try {
      await fetch(`/api/characters?characterId=${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
    } catch {
      // revert on failure
      setActiveSessions((prev) =>
        prev.map((s) => (s._id === characterId ? { ...s, pinned: !pinned } : s))
      );
    }
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    setSessionsLoading(true);
    fetch(`/api/characters?userId=${userId}`)
      .then((r) => r.json())
      .then(async (chars: any[]) => {
        const withSession = chars.filter((c) => c.session_id);
        const withNames = await Promise.all(
          withSession.map(async (c) => {
            if (!c.setting_id) return c;
            try {
              const r = await fetch(`/api/settings?settingId=${c.setting_id}`);
              const d = await r.json();
              return {
                ...c,
                setting_name: d.name ?? undefined,
                setting_genres: Array.isArray(d.genres) ? d.genres : [],
                setting_description: d.description ?? '',
                setting_theme: d.theme ?? undefined,
              };
            } catch {
              return c;
            }
          })
        );
        setActiveSessions(withNames);
      })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [session?.user?.id]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSettings = useCallback(async (page: number, genre: string, search: string) => {
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: 'most-voted' });
      if (genre) params.set('genre', genre);
      if (search) params.set('search', search);
      const response = await fetch(`/api/settings?${params}`);
      const data = await response.json();
      const nextSettings = Array.isArray(data.settings) ? data.settings : [];

      setSettings((prev) => (isInitialLoad ? nextSettings : [...prev, ...nextSettings]));

      if (Array.isArray(data.genres)) {
        setGenres(data.genres);
      }

      const fallbackTotalPages = typeof data.totalPages === 'number' ? data.totalPages : 0;
      const nextHasMore = typeof data.hasMore === 'boolean' ? data.hasMore : (page < fallbackTotalPages);
      setHasMore(nextHasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsFetchingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    setSettings([]);
    setHasMore(true);
    setCurrentPage(1);
    setIsFetchingMore(false);
    fetchSettings(1, selectedGenre, debouncedSearch);
  }, [selectedGenre, debouncedSearch, fetchSettings]);

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
  };

  const loadNextPage = useCallback(() => {
    if (loading || isFetchingMore || !hasMore) {
      return;
    }
    const nextPage = currentPage + 1;
    fetchSettings(nextPage, selectedGenre, debouncedSearch);
  }, [loading, isFetchingMore, hasMore, currentPage, fetchSettings, selectedGenre, debouncedSearch]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadNextPage();
      }
    }, { root: null, rootMargin: "0px 0px 300px 0px" });

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [loadNextPage, settings.length]);

  const isInitialLoading = loading && settings.length === 0;
  const gridSkeletons = Array.from({ length: 8 });
  const genreOptions: SelectOption[] = [
    { label: "All Genres", value: "" },
    ...genres.map((genre) => ({ label: genre, value: genre })),
  ];
  
  return (
    <div
      data-full-width="true"
      className="flex min-h-full w-full flex-col  text-gray-100"
    >
      <div className="relative mx-auto h-full w-full max-w-6xl overflow-auto px-5 py-8 pb-36 md:px-10">
        <div className="flex flex-col gap-8 mb-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Interactive Fiction Studio</p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight text-white">Infinite worlds, curated experiences, and smarter play.</h1>
            <p className="text-white/70 max-w-3xl">Browse featured settings, filter by genre, and jump straight into a session. Everything is tuned for immersive, multi-system play.</p>
            {/* <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 text-white font-semibold shadow-lg">Start a session</button>
              <button className="px-5 py-2.5 rounded-full border border-white/15 text-white/80 hover:border-white/40 transition">Create a world</button>
            </div> */}
          </div>

        </div>

        {/* Continue Playing */}
        {(sessionsLoading || activeSessions.length > 0) && (
          <div className="mb-8 space-y-3">
            <div>
              <h2 className="text-xl font-semibold">Continue Playing</h2>
              <span className="text-sm text-white/60">Jump back into an active session</span>
            </div>
            {sessionsLoading ? (
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 flex-1 animate-pulse rounded-2xl border border-white/8 bg-white/5" />
                ))}
              </div>
            ) : (
              <ScrollableRow sessions={sortedActiveSessions} onTogglePin={handleTogglePin} />
            )}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">All Worlds</h2>
                <span className="text-sm text-white/60">{debouncedSearch ? `Results for "${debouncedSearch}"` : 'Sorted by most voted'}</span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="relative w-full md:w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/30 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-rose-400/60">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Search</p>
                  <div className="relative mt-1 flex items-center">
                    <span className="pointer-events-none mr-2 shrink-0 text-white/40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search worlds…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/35 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-2 shrink-0 text-white/40 hover:text-white/80 transition"
                        aria-label="Clear search"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <CustomSelect
                  label="Genre"
                  options={genreOptions}
                  value={selectedGenre}
                  onChange={handleGenreChange}
                  placeholder="All Genres"
                  containerClassName="w-full min-w-0 md:w-auto md:min-w-[180px]"
                />
              </div>
            </div>
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {(isInitialLoading ? gridSkeletons : settings).map((setting: any, index) => (
                  isInitialLoading ? (
                    <SettingCardSkeleton key={`grid-skeleton-${index}`} />
                  ) : (
                    <SettingCard setting={setting} key={setting._id} onClick={() => {}} />
                  )
                ))}
              </div>
            </AnimatePresence>
            {!isInitialLoading && settings.length > 0 && <div ref={loadMoreRef} className="h-4" />}
            {isFetchingMore && (
              <div className="flex justify-center py-6">
                <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-t-4 border-t-rose-400 border-white/20 rounded-full" role="status">
                  <span className="visually-hidden hidden">Loading...</span>
                </div>
              </div>
            )}
            {!loading && !isFetchingMore && !hasMore && settings.length > 0 && (
              <p className="text-center text-white/60 text-sm">You&apos;ve reached the end.</p>
            )}
            {!loading && settings.length === 0 && (
              <div className="text-sm text-white/60">No worlds found. Try a different filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
