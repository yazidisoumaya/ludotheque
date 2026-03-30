"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import EventCard from "@/components/EventCard";

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

export default function EventsPage() {
  const { currentUser } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
  }

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
  }, []);

  async function handleRespond(eventId: number, status: string) {
    if (!currentUser) return;
    await fetch(`/api/events/${eventId}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, status }),
    });
    await fetchEvents();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Séances à venir</h1>

      {!currentUser && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground text-center">
          <CalendarDays className="h-10 w-10 opacity-30" />
          <p>Sélectionne ton profil pour répondre aux séances.</p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement...</p>
      ) : (
        <div className="grid gap-3">
          {events.map((event) =>
            currentUser ? (
              <EventCard
                key={event.id}
                event={event}
                currentUser={currentUser}
                onRespond={handleRespond}
              />
            ) : (
              <div key={event.id} className="rounded-lg border p-4 text-sm text-muted-foreground capitalize">
                {new Date(event.date).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
