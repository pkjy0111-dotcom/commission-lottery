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


    // 상품 수량 초기화 — total 값으로 자동 복구
  const { data: prizes } = await supabaseAdmin
    .from('prizes')
    .select('id, total')

  for (const p of prizes) {
    await supabaseAdmin
      .from('prizes')
      .update({ remaining: p.total })
      .eq('id', p.id)
  }


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
