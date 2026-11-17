import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ADHKAR_SECTIONS } from '../lib/content'

const Back = ({ onClick }) => (
  <button className="back-ic" onClick={onClick} aria-label="back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
)

const toArabicNum = (n) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])

/* An adhkar card with an optional tap-to-count interaction (reward section). */
function Dhikr({ item, counter }) {
  const [count, setCount] = useState(0)
  const target = typeof item.rep === 'number' ? item.rep : null
  const active = counter && target
  const done = active && count >= target
  const tap = () => {
    if (!active || done) return
    setCount((c) => Math.min(target, c + 1))
    if (navigator.vibrate) navigator.vibrate(count + 1 >= target ? [40, 40, 40] : 10)
  }
  return (
    <div
      onClick={tap}
      style={{
        background: 'var(--surface)', border: '1px solid', borderRadius: 18, padding: '14px 16px',
        borderColor: done ? 'color-mix(in srgb, var(--gold) 55%, transparent)' : 'var(--line)',
        cursor: active ? 'pointer' : 'default', transition: 'border-color .2s',
      }}
    >
      <div className="ar" style={{ fontFamily: 'Amiri, serif', fontSize: 20, lineHeight: 1.9, color: 'var(--ink)' }}>{item.ar}</div>
      {item.mean && <div className="ar" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>{item.mean}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        {typeof item.rep === 'string' && <span className="ar" style={{ fontSize: 12.5, color: 'var(--accent)', background: 'var(--lapis-soft)', borderRadius: 20, padding: '4px 12px' }}>{item.rep}</span>}
        {active && (
          <>
            <div style={{ flex: 1, height: 8, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (count / target) * 100 + '%', background: done ? 'var(--gold)' : 'var(--accent)', transition: 'width .15s' }} />
            </div>
            <span className="latin" style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--gold)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums', minWidth: 58, textAlign: 'left', direction: 'ltr' }}>
              {toArabicNum(count)} / {toArabicNum(target)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default function Adhkar() {
  const { back, persona } = useApp()
  const [open, setOpen] = useState(null)
  const section = ADHKAR_SECTIONS.find((s) => s.id === open)

  // --- section detail ---
  if (section) {
    const personaSet = section.byPersona ? (section.byPersona[persona] || section.byPersona.new) : null
    const groups = section.byPersona ? [{ label: personaSet.label, items: personaSet.items }] : section.groups
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
        <div className="feat-top">
          <Back onClick={() => setOpen(null)} />
          <div><div className="h1 ar">{section.title}</div><div className="h2">أذكار وأدعية</div></div>
          <span className="ar-tag">{section.ic}</span>
        </div>

        {section.byPersona && (
          <div style={{ display: 'flex', gap: 7, padding: '12px 18px 0', flexWrap: 'wrap' }}>
            {['child', 'new', 'adult'].map((p) => (
              <span key={p} className="ar" style={{
                fontSize: 12.5, padding: '6px 12px', borderRadius: 20,
                border: '1px solid', borderColor: p === persona ? 'var(--accent)' : 'var(--line)',
                color: p === persona ? 'var(--accent)' : 'var(--muted)',
                background: p === persona ? 'var(--lapis-soft)' : 'var(--surface)',
              }}>{p === 'child' ? 'طفل' : p === 'new' ? 'مسلم جديد' : 'بالغ'}</span>
            ))}
          </div>
        )}

        <div className="feat-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {section.note && <p className="ar" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{section.note}</p>}
          {groups.map((g, gi) => (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.label && <div className="ar" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{g.label}</div>}
              {g.items.map((item, ii) => <Dhikr key={ii} item={item} counter={section.counter} />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- section list ---
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
      <div className="feat-top">
        <Back onClick={back} />
        <div><div className="h1 ar">الأذكار والأدعية</div><div className="h2">حصن المسلم — مبوّب</div></div>
        <span className="ar-tag">🤲</span>
      </div>
      <div className="feat-body" style={{ paddingTop: 12 }}>
        {ADHKAR_SECTIONS.map((s) => (
          <button
            key={s.id}
            className="choice"
            style={s.byPersona ? {
              borderColor: 'color-mix(in srgb, var(--gold) 45%, transparent)',
              background: 'linear-gradient(135deg, var(--gold-soft), transparent 65%), var(--surface)',
              marginBottom: 12,
            } : undefined}
            onClick={() => setOpen(s.id)}
          >
            <span className="mark" style={{ fontSize: 20 }}>{s.ic}</span>
            <span style={{ flex: 1 }}>
              <span className="t1 ar" style={{ fontSize: 16 }}>{s.title}</span>
              <span className="t2 ar">{s.counter ? 'مع عدّاد تسبيح تفاعلي' : s.byPersona ? 'للطفل والمسلم الجديد والبالغ — مبسّطة وكاملة' : `${s.groups.reduce((n, g) => n + g.items.length, 0)} ذِكر`}</span>
            </span>
            <span className="arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></span>
          </button>
        ))}
      </div>
    </div>
  )
}
