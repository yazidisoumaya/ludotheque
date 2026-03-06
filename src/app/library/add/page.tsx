"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BggSearch, { type BggGame } from "@/components/BggSearch";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Stratégie",
  "Coopératif",
  "Famille",
  "Ambiance",
  "Réflexion",
  "Cartes",
  "Dés",
  "Autre",
];

interface GameForm {
  title: string;
  description: string;
  category: string;
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  imageUrl: string;
}

export default function AddGamePage() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GameForm>({
    title: "",
    description: "",
    category: "",
    minPlayers: "",
    maxPlayers: "",
    minAge: "",
    imageUrl: "",
  });

  const update = (field: keyof GameForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleBggSelect = (game: BggGame) => {
    setForm({
      title: game.title,
      description: game.description ?? "",
      category: game.category,
      minPlayers: game.minPlayers?.toString() ?? "",
      maxPlayers: game.maxPlayers?.toString() ?? "",
      minAge: game.minAge?.toString() ?? "",
      imageUrl: game.thumbnail ?? "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId: currentUser.id }),
    });
    router.push("/library");
  };

  if (!currentUser) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Sélectionne un profil pour ajouter un jeu.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/library">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Ajouter un jeu</h1>
      </div>

      {/* BGG Search */}
      <div className="space-y-1.5">
        <Label>Recherche rapide 🎲</Label>
        <BggSearch onSelect={handleBggSelect} />
        <p className="text-xs text-muted-foreground">
          Sélectionne un jeu pour préremplir les champs automatiquement.
        </p>
      </div>

      <div className="border-t pt-2" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image preview */}
        {form.imageUrl && (
          <div className="rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt={form.title}
              className="w-full h-44 object-contain bg-muted"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            placeholder="Ex: Catan, Dixit..."
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Décris le jeu en quelques mots..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <select
            id="category"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="">-- Choisir --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minPlayers">Joueurs min</Label>
            <Input
              id="minPlayers"
              type="number"
              min={1}
              placeholder="2"
              value={form.minPlayers}
              onChange={(e) => update("minPlayers", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Joueurs max</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={1}
              placeholder="6"
              value={form.maxPlayers}
              onChange={(e) => update("maxPlayers", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minAge">Âge min</Label>
            <Input
              id="minAge"
              type="number"
              min={1}
              placeholder="8"
              value={form.minAge}
              onChange={(e) => update("minAge", e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Ajouter le jeu"}
        </Button>
      </form>
    </div>
  );
}
