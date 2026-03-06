"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, BookOpen, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActiveExchange {
  id: number;
  status: string;
  requester: { id: number; name: string };
}

interface Game {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  minAge?: number | null;
  imageUrl?: string | null;
  user?: { name: string };
  activeExchange: ActiveExchange | null;
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

  const collection = games.filter((g) => !g.activeExchange);
  const lent = games.filter((g) => !!g.activeExchange);

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
      ) : (
        <Tabs defaultValue="collection">
          <TabsList className="w-full">
            <TabsTrigger value="collection" className="flex-1">
              Ma collection
              {games.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({collection.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="lent" className="flex-1">
              Prêtés
              {lent.length > 0 && (
                <span className="ml-1.5 text-xs font-medium text-primary">({lent.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ma collection */}
          <TabsContent value="collection" className="mt-3">
            {collection.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {games.length === 0
                    ? "Tu n'as pas encore de jeux dans ta bibliothèque."
                    : "Tous tes jeux sont actuellement prêtés !"}
                </p>
                {games.length === 0 && (
                  <Link href="/library/add">
                    <Button variant="outline" size="sm">
                      Ajouter mon premier jeu
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {collection.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() => router.push(`/library/${game.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Prêtés */}
          <TabsContent value="lent" className="mt-3">
            {lent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <ArrowLeftRight className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Aucun jeu en cours de prêt.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {lent.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() => router.push(`/library/${game.id}`)}
                    actions={
                      <p className="text-xs text-muted-foreground">
                        Prêté à{" "}
                        <span className="font-medium">
                          {game.activeExchange!.requester.name}
                        </span>
                        {" · "}
                        <span className={game.activeExchange!.status === "accepted" ? "text-green-600" : "text-amber-600"}>
                          {game.activeExchange!.status === "accepted" ? "Accepté" : "En attente"}
                        </span>
                      </p>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
