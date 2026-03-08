"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCaptureProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function ImageCapture({ value, onChange, disabled }: ImageCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {/* Aperçu de l'image */}
      {value && (
        <div className="rounded-lg overflow-hidden border relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Aperçu"
            className="w-full h-44 object-contain bg-muted"
          />
        </div>
      )}

      {/* Boutons */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            <Camera className="h-4 w-4" />
            {value ? "Changer la photo" : "Ajouter une photo"}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Supprimer
            </Button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // reset input pour permettre de re-sélectionner le même fichier
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
