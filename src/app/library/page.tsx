"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, BookOpen, HandHelping } from "lucide-react";
import { useRouter } from "next/navigation";

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
  activeExchange?: { id: number; status: string; requester: { id: number; name: string } } | null;
}

interface BorrowedExchange {
  id: number;
  status: string;
  requesterId: number;
  owner: { id: number; name: string };
  game: Game;
}

export default function LibraryPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [borrowed, setBorrowed] = useState<BorrowedExchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`/api/games?userId=${currentUser.id}`).then((r) => r.json()),
      fetch(`/api/exchanges?userId=${currentUser.id}`).then((r) => r.json()),
    ]).then(([gamesData, exchangesData]) => {
      setGames(gamesData);
      // Emprunts = échanges où je suis le demandeur, en cours (pending/accepted)
      setBorrowed(
        (exchangesData as BorrowedExchange[]).filter(
          (e) => e.requesterId === currentUser.id && ["pending", "accepted"].includes(e.status)
        )
      );
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
      ) : (
        <Tabs defaultValue="collection">
          <TabsList className="w-full">
            <TabsTrigger value="collection" className="flex-1">
              Ma collection
              {games.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({games.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="borrowed" className="flex-1">
              Mes emprunts
              {borrowed.length > 0 && (
                <span className="ml-1.5 text-xs font-medium text-primary">({borrowed.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ma collection */}
          <TabsContent value="collection" className="mt-3">
            {games.length === 0 ? (
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
          </TabsContent>

          {/* Onglet Mes emprunts */}
          <TabsContent value="borrowed" className="mt-3">
            {borrowed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <HandHelping className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Tu n&apos;as aucun emprunt en cours.
                </p>
                <Link href="/discover">
                  <Button variant="outline" size="sm">
                    Découvrir des jeux
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {borrowed.map((exchange) => (
                  <GameCard
                    key={exchange.id}
                    game={exchange.game}
                    actions={
                      <p className="text-xs text-muted-foreground">
                        Emprunté à{" "}
                        <span className="font-medium">{exchange.owner.name}</span>
                        {" · "}
                        <span className={exchange.status === "accepted" ? "text-green-600" : "text-amber-600"}>
                          {exchange.status === "accepted" ? "Accepté" : "En attente"}
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
