"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

export interface BggGame {
  bggId: string;
  title: string;
  thumbnail: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minAge: number | null;
  yearPublished: string | null;
  category: string;
}

interface BggSearchProps {
  onSelect: (game: BggGame) => void;
}

export default function BggSearch({ onSelect }: BggSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BggGame[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setStatus("loading");
      setOpen(true);
      try {
        const res = await fetch(`/api/games/bgg-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setStatus("done");
        } else {
          setResults([]);
          setStatus("error");
        }
      } catch {
        setResults([]);
        setStatus("error");
      }
    }, 500);
  }, [query]);

  const handleSelect = (game: BggGame) => {
    onSelect(game);
    setQuery(game.title);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setStatus("idle");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un jeu sur BoardGameGeek..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg overflow-hidden">
          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche sur BoardGameGeek...
            </div>
          )}

          {status === "error" && (
            <p className="px-4 py-3 text-sm text-destructive">
              Erreur lors de la recherche. Vérifie ta connexion.
            </p>
          )}

          {status === "done" && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat pour &ldquo;{query}&rdquo;
            </p>
          )}

          {status === "done" && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto divide-y">
              {results.map((game) => (
                <li key={game.bggId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(game)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                  >
                    {game.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="h-12 w-12 rounded object-cover shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                        🎲
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{game.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[
                          game.yearPublished,
                          game.category,
                          game.minPlayers && game.maxPlayers
                            ? `${game.minPlayers}–${game.maxPlayers} joueurs`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
