"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type EventResponse = {
  id: number;
  status: string;
  user: { id: number; name: string };
};

type BroughtGame = {
  userId: number;
  userName: string;
  games: { id: number; title: string }[];
};

type Event = {
  id: number;
  date: string;
  responses: EventResponse[];
  eventGames?: BroughtGame[];
};

type User = { id: number; name: string };

type Props = {
  event: Event;
  currentUser: User;
  onRespond: (eventId: number, status: string) => void;
};

export default function EventCard({ event, currentUser, onRespond }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

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

  function handleGoingClick() {
    if (userResponse === "going") {
      // déjà inscrit — on garde le comportement existant
      onRespond(event.id, "going");
    } else {
      setShowDialog(true);
    }
  }

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
            onClick={handleGoingClick}
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
            {event.eventGames && event.eventGames.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jeux apportés</span>
                <div className="mt-1 space-y-0.5">
                  {event.eventGames.map((eg) => (
                    <p key={eg.userId} className="text-xs">
                      <span className="font-medium">{eg.userName}</span> amène{" "}
                      {eg.games.map((g) => g.title).join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {event.responses.length === 0 && (
              <p className="text-muted-foreground text-xs">Aucune réponse pour l&apos;instant.</p>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Veux-tu ramener des jeux ?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                setShowDialog(false);
                onRespond(event.id, "going");
                router.push(`/library?eventId=${event.id}`);
              }}
            >
              Oui, je choisis mes jeux
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                onRespond(event.id, "going");
              }}
            >
              Non, juste participer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
