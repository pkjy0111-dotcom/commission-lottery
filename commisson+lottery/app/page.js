'use client'

import { useState, useEffect } from 'react'

const GRADE_COLORS = {
  A: '#ffd700',
  B: '#ff6b6b',
  C: '#ff9ff3',
  D: '#48dbfb',
  E: '#1dd1a1',
  F: '#a29bfe',
  G: '#fd79a8',
  H: '#b2bec3',
}

export default function Home() {
  const [prizes, setPrizes] = useState([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [drawnCodes, setDrawnCodes] = useState([])

  useEffect(() => {
    fetchPrizes()
    fetchDrawnCodes()
  }, [])

  async function fetchPrizes() {
    const res = await fetch('/api/prizes')
    const data = await res.json()
    if (Array.isArray(data)) setPrizes(data)
  }

  async function fetchDrawnCodes() {
    // 공개 조회: 뽑힌 결과만 가져오기
    const res = await fetch('/api/prizes')
    // drawn codes는 prizes에서 total - remaining으로 계산
  }

  async function handleDraw() {
    if (!code.trim()) {
      setError('코드를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setResult(data)
      setCode('')
      fetchPrizes()
    } catch (e) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleDraw()
  }

  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0)
  const totalAll = prizes.reduce((sum, p) => sum + p.total, 0)
  const allSoldOut = totalRemaining === 0

  return (
    <div className="main-container">
      {/* 헤더 */}
      <div className="header">
        <div className="character-placeholder">[ 캐릭터 이미지 영역 ]</div>
        <h1>커미션 복권</h1>
        <div className="subtitle">YOIY 커미션용 복권</div>
        <div className="price-tag">1회 ₩10,000</div>
      </div>

      {/* 상품 현황판 */}
      <div className="prize-board">
        {prizes.map((prize) => {
          const drawn = prize.total - prize.remaining
          const slots = []
          for (let i = 0; i < prize.total; i++) {
            slots.push(
              <div key={i} className={`slot ${i < drawn ? 'drawn' : ''}`}>
                {i < drawn ? '끝' : ''}
              </div>
            )
          }

          return (
            <div
              key={prize.grade}
              className={`prize-row grade-${prize.grade} ${prize.remaining === 0 ? 'sold-out' : ''}`}
            >
              <div className="prize-grade">{prize.grade}</div>
              <div className="prize-info">
                <div className="prize-label">{prize.label}</div>
                <div className="prize-count">
                  잔여 {prize.remaining}/{prize.total}
                </div>
              </div>
              <div className="prize-slots">{slots}</div>
            </div>
          )
        })}
      </div>

      {/* 라스트원상 */}
      <div className="last-one-banner">
        <h3>🏆 라스트원상</h3>
        <p>원하는 대로 — 마지막 1장을 뽑은 분에게!</p>
        <div className="status" style={{ color: allSoldOut ? '#ff6b6b' : '#c4a24e' }}>
          {allSoldOut ? '종료!' : `남은 복권: ${totalRemaining}장`}
        </div>
      </div>

      {/* 뽑기 섹션 */}
      <div className="draw-section">
        {allSoldOut ? (
          <div className="sold-out-message">모든 복권이 소진되었습니다!</div>
        ) : (
          <>
            <h2>코드를 입력하세요</h2>
            <input
              type="text"
              className="code-input"
              placeholder="코드 입력"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={8}
            />
            <br />
            <button
              className="draw-btn"
              onClick={handleDraw}
              disabled={loading}
            >
              {loading ? '추첨 중...' : '뽑기!'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </div>

      {/* 결과 모달 */}
      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {result.isLastOne && (
              <div style={{ color: '#ffd700', fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>
                🏆 라스트원상 획득!
              </div>
            )}
            <div
              className="modal-grade"
              style={{ color: GRADE_COLORS[result.grade] || '#fff' }}
            >
              {result.grade}상
            </div>
            <div className="modal-label">{result.label}</div>
            <div className="modal-message">
              {result.isLastOne
                ? '축하합니다! 라스트원상까지 획득하셨습니다!'
                : '당첨을 축하합니다!'}
            </div>
            <button className="modal-close-btn" onClick={() => setResult(null)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
