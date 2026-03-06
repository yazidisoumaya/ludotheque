"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Stratégie", "Coopératif", "Famille", "Ambiance",
  "Réflexion", "Cartes", "Dés", "Autre",
];

interface Game {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  minAge?: number | null;
  userId: number;
  user: { id: number; name: string };
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useUser();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    minPlayers: "",
    maxPlayers: "",
    minAge: "",
  });

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then((r) => r.json())
      .then((data: Game) => {
        setGame(data);
        setForm({
          title: data.title,
          description: data.description ?? "",
          category: data.category ?? "",
          minPlayers: data.minPlayers?.toString() ?? "",
          maxPlayers: data.maxPlayers?.toString() ?? "",
          minAge: data.minAge?.toString() ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/games/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/library");
  };

  const handleDelete = async () => {
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    router.push("/library");
  };

  const isOwner = currentUser?.id === game?.userId;

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>;
  }
  if (!game) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Jeu introuvable.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/library">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold truncate max-w-[180px]">{game.title}</h1>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!isOwner && (
        <p className="text-sm text-muted-foreground">
          Jeu de <span className="font-medium">{game.user.name}</span> — lecture seule
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            disabled={!isOwner}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            disabled={!isOwner}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <select
            id="category"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            disabled={!isOwner}
          >
            <option value="">-- Choisir --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minPlayers">Min joueurs</Label>
            <Input
              id="minPlayers"
              type="number"
              min={1}
              value={form.minPlayers}
              onChange={(e) => update("minPlayers", e.target.value)}
              disabled={!isOwner}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max joueurs</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => update("maxPlayers", e.target.value)}
              disabled={!isOwner}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minAge">Âge min</Label>
            <Input
              id="minAge"
              type="number"
              min={1}
              value={form.minAge}
              onChange={(e) => update("minAge", e.target.value)}
              disabled={!isOwner}
            />
          </div>
        </div>
        {isOwner && (
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Sauvegarder"}
          </Button>
        )}
      </form>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce jeu ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le jeu et ses échanges associés seront supprimés.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
