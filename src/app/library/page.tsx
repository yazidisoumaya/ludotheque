"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Game {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  minAge?: number | null;
  user?: { name: string };
}

export default function LibraryPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetch(`/api/games?userId=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="font-semibold">Profil requis</p>
          <p className="text-sm text-muted-foreground">
            Sélectionne ou crée ton profil pour voir ta bibliothèque.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ma bibliothèque</h1>
        <Link href="/library/add">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Tu n&apos;as pas encore de jeux dans ta bibliothèque.
          </p>
          <Link href="/library/add">
            <Button variant="outline" size="sm">
              Ajouter mon premier jeu
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => router.push(`/library/${game.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
