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
      {/* Cover image */}
      {game.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.imageUrl}
          alt={game.title}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center text-3xl select-none">
          🎲
        </div>
      )}

      <CardContent className="px-2.5 pt-2 pb-2 flex flex-col flex-1 gap-1">
        {/* Titre */}
        <p className="text-xs font-semibold leading-tight line-clamp-2">{game.title}</p>

        {/* Catégorie */}
        {game.category && (
          <Badge variant="secondary" className="self-start text-xs px-1.5 py-0">
            {game.category}
          </Badge>
        )}

        {/* Nombre de joueurs */}
        {(game.minPlayers || game.maxPlayers) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3 shrink-0" />
            {game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} j`
              : `${game.minPlayers ?? "?"}–${game.maxPlayers ?? "?"} j`}
          </span>
        )}

        {/* Détenteur */}
        {game.user && (
          <p className="text-xs text-muted-foreground truncate">par {game.user.name}</p>
        )}

        {/* Bouton */}
        {actions && <div className="mt-auto pt-1.5">{actions}</div>}
      </CardContent>
    </Card>
  );
}
