"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import ExchangeCard from "@/components/ExchangeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight } from "lucide-react";

interface Exchange {
  id: number;
  status: string;
  message?: string | null;
  ownerMessage?: string | null;
  createdAt: string;
  requesterId: number;
  ownerId: number;
  game: { id: number; title: string };
  requester: { id: number; name: string };
  owner: { id: number; name: string };
}

export default function ExchangesPage() {
  const { currentUser } = useUser();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExchanges = () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetch(`/api/exchanges?userId=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        setExchanges(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExchanges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleStatusChange = async (exchangeId: number, status: string, ownerMessage?: string) => {
    await fetch(`/api/exchanges/${exchangeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ownerMessage }),
    });
    fetchExchanges();
  };

  const received = exchanges.filter((e) => e.ownerId === currentUser?.id);
  const sent = exchanges.filter((e) => e.requesterId === currentUser?.id);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="font-semibold">Profil requis</p>
          <p className="text-sm text-muted-foreground">
            Sélectionne ton profil pour voir tes échanges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mes échanges</h1>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : (
        <Tabs defaultValue="received">
          <TabsList className="w-full">
            <TabsTrigger value="received" className="flex-1">
              Reçus ({received.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">
              Envoyés ({sent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {received.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">
                Aucune demande reçue.
              </p>
            ) : (
              <div className="grid gap-3">
                {received.map((ex) => (
                  <ExchangeCard
                    key={ex.id}
                    exchange={ex}
                    currentUserId={currentUser.id}
                    onStatusChange={(status, ownerMessage) => handleStatusChange(ex.id, status, ownerMessage)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {sent.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">
                Aucune demande envoyée.
              </p>
            ) : (
              <div className="grid gap-3">
                {sent.map((ex) => (
                  <ExchangeCard
                    key={ex.id}
                    exchange={ex}
                    currentUserId={currentUser.id}
                    onStatusChange={(status, ownerMessage) => handleStatusChange(ex.id, status, ownerMessage)}
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
