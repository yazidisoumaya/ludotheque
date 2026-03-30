import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import BottomNav from "@/components/BottomNav";
import UserSelector from "@/components/UserSelector";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ludothèque",
  description: "Gérez et échangez vos jeux de société",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${geist.className} antialiased`}>
        <UserProvider>
          <div className="min-h-screen flex flex-col max-w-lg mx-auto">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
              <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Image src="/logo.png" alt="Ludothèque" width={40} height={40} className="object-contain" />
                  Ludothèque
                </div>
                <UserSelector />
              </div>
            </header>
            <main className="flex-1 pb-20 px-4 pt-4">{children}</main>
            <BottomNav />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
