import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AppKit } from "../context/appkit";

import "./globals.css";

export const metadata: Metadata = {
  title: 'Visionland',
  description: 'Visionland',
  generator: 'Visionland',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AppKit>{children}</AppKit>
      </body>
    </html>
  )
}