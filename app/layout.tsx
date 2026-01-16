import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { Toaster } from "@/components/ui/toaster"
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'LendGrid SaaS App',
  description: 'For the financial services industry. A Lending Aggregator Platform',
  icons: {
    icon: "/logo2.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>
          {`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}
        </style>
      </head>

      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
