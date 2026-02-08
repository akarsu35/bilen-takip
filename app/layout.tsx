import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ödev Takip Sistemi',
  description: 'Öğrenci ödev takip ve veli bilgilendirme sistemi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
