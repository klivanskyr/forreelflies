import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import DevelopmentBanner from "@/components/DevelopmentBanner";
import UserProvider from "@/contexts/UserContext";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
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
          <main className="flex-grow w-full">
            {children}
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
