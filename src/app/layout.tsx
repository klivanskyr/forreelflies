import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import DevelopmentBanner from "@/components/DevelopmentBanner";
import UserProvider from "@/contexts/UserContext";
import type { Metadata } from "next";
import { Toaster } from "sonner";
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
          <main className="flex-grow w-full max-w-full overflow-x-hidden">
            {children}
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            duration={4000}
            closeButton={true}
            richColors={true}
            theme="light"
            style={{
              fontSize: '14px',
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
