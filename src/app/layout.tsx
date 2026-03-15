import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PeerWeave — Community Relationship Infrastructure",
  description:
    "Automatically build meaningful peer-to-peer relationships in your community through AI-powered matchmaking, onboarding buddies, and help network analysis.",
  openGraph: {
    title: "PeerWeave",
    description: "The relationship infrastructure layer for communities.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
