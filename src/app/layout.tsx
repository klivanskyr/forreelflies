import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
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
      <body className="min-h-[98vh] flex flex-col w-full items-center">
        <UserProvider>
          <Navbar />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
