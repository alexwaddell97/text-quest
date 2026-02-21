"use client"
import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

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

export default function About() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchSettings = useCallback(async (page: number, genre: string) => {
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await fetch(`/api/settings?page=${page}&limit=${PAGE_SIZE}&genre=${genre}&sort=most-voted`);
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
    fetchSettings(1, selectedGenre);
  }, [selectedGenre, fetchSettings]);

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
  };

  const loadNextPage = useCallback(() => {
    if (loading || isFetchingMore || !hasMore) {
      return;
    }
    const nextPage = currentPage + 1;
    fetchSettings(nextPage, selectedGenre);
  }, [loading, isFetchingMore, hasMore, currentPage, fetchSettings, selectedGenre]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadNextPage();
      }
    }, { root: null, rootMargin: "300px 0px 0px 0px" });

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
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight text-white">Infinite worlds, curated experiences, and smarter play with AI.</h1>
            <p className="text-white/70 max-w-3xl">Browse featured settings, filter by genre, and jump straight into a session. Everything is tuned for immersive, multi-system play.</p>
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 text-white font-semibold shadow-lg">Start a session</button>
              <button className="px-5 py-2.5 rounded-full border border-white/15 text-white/80 hover:border-white/40 transition">Create a world</button>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">All Worlds</h2>
                <span className="text-sm text-white/60">Sorted by most voted</span>
              </div>
              <CustomSelect
                label="Genre"
                options={genreOptions}
                value={selectedGenre}
                onChange={handleGenreChange}
                placeholder="All Genres"
                containerClassName="w-full min-w-0 md:w-auto md:min-w-[180px] md:ml-auto"
              />
            </div>
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {(isInitialLoading ? gridSkeletons : settings).map((setting: any, index) => (
                  isInitialLoading ? (
                    <SettingCardSkeleton key={`grid-skeleton-${index}`} />
                  ) : (
                    <SettingCard setting={setting} key={index} onClick={() => {}} />
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
              <p className="text-center text-white/60 text-sm">You've reached the end.</p>
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
