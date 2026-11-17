import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LESSONS } from '../lib/content'

const Back = ({ onClick }) => (
  <button className="back-ic" onClick={onClick} aria-label="back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
)

function Steps({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 13, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '13px 15px' }}>
          <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 10, background: 'var(--lapis-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
          <span>
            <span className="ar" style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>{s.ar}</span>
            {s.mean && <span className="ar" style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.7 }}>{s.mean}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

function Grid({ items, big }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: big ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: big ? '12px 10px' : '14px 8px', textAlign: 'center' }}>
          <div className="ar" style={{ fontFamily: 'Amiri, serif', fontSize: big ? 20 : 30, color: 'var(--gold)', lineHeight: 1.4 }}>{it[0]}</div>
          <div style={{ fontSize: big ? 11 : 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{it[1]}</div>
        </div>
      ))}
    </div>
  )
}

function Quiz({ questions }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const q = questions[i]

  const choose = (idx) => {
    if (picked != null) return
    setPicked(idx)
    if (idx === q.a) setScore((s) => s + 1)
  }
  const next = () => {
    if (i + 1 >= questions.length) { setDone(true); return }
    setI(i + 1); setPicked(null)
  }
  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false) }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '30px 10px' }}>
      <div style={{ fontSize: 48 }}>🎉</div>
      <div className="ar" style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>نتيجتك: {score} من {questions.length}</div>
      <button className="btn ar" style={{ marginTop: 18 }} onClick={restart}>إعادة المسابقة</button>
    </div>
  )

  return (
    <div>
      <div className="ar" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>سؤال {i + 1} من {questions.length}</div>
      <div className="ar" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.8, marginBottom: 16 }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.choices.map((c, idx) => {
          const isRight = idx === q.a, isPicked = idx === picked
          let border = 'var(--line)', bg = 'var(--surface)', color = 'var(--ink)'
          if (picked != null) {
            if (isRight) { border = 'var(--accent)'; bg = 'var(--lapis-soft)'; color = 'var(--accent)' }
            else if (isPicked) { border = 'var(--coral)'; color = 'var(--coral)' }
          }
          return (
            <button key={idx} onClick={() => choose(idx)} className="ar" style={{
              textAlign: 'start', border: '1px solid', borderColor: border, background: bg, color,
              borderRadius: 14, padding: '13px 15px', fontSize: 16, cursor: picked != null ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>{c}</button>
          )
        })}
      </div>
      {picked != null && <button className="btn block ar" style={{ marginTop: 16 }} onClick={next}>{i + 1 >= questions.length ? 'إظهار النتيجة' : 'التالي'}</button>}
    </div>
  )
}

export default function Lessons() {
  const { back, go, payload } = useApp()
  const key = payload
  const lesson = LESSONS[key]

  if (!lesson) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
        <div className="feat-top">
          <Back onClick={back} />
          <div><div className="h1 ar">الدرس</div></div>
        </div>
        <div className="feat-body"><p className="ar" style={{ color: 'var(--muted)' }}>المحتوى غير متاح.</p></div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
      <div className="feat-top">
        <Back onClick={back} />
        <div><div className="h1 ar">{lesson.title}</div><div className="h2">تعلّم</div></div>
        <span className="ar-tag">{lesson.tag}</span>
      </div>
      <div className="feat-body">
        {lesson.type === 'steps' && <Steps steps={lesson.steps} />}
        {lesson.type === 'grid' && <Grid items={lesson.items} big={lesson.big} />}
        {lesson.type === 'quiz' && <Quiz questions={lesson.questions} />}
        {lesson.type === 'link' && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <p className="ar" style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }}>{lesson.lead}</p>
            <button className="btn ar" onClick={() => go(lesson.to)}>افتح قسم التسميع</button>
          </div>
        )}
      </div>
    </div>
  )
}
