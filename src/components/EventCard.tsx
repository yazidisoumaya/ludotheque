"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type EventResponse = {
  id: number;
  status: string;
  user: { id: number; name: string };
};

type Event = {
  id: number;
  date: string;
  responses: EventResponse[];
};

type User = { id: number; name: string };

type Props = {
  event: Event;
  currentUser: User;
  onRespond: (eventId: number, status: string) => void;
};

export default function EventCard({ event, currentUser, onRespond }: Props) {
  const [open, setOpen] = useState(false);

  const userResponse = event.responses.find((r) => r.user.id === currentUser.id)?.status ?? null;
  const goingCount = event.responses.filter((r) => r.status === "going").length;

  const formattedDate = new Date(event.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const going = event.responses.filter((r) => r.status === "going");
  const maybe = event.responses.filter((r) => r.status === "maybe");
  const absent = event.responses.filter((r) => r.status === "absent");

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium capitalize">{formattedDate}</span>
          <Badge variant="secondary">
            {goingCount} participant{goingCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={userResponse === "going" ? "default" : "outline"}
            className={cn("flex-1", userResponse === "going" && "ring-2 ring-primary ring-offset-1")}
            onClick={() => onRespond(event.id, "going")}
          >
            Je participe
          </Button>
          <Button
            size="sm"
            variant={userResponse === "maybe" ? "secondary" : "outline"}
            className={cn("flex-1", userResponse === "maybe" && "ring-2 ring-primary ring-offset-1")}
            onClick={() => onRespond(event.id, "maybe")}
          >
            Peut-être
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn("flex-1", userResponse === "absent" && "ring-2 ring-primary ring-offset-1")}
            onClick={() => onRespond(event.id, "absent")}
          >
            Je passe
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Voir les participants
        </button>

        {open && (
          <div className="space-y-2 text-sm border-t pt-2">
            {going.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {going.map((r) => <Badge key={r.id} variant="default">{r.user.name}</Badge>)}
                </div>
              </div>
            )}
            {maybe.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peut-être</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {maybe.map((r) => <Badge key={r.id} variant="secondary">{r.user.name}</Badge>)}
                </div>
              </div>
            )}
            {absent.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Absents</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {absent.map((r) => <Badge key={r.id} variant="outline">{r.user.name}</Badge>)}
                </div>
              </div>
            )}
            {event.responses.length === 0 && (
              <p className="text-muted-foreground text-xs">Aucune réponse pour l&apos;instant.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
