"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

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

interface GameCardProps {
  game: Game;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export default function GameCard({ game, onClick, actions }: GameCardProps) {
  return (
    <Card
      className={`transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{game.title}</CardTitle>
          {game.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {game.category}
            </Badge>
          )}
        </div>
        {game.user && (
          <p className="text-xs text-muted-foreground">par {game.user.name}</p>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        {game.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {game.description}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(game.minPlayers || game.maxPlayers) && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} joueurs`
                : `${game.minPlayers ?? "?"}–${game.maxPlayers ?? "?"} joueurs`}
            </span>
          )}
          {game.minAge && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {game.minAge}+ ans
            </span>
          )}
        </div>
        {actions && <div className="mt-3">{actions}</div>}
      </CardContent>
    </Card>
  );
}
