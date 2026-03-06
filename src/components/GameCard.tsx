"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

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
}

interface GameCardProps {
  game: Game;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export default function GameCard({ game, onClick, actions }: GameCardProps) {
  return (
    <Card
      className={`transition-shadow overflow-hidden flex flex-col py-0 gap-0 ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={onClick}
    >
      {/* Cover image from BGG */}
      {game.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.imageUrl}
          alt={game.title}
          className="w-full h-20 object-cover"
        />
      )}

      <CardContent className="px-3 pt-2 pb-2 flex flex-col flex-1 gap-1">
        {/* Titre */}
        <p className="text-sm font-semibold leading-tight">{game.title}</p>

        {/* Détenteur + catégorie */}
        <div className="flex items-center justify-between gap-1">
          {game.user ? (
            <p className="text-xs text-muted-foreground truncate">par {game.user.name}</p>
          ) : <span />}
          {game.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {game.category}
            </Badge>
          )}
        </div>

        {/* Nombre de joueurs */}
        {(game.minPlayers || game.maxPlayers) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} joueurs`
              : `${game.minPlayers ?? "?"}–${game.maxPlayers ?? "?"} joueurs`}
          </span>
        )}

        {/* Bouton */}
        {actions && <div className="mt-auto pt-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}
