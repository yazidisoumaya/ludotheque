"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

interface UserData {
  id: number;
  name: string;
}

export default function UserSelector() {
  const { currentUser, setCurrentUser } = useUser();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const handleSelect = (value: string) => {
    const user = users.find((u) => u.id === parseInt(value));
    if (user) {
      setCurrentUser(user);
      setOpen(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const user = await res.json();
    setCurrentUser(user);
    setNewName("");
    setCreating(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80 transition-colors"
      >
        <User className="h-4 w-4" />
        <span className="max-w-[120px] truncate">
          {currentUser ? currentUser.name : "Choisir un profil"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Qui es-tu ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center">Chargement...</p>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Sélectionner un profil existant</p>
                <Select onValueChange={handleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">Créer un nouveau profil</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ton prénom ou pseudo..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? "..." : "Créer"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
