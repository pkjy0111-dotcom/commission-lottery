export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 서버 사이드에서는 service_role key를 사용해야 RLS 우회 가능
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: '코드를 입력해주세요.' }, { status: 400 })
  }

  // 1. 코드 확인
  const { data: codeData, error: codeError } = await supabaseAdmin
    .from('codes')
    .select('*')
    .eq('code', code.trim())
    .single()

  if (codeError || !codeData) {
    return NextResponse.json({ error: '유효하지 않은 코드입니다.' }, { status: 400 })
  }

  if (codeData.used) {
    return NextResponse.json({ error: '이미 사용된 코드입니다.' }, { status: 400 })
  }

  // 2. 남은 상품 확인
  const { data: prizes, error: prizesError } = await supabaseAdmin
    .from('prizes')
    .select('*')
    .gt('remaining', 0)
    .order('id', { ascending: true })

  if (prizesError) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  if (!prizes || prizes.length === 0) {
    return NextResponse.json({ error: '모든 상품이 소진되었습니다.' }, { status: 400 })
  }

  // 3. 남은 상품 총 수량 확인 (라스트원 체크)
  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0)

  // 4. 가중 랜덤 뽑기 (남은 수량 비례)
  const pool = []
  for (const prize of prizes) {
    for (let i = 0; i < prize.remaining; i++) {
      pool.push(prize)
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)]

  // 5. 상품 수량 차감
  const { error: updatePrizeError } = await supabaseAdmin
    .from('prizes')
    .update({ remaining: chosen.remaining - 1 })
    .eq('id', chosen.id)

  if (updatePrizeError) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  // 6. 코드 사용 처리
  const isLastOne = totalRemaining === 1
  const { error: updateCodeError } = await supabaseAdmin
    .from('codes')
    .update({
      used: true,
      result: isLastOne ? chosen.grade + ' + 라스트원상' : chosen.grade,
      used_at: new Date().toISOString()
    })
    .eq('id', codeData.id)


  if (updateCodeError) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }



  return NextResponse.json({
    grade: chosen.grade,
    label: chosen.label,
    isLastOne
  })
}
