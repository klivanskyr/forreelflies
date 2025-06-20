import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import UserProvider from "@/contexts/UserContext";

export const metadata: Metadata = {
  title: "ForReelFlies",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-[98vh] flex flex-col w-full items-center">
        <UserProvider initialUser={null} loading={true}>
          <Navbar />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
