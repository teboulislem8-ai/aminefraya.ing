import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'aminefraya.ing — شريكك الزراعي الموثوق',
  description: 'مستلزمات زراعية، استشارات متخصصة، ومتابعة فردية لكل عميل — شرق الجزائر',
  keywords: 'زراعة، مبيدات، أسمدة، قسنطينة، شرق الجزائر، قمح، خضروات، حماية النباتات',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
