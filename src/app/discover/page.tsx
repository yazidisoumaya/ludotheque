"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Compass } from "lucide-react";

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
  userId: number;
  user: { id: number; name: string };
  activeExchange: ActiveExchange | null;
}

export default function DiscoverPage() {
  const { currentUser } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Game | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const url = currentUser
      ? `/api/games/discover?userId=${currentUser.id}`
      : "/api/games/discover";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      });
  }, [currentUser]);

  const handleRequest = async () => {
    if (!currentUser || !selected) return;
    setSubmitting(true);
    await fetch("/api/exchanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: currentUser.id,
        ownerId: selected.userId,
        gameId: selected.id,
        message,
      }),
    });
    setSubmitting(false);
    setSuccess(true);
    setMessage("");
  };

  const closeDialog = () => {
    setSelected(null);
    setSuccess(false);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Découvrir</h1>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Compass className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            {currentUser
              ? "Aucun autre jeu disponible pour le moment."
              : "Aucun jeu disponible pour le moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {games.map((game) => {
            const isMine = currentUser && currentUser.id === game.userId;
            const busy = !!game.activeExchange;
            return (
              <GameCard
                key={game.id}
                game={game}
                onClick={!isMine && !busy ? () => setSelected(game) : undefined}
                actions={
                  isMine ? undefined : busy ? (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      Emprunté par <span className="font-medium">{game.activeExchange!.requester.name}</span>
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(game);
                      }}
                    >
                      Échanger
                    </Button>
                  )
                }
              />
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {success ? "Demande envoyée !" : `Échanger "${selected?.title}"`}
            </DialogTitle>
          </DialogHeader>
          {success ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ta demande d&apos;échange a été envoyée à{" "}
                <span className="font-medium">{selected?.user.name}</span>. Tu pourras suivre
                son statut dans l&apos;onglet Échanges.
              </p>
              <Button onClick={closeDialog} className="w-full">
                Fermer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!currentUser ? (
                <p className="text-sm text-muted-foreground">
                  Sélectionne un profil pour envoyer une demande d&apos;échange.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Tu demandes l&apos;échange de ce jeu à{" "}
                    <span className="font-medium">{selected?.user.name}</span>.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optionnel)</Label>
                    <Textarea
                      id="message"
                      placeholder="Bonjour, je serais intéressé par ce jeu..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={closeDialog}>
                      Annuler
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleRequest}
                      disabled={submitting}
                    >
                      {submitting ? "Envoi..." : "Envoyer"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
