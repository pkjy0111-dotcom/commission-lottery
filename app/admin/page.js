'use client'

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [codes, setCodes] = useState([])
  const [codeCount, setCodeCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    // 코드 목록 가져와서 비밀번호 검증
    const res = await fetch(`/api/codes?password=${encodeURIComponent(password)}`)
    if (res.ok) {
      setLoggedIn(true)
      const data = await res.json()
      setCodes(data)
    } else {
      setMessage('비밀번호가 틀립니다.')
    }
  }

  async function fetchCodes() {
    const res = await fetch(`/api/codes?password=${encodeURIComponent(password)}`)
    if (res.ok) {
      const data = await res.json()
      setCodes(data)
    }
  }

  async function generateCodes() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, count: codeCount })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`${data.length}개 코드 생성 완료!`)
        fetchCodes()
      } else {
        setMessage(data.error)
      }
    } catch (e) {
      setMessage('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm('정말 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        setMessage('초기화 완료!')
        fetchCodes()
      }
    } catch (e) {
      setMessage('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code)
    setMessage(`복사됨: ${code}`)
    setTimeout(() => setMessage(''), 2000)
  }

  if (!loggedIn) {
    return (
      <div className="login-form">
        <h1 style={{ color: '#c4a24e' }}>Admin</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="admin-input"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button type="submit" className="admin-btn">로그인</button>
        </form>
        {message && <div className="error-message">{message}</div>}
      </div>
    )
  }

  const unusedCodes = codes.filter(c => !c.used)
  const usedCodes = codes.filter(c => c.used)

  return (
    <div className="admin-container">
      <h1>커미션 복권 Admin</h1>

      {message && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #c4a24e',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center',
          marginBottom: 20,
          color: '#c4a24e'
        }}>
          {message}
        </div>
      )}

      {/* 코드 생성 */}
      <div className="admin-section">
        <h2>코드 생성</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            className="admin-input"
            style={{ width: 100, marginBottom: 0 }}
            min="1"
            max="50"
            value={codeCount}
            onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
          />
          <span style={{ color: '#888' }}>개</span>
          <button
            className="admin-btn"
            onClick={generateCodes}
            disabled={loading}
          >
            생성
          </button>
        </div>
      </div>

      {/* 미사용 코드 */}
      <div className="admin-section">
        <h2>미사용 코드 ({unusedCodes.length}개)</h2>
        <div className="code-list">
          {unusedCodes.map((c) => (
            <div key={c.id} className="code-item" onClick={() => copyCode(c.code)}>
              <span className="code-text">{c.code}</span>
              <span className="code-status">클릭해서 복사</span>
            </div>
          ))}
          {unusedCodes.length === 0 && (
            <div style={{ color: '#666', padding: 10 }}>미사용 코드 없음</div>
          )}
        </div>
      </div>

      {/* 사용된 코드 */}
      <div className="admin-section">
        <h2>사용된 코드 ({usedCodes.length}개)</h2>
        <div className="code-list">
          {usedCodes.map((c) => (
            <div key={c.id} className="code-item">
              <span className="code-text">{c.code}</span>
              <span className="code-status used">
                {c.result}상 — {new Date(c.used_at).toLocaleString('ko-KR')}
              </span>
            </div>
          ))}
          {usedCodes.length === 0 && (
            <div style={{ color: '#666', padding: 10 }}>사용된 코드 없음</div>
          )}
        </div>
      </div>

      {/* 초기화 */}
      <div className="admin-section">
        <h2>데이터 초기화</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 12 }}>
          모든 상품 수량과 코드를 초기 상태로 되돌립니다.
        </p>
        <button
          className="admin-btn danger"
          onClick={handleReset}
          disabled={loading}
        >
          전체 초기화
        </button>
      </div>
    </div>
  )
}
