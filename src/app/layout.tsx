import "./globals.css"
import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Pothpath",
  description: "An open library and blog.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
            <Navigation />
            {children}
            <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}