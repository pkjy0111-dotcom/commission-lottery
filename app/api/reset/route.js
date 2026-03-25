import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀립니다.' }, { status: 401 })
  }

  // 상품 수량 초기화
  const prizeDefaults = [
    { grade: 'A', remaining: 1 },
    { grade: 'B', remaining: 2 },
    { grade: 'C', remaining: 3 },
    { grade: 'D', remaining: 9 },
    { grade: 'E', remaining: 11 },
    { grade: 'F', remaining: 15 },
    { grade: 'G', remaining: 20 },
    { grade: 'H', remaining: 39 },
  ]

  for (const p of prizeDefaults) {
    await supabaseAdmin
      .from('prizes')
      .update({ remaining: p.remaining })
      .eq('grade', p.grade)
  }

  // 코드 전부 삭제
  await supabaseAdmin
    .from('codes')
    .delete()
    .neq('id', 0)

  return NextResponse.json({ success: true })
}
