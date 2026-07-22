import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mishkak Inventory",
  description: "Daily purchases, usage tracking, and reports for Mishkak",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <NavBar session={session} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
