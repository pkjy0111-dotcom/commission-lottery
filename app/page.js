'use client'

import { useState, useEffect } from 'react'

const GRADE_COLORS = {
  A: '#e63946',
  B: '#e63946',
  C: '#d4548a',
  D: '#3a86a8',
  E: '#2a9d8f',
  F: '#7b5ea7',
  G: '#c47daa',
  H: '#777',
}

export default function Home() {
  const [prizes, setPrizes] = useState([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPrizes()
  }, [])

  async function fetchPrizes() {
    const res = await fetch('/api/prizes')
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
        <div className="notice-text">
          각 등상의 상품이 소진되면 종료 표시가 됩니다.
        </div>
      </div>

      {/* 남은 수량 */}
      <div className="remaining-display">
        남은 복권: <strong>{totalRemaining}</strong> / {totalAll}장
      </div>

      {/* 상품 현황판 */}
      <div className="prize-board">
        {prizes.map((prize) => {
          const drawn = prize.total - prize.remaining
          const isSoldOut = prize.remaining === 0

          const tickets = []
          for (let i = 0; i < prize.total; i++) {
            const isDrawn = i < drawn
            tickets.push(
              <div key={i} className={`ticket ${isDrawn ? 'drawn' : ''}`}>
                <div className="ticket-body">
                  <span className="ticket-number">{i + 1}</span>
                  <span className="ticket-unit">번</span>
                </div>
              </div>
            )
          }

          return (
            <div key={prize.grade}>
              <div className={`prize-section ${isSoldOut ? 'sold-out-row' : ''}`}>
                {/* 왼쪽: 상품 정보 */}
                <div className="prize-left">
                  <div className="prize-image-placeholder">[ 이미지 ]</div>
                  <div className="prize-grade-label">
                    <span className="prize-grade-letter" style={{ color: GRADE_COLORS[prize.grade] }}>
                      {prize.grade}
                    </span>
                    <span>상</span>
                  </div>
                  <div className="prize-name">{prize.label}</div>
                  <div className="prize-count-label">
                    전 {prize.total}개
                    {isSoldOut && ' — 종료'}
                  </div>
                </div>

                {/* 오른쪽: 복권 슬롯 */}
                <div className="prize-right">
                  {tickets}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 라스트원상 */}
      <div className="last-one-section">
        <h3>라스트원상</h3>
        <p>원하는 대로 — 마지막 1장을 뽑은 분에게!</p>
        <div className="status">
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
              placeholder="XXXXXXXX"
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
              <div style={{ color: '#e63946', fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>
                🏆 라스트원상 획득!
              </div>
            )}
            <div
              className="modal-grade"
              style={{ color: GRADE_COLORS[result.grade] || '#7b5ea7' }}
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
