"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  accepted: { label: "Accepté", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
  completed: { label: "Terminé", variant: "outline" },
};

interface Exchange {
  id: number;
  status: string;
  message?: string | null;
  createdAt: string;
  game: { id: number; title: string };
  requester: { id: number; name: string };
  owner: { id: number; name: string };
}

interface ExchangeCardProps {
  exchange: Exchange;
  currentUserId: number;
  onStatusChange?: (status: string) => void;
}

export default function ExchangeCard({ exchange, currentUserId, onStatusChange }: ExchangeCardProps) {
  const isOwner = exchange.owner.id === currentUserId;
  const status = STATUS_MAP[exchange.status] ?? { label: exchange.status, variant: "secondary" as const };
  const date = new Date(exchange.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{exchange.game.title}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>{exchange.requester.name}</span>
              <ArrowRight className="h-3 w-3" />
              <span>{exchange.owner.name}</span>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {exchange.message && (
          <p className="text-xs text-muted-foreground italic">&ldquo;{exchange.message}&rdquo;</p>
        )}

        <p className="text-xs text-muted-foreground">{date}</p>

        {isOwner && exchange.status === "pending" && onStatusChange && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => onStatusChange("accepted")}
            >
              Accepter
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onStatusChange("rejected")}
            >
              Refuser
            </Button>
          </div>
        )}

        {isOwner && exchange.status === "accepted" && onStatusChange && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onStatusChange("completed")}
          >
            Jeu récupéré
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
