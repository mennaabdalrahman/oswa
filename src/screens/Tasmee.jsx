import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { SURAHS, loadQuran } from '../lib/quran'
import { useFavorites, Star } from '../lib/favorites'

const Back = ({ onClick }) => (
  <button className="back-ic" onClick={onClick} aria-label="back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
)

// strip diacritics / tatweel and normalize letters so recitation can be matched leniently
const normalize = (s) =>
  (s || '')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// sequential word match: how many expected words appear, in order, in the attempt
function score(expected, attempt) {
  const exp = normalize(expected).split(' ').filter(Boolean)
  const att = normalize(attempt).split(' ').filter(Boolean)
  const flags = new Array(exp.length).fill(false)
  let p = 0
  for (let i = 0; i < exp.length; i++) {
    for (let j = p; j < att.length; j++) {
      if (att[j] === exp[i]) { flags[i] = true; p = j + 1; break }
    }
  }
  const hit = flags.filter(Boolean).length
  return { exp, flags, pct: exp.length ? Math.round((hit / exp.length) * 100) : 0, hit }
}

function Practice({ surah, onExit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mode, setMode] = useState('voice')
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(false)
    loadQuran()
      .then((q) => {
        if (!alive) return
        const c = q[surah] || q[String(surah)]
        if (!c) throw new Error('missing')
        setData({ name: c.n, ename: c.e, ayat: c.v.map(([n, ar]) => ({ n, ar })) })
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false; stop() }
    // eslint-disable-next-line
  }, [surah])

  const expected = data ? data.ayat.map((a) => a.ar).join(' ') : ''
  const attempt = mode === 'voice' ? transcript : text
  const result = data ? score(expected, attempt) : null

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  function start() {
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ar-SA'
    rec.continuous = true
    rec.interimResults = true
    let base = transcript ? transcript + ' ' : ''
    rec.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) live += e.results[i][0].transcript + ' '
      setTranscript((base + live).trim())
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }
  function stop() {
    try { recRef.current && recRef.current.stop() } catch { /* noop */ }
    recRef.current = null
    setListening(false)
  }

  const meta = SURAHS.find((s) => s[0] === surah)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
      <div className="feat-top">
        <Back onClick={onExit} />
        <div><div className="h1 ar">{data?.name || meta?.[1]}</div><div className="h2">تسميع القرآن</div></div>
        <span className="ar-tag">🎙️</span>
      </div>

      {/* mode switch */}
      <div style={{ display: 'flex', gap: 7, padding: '12px 18px 0' }}>
        {[['voice', 'تسميع بالصوت'], ['text', 'تسميع بالكتابة']].map(([m, lab]) => (
          <button key={m} className="btn ghost ar" style={{ flex: 1, minHeight: 42, borderColor: mode === m ? 'var(--accent)' : undefined, color: mode === m ? 'var(--accent)' : undefined }} onClick={() => setMode(m)}>{lab}</button>
        ))}
      </div>

      <div className="feat-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <p className="ar" style={{ color: 'var(--muted)', textAlign: 'center' }}>… جارٍ التحميل</p>}
        {error && <p className="ar" style={{ color: 'var(--coral)', textAlign: 'center' }}>تعذّر تحميل السورة.</p>}

        {data && (
          <>
            {/* accuracy meter */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="ar" style={{ fontSize: 13, color: 'var(--muted)' }}>دقّة التسميع</span>
                <span className="latin" style={{ fontSize: 22, fontWeight: 800, color: result.pct >= 80 ? 'var(--accent)' : result.pct >= 40 ? 'var(--gold)' : 'var(--muted)', direction: 'ltr' }}>{result.pct}%</span>
              </div>
              <div style={{ height: 9, borderRadius: 5, background: 'var(--line)', overflow: 'hidden', marginTop: 8 }}>
                <div style={{ height: '100%', width: result.pct + '%', background: result.pct >= 80 ? 'var(--accent)' : 'var(--gold)', transition: 'width .25s' }} />
              </div>
              {result.pct >= 90 && <div className="ar" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8 }}>أحسنت! تسميع متقن ما شاء الله.</div>}
            </div>

            {/* expected text with matched-word highlighting */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '16px' }}>
              <div className="ar" style={{ fontFamily: 'Amiri, serif', fontSize: 24, lineHeight: 2.2, textAlign: 'justify', textAlignLast: 'center' }}>
                {result.exp.map((w, i) => (
                  <span key={i} style={{ color: result.flags[i] ? 'var(--accent)' : 'var(--muted)', fontWeight: result.flags[i] ? 700 : 400 }}>{w} </span>
                ))}
              </div>
            </div>

            {mode === 'voice' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                {!SR ? (
                  <p className="ar" style={{ fontSize: 13, color: 'var(--coral)', textAlign: 'center', lineHeight: 1.7 }}>
                    التعرّف الصوتي غير مدعوم في هذا المتصفّح. جرّب متصفّح Chrome، أو استخدم «تسميع بالكتابة».
                  </p>
                ) : (
                  <>
                    <button onClick={listening ? stop : start} className="ar" style={{
                      width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff',
                      background: listening ? 'var(--coral)' : 'var(--accent)', boxShadow: 'var(--shadow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: listening ? 'pulseMic 1.2s infinite' : 'none',
                    }} aria-label={listening ? 'إيقاف' : 'تسجيل'}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
                      </svg>
                    </button>
                    <div className="ar" style={{ fontSize: 13, color: 'var(--muted)' }}>{listening ? 'يستمع الآن… سمّع الآيات' : 'اضغط الميكروفون وابدأ التسميع'}</div>
                    {transcript && (
                      <div className="ar" style={{ width: '100%', background: 'var(--lapis-soft)', borderRadius: 14, padding: '12px 14px', fontSize: 16, lineHeight: 1.9, color: 'var(--ink)' }}>
                        {transcript}
                      </div>
                    )}
                    {transcript && <button className="btn ghost ar" onClick={() => setTranscript('')}>مسح التسجيل</button>}
                    <style>{`@keyframes pulseMic{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--coral) 55%,transparent)}70%{box-shadow:0 0 0 18px transparent}100%{box-shadow:0 0 0 0 transparent}}`}</style>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  className="paste ar" dir="rtl" value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب الآيات هنا وسيُصحَّح فورًا…"
                  style={{ fontFamily: 'Amiri, serif', fontSize: 18, lineHeight: 2, minHeight: 140 }}
                />
                <div className="ar" style={{ fontSize: 12.5, color: 'var(--muted)' }}>يُطابَق ما تكتبه مع نصّ السورة كلمةً بكلمة — الكلمات الصحيحة تظهر بلون بارز أعلاه.</div>
                {text && <button className="btn ghost ar" onClick={() => setText('')}>مسح</button>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Tasmee() {
  const { back } = useApp()
  const [surah, setSurah] = useState(null)
  const [query, setQuery] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const { isFav, toggle } = useFavorites()

  if (surah) return <Practice surah={surah} onExit={() => setSurah(null)} />

  const list = SURAHS.filter((s) => {
    if (onlyFav && !isFav(s[0])) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return s[1].includes(query) || s[2].toLowerCase().includes(q) || String(s[0]) === q
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
      <div className="feat-top">
        <Back onClick={back} />
        <div><div className="h1 ar">تسميع القرآن</div><div className="h2">بالصوت والكتابة مع التصحيح</div></div>
        <span className="ar-tag">🎙️</span>
      </div>

      <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input className="name-input ar" placeholder="ابحث عن سورة…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div style={{ display: 'flex', gap: 7 }}>
          <button className="btn ghost ar" style={{ flex: 1, minHeight: 40, borderColor: !onlyFav ? 'var(--accent)' : undefined, color: !onlyFav ? 'var(--accent)' : undefined }} onClick={() => setOnlyFav(false)}>الكل</button>
          <button className="btn ghost ar" style={{ flex: 1, minHeight: 40, borderColor: onlyFav ? 'var(--gold)' : undefined, color: onlyFav ? 'var(--gold)' : undefined }} onClick={() => setOnlyFav(true)}>المفضّلة ⭐</button>
        </div>
      </div>

      <div className="feat-body" style={{ paddingTop: 10 }}>
        {list.length === 0 && <p className="ar" style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>لا سور مفضّلة بعد — أضِف نجمة لأيّ سورة.</p>}
        {list.map((s) => (
          <div key={s[0]} style={{ display: 'flex', alignItems: 'center' }}>
            <button className="choice" style={{ flex: 1 }} onClick={() => setSurah(s[0])}>
              <span className="mark">{s[0]}</span>
              <span style={{ flex: 1 }}>
                <span className="t1 ar" style={{ fontSize: 17 }}>{s[1]}</span>
                <span className="t2">{s[2]} · {s[3]} آية</span>
              </span>
            </button>
            <Star on={isFav(s[0])} onClick={() => toggle(s[0])} title={`تفضيل سورة ${s[1]}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
