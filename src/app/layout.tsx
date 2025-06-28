import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import DevelopmentBanner from "@/components/DevelopmentBanner";
import UserProvider from "@/contexts/UserContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "For Reel Flies",
  description: "Fly fishing marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col w-full">
        <UserProvider>
          <DevelopmentBanner />
          <Navbar />
          <main className="flex-grow w-full mt-[120px] md:mt-[140px]">
            {children}
          </main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
