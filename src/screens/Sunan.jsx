import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SUNAN_PRAYERS } from '../lib/content'

const Back = ({ onClick }) => (
  <button className="back-ic" onClick={onClick} aria-label="back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
)

export default function Sunan() {
  const { back } = useApp()
  const [openId, setOpenId] = useState(null)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} dir="rtl">
      <div className="feat-top">
        <Back onClick={back} />
        <div><div className="h1 ar">السنن والنوافل</div><div className="h2">سنن الصلوات الرواتب</div></div>
        <span className="ar-tag">🕌</span>
      </div>

      <div className="feat-body">
        <div className="ev-hero">
          <div className="ev-hero-top">
            <span className="ev-hero-ic" aria-hidden="true">🕌</span>
          </div>
          <div className="ev-eyebrow">فضل المحافظة عليها</div>
          <h2 className="ev-hero-name ar">السنن الرواتب</h2>
          <p className="ev-what ar">هي النوافل التي واظب عليها النبي ﷺ مع الصلوات المفروضة. اضغط أي بطاقة لمعرفة وقتها وكيفيتها وفضلها.</p>
          <div className="ev-thawab">
            <div className="ev-thawab-lab">الفضل</div>
            <p className="ar">«مَنْ ثَابَرَ عَلَى ثِنْتَيْ عَشْرَةَ رَكْعَةً مِنَ السُّنَّةِ بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ» (رواه مسلم والترمذي).</p>
          </div>
        </div>

        {SUNAN_PRAYERS.map((s) => {
          const open = openId === s.id
          return (
            <div key={s.id} className={`ev-card ${open ? 'open' : ''}`} style={{ marginTop: 12 }}>
              <button className="ev-head" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open}>
                <span className="ev-ic" aria-hidden="true">{s.ic}</span>
                <span className="ev-headtext">
                  <span className="ev-name ar">{s.title}</span>
                  <span className="ev-date ar">{s.rakat}</span>
                </span>
                <span className={`ev-badge ${s.tag === 'مؤكدة' ? 'now' : ''}`}>{s.tag}</span>
              </button>

              {open && (
                <div className="ev-body">
                  {s.timeStart ? (
                    <>
                      <p className="ev-what ar"><b>بداية الوقت:</b> {s.timeStart}</p>
                      <p className="ev-what ar" style={{ marginTop: 6 }}><b>نهاية الوقت:</b> {s.timeEnd}</p>
                    </>
                  ) : (
                    <p className="ev-what ar"><b>وقتها:</b> {s.time}</p>
                  )}
                  <p className="ev-what ar" style={{ marginTop: 8 }}><b>كيفية أدائها:</b> {s.method}</p>
                  <div className="ev-thawab">
                    <div className="ev-thawab-lab">حكمها وفضلها</div>
                    <p className="ar">{s.ruling} {s.virtue}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
