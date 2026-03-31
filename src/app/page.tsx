"use client";

import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { BookOpen, Compass, ArrowLeftRight, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { currentUser } = useUser();

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">
          {currentUser ? `Bonjour, ${currentUser.name} !` : "Bienvenue !"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {currentUser
            ? "Que veux-tu faire aujourd'hui ?"
            : "Choisis ton profil en haut à droite pour commencer."}
        </p>
      </div>

      <div className="grid gap-3">
        <Link href="/library">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20">
            <CardContent className="flex items-center gap-4 pt-4 pb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Ma bibliothèque</p>
                <p className="text-sm text-muted-foreground">Gérer mes jeux</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/discover">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-4 pb-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Compass className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Découvrir</p>
                <p className="text-sm text-muted-foreground">
                  Parcourir les jeux des autres
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/exchanges">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-4 pb-4">
              <div className="rounded-full bg-green-100 p-3">
                <ArrowLeftRight className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Mes échanges</p>
                <p className="text-sm text-muted-foreground">
                  Suivre les demandes d&apos;échange
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/events">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-4 pb-4">
              <div className="rounded-full bg-purple-100 p-3">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Évènements</p>
                <p className="text-sm text-muted-foreground">
                  Séances de jeux à venir
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
