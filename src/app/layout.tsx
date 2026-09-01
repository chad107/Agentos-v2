import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";
import { AskCohenProvider } from "@/components/cohen/ask-cohen-context";
import { AskCohenPanel } from "@/components/cohen/AskCohenPanel";
import { AskCohenLauncher } from "@/components/cohen/AskCohenLauncher";
import { attentionCounters } from "@/core";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AgentOS — Valley River Heat Pumps",
  description: "Cohen, AI Operations Manager — recommendations, approvals and operating visibility for Valley River Heat Pumps."
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const counters = attentionCounters();

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AskCohenProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <TopBar urgentCount={counters.urgentExceptions} pendingCount={counters.pendingApprovals} />
              <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-8 lg:pb-8">{children}</main>
            </div>
          </div>
          <MobileNav />
          <AskCohenLauncher />
          <AskCohenPanel />
        </AskCohenProvider>
      </body>
    </html>
  );
}
