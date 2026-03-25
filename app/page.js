'use client'

import { useState, useEffect } from 'react'

const GRADE_COLORS = {
  A: '#7b5ea7',
  B: '#7b5ea7',
  C: '#9b6aad',
  D: '#3a7ea8',
  E: '#2a8d7f',
  F: '#8b6aad',
  G: '#c47daa',
  H: '#888',
}

const TICKETS_PER_ROW = 100

export default function Home() {
  const [prizes, setPrizes] = useState([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [flipping, setFlipping] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    fetchPrizes()
  }, [])

  async function fetchPrizes() {
    const res = await fetch('/api/prizes?t=' + Date.now(), { cache: 'no-store' })
    const data = await res.json()
    if (Array.isArray(data)) setPrizes(data)
  }


  async function handleDraw() {
    if (!code.trim()) {
      setError('코드를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setShowResult(false)
    setFlipping(false)

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }
           setResult(data)
      setCode('')
      // 즉시 prizes 갱신
      await fetchPrizes()
      // 카드 뒤집기 연출 시작
      setFlipping(true)
      setTimeout(() => {
        setShowResult(true)
        setFlipping(false)
      }, 1500)

    } catch (e) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleDraw()
  }

  function closeResult() {
    setResult(null)
    setShowResult(false)
    setFlipping(false)
  }

  function chunkArray(arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0)
  const totalAll = prizes.reduce((sum, p) => sum + p.total, 0)
  const allSoldOut = totalRemaining === 0

  return (
    <div className="main-container">
      <div className="header">
        <h1>커미션 복권</h1>
        <div className="subtitle">YOIY 커미션용 복권</div>
        <div className="notice-text">각 등상의 상품이 소진되면 종료 표시가 됩니다.</div>
      </div>

      <div className="remaining-display">
        남은 복권: <strong>{totalRemaining}</strong> / {totalAll}장
      </div>

      <div className="prize-board">
        {prizes.map(prize => {
          const drawn = prize.total - prize.remaining
          const isSoldOut = prize.remaining === 0

          const allTickets = []
          for (let i = 0; i < prize.total; i++) {
            allTickets.push({ isDrawn: i < drawn, number: i + 1 })
          }

          const rows = chunkArray(allTickets, TICKETS_PER_ROW)

          return (
            <div className={`prize-section ${isSoldOut ? 'sold-out-row' : ''}`} key={prize.grade}>
              <div className="prize-left">
                <div className="prize-grade-label">
                  <span className="prize-grade-letter" style={{ color: GRADE_COLORS[prize.grade] }}>{prize.grade}</span> 상
                </div>
                <div className="prize-name">{prize.label}</div>
                <div className="prize-count-label">전 {prize.total}개</div>
              </div>
              <div className="prize-right">
                {rows.map((row, rowIdx) => (
                  <div className="ticket-row" key={rowIdx}>
                    {row.map((t, idx) => {
                      const isFirst = idx === 0
                      return (
                        <div
                          key={t.number}
                          className={`ticket ${t.isDrawn ? 'drawn' : ''}`}
                          style={{ zIndex: row.length - idx }}
                        >
                          <div className="ticket-body" style={{
                            alignItems: isFirst ? 'center' : 'flex-end',
                            paddingRight: isFirst ? '0px' : '3px',
                          }}>
                            <div className="ticket-stripe-top" />
                            <span className="ticket-number">
                              {t.number}
                            </span>
                            <div className="ticket-stripe-bottom" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="last-one-section">
        <h3>라스트원상</h3>
        <p>원하는 대로 — 마지막 1장을 뽑은 분에게!</p>
        <div className="status">{allSoldOut ? '종료!' : `남은 복권: ${totalRemaining}장`}</div>
      </div>

      <div className="draw-section">
        {allSoldOut ? (
          <div className="sold-out-message">모든 복권이 소진되었습니다!</div>
        ) : (
          <>
            <h2>코드를 입력하세요</h2>
            <input
              type="text"
              className="code-input"
              placeholder="XXXXXXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              disabled={loading || flipping}
              maxLength={8}
            />
            <br />
            <button className="draw-btn" onClick={handleDraw} disabled={loading || flipping}>
              {loading ? '추첨 중...' : '뽑기!'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </div>

      {/* 카드 뒤집기 연출 */}
      {(flipping || showResult) && result && (
        <div className="modal-overlay" onClick={showResult ? closeResult : undefined}>
          <div className={`flip-card ${showResult ? 'flipped' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="flip-card-inner">
              {/* 카드 뒷면 (뒤집기 전) */}
              <div className="flip-card-back">
                <div className="card-back-design">
                  <div className="card-back-text">커미션 복권</div>
                  <div className="card-back-sub">YOIY</div>
                </div>
              </div>
              {/* 카드 앞면 (결과) */}
              <div className="flip-card-front">
                {result.isLastOne && (
                  <div style={{ color: '#7b5ea7', fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>
                    🏆 라스트원상 획득!
                  </div>
                )}
                <div className="modal-grade" style={{ color: GRADE_COLORS[result.grade] || '#8b6aad' }}>{result.grade}상</div>
                <div className="modal-label">{result.label}</div>
                <div className="modal-message">{result.isLastOne ? '축하합니다! 라스트원상까지 획득하셨습니다!' : '당첨을 축하합니다!'}</div>
                {showResult && <button className="modal-close-btn" onClick={closeResult}>확인</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
