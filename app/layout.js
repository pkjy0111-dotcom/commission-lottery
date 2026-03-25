import './globals.css'

export const metadata = {
  title: 'YOIY 커미션 복권',
  description: 'YOIY 크레페 커미션용 복권 페이지 입니다.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
