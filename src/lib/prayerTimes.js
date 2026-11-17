// Prayer times from lat/lng — Muslim World League (Fajr 18°, Isha 17°).

const DEG = Math.PI / 180
const sin = (d) => Math.sin(d * DEG)
const cos = (d) => Math.cos(d * DEG)
const tan = (d) => Math.tan(d * DEG)
const arcsin = (x) => Math.asin(x) / DEG
const arccos = (x) => Math.acos(x) / DEG
const arccot = (x) => Math.atan(1 / x) / DEG
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a }
const fixAngle = (a) => fix(a, 360)
const fixHour = (a) => fix(a, 24)

// Julian date
function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12 }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5
}

// sun position: returns { declination, equationOfTime }
function sunPosition(jd) {
  const D = jd - 2451545.0
  const g = fixAngle(357.529 + 0.98560028 * D)
  const q = fixAngle(280.459 + 0.98564736 * D)
  const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g))
  const e = 23.439 - 0.00000036 * D
  const RA = fixHour(Math.atan2(cos(e) * sin(L), cos(L)) / DEG / 15)
  return { decl: arcsin(sin(e) * sin(L)), eqt: q / 15 - RA }
}

// hour angle for a given sun altitude
function sunAngleTime(angle, lat, decl, noon, dir) {
  const t = (1 / 15) * arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat)))
  return noon + (dir === 'ccw' ? -t : t)
}

// asr: shadow factor 1 (Shafi/Maliki/Hanbali), 2 (Hanafi)
function asrTime(factor, lat, decl, noon) {
  const angle = -arccot(factor + tan(Math.abs(lat - decl)))
  return sunAngleTime(angle, lat, decl, noon)
}

// Results are pure functions of (place, local day, method) — memoise them so re-renders and the
// notification scheduler never recompute. The maths itself is microseconds, so a Web Worker would cost
// more (startup + messaging) than it saves; caching is what keeps the main thread free.
const CACHE = new Map()
const CACHE_MAX = 64

/* Calculation methods (angles below the horizon). `egypt` is the Egyptian General Authority of Survey. */
export const METHODS = {
  egypt:   { fajr: 19.5, isha: 17.5, ar: 'الهيئة المصرية العامة للمساحة', en: 'Egyptian General Authority of Survey' },
  mwl:     { fajr: 18,   isha: 17,   ar: 'رابطة العالم الإسلامي', en: 'Muslim World League' },
  makkah:  { fajr: 18.5, ishaMin: 90, ar: 'أم القرى (مكة المكرمة)', en: 'Umm al-Qura (Makkah)' },
  karachi: { fajr: 18,   isha: 18,   ar: 'جامعة العلوم الإسلامية بكراتشي', en: 'Univ. of Islamic Sciences, Karachi' },
  isna:    { fajr: 15,   isha: 15,   ar: 'أمريكا الشمالية (ISNA)', en: 'Islamic Society of North America' },
}
let defaultMethod = 'egypt'
export const getMethodId = () => defaultMethod
export function setMethodId(id) { if (METHODS[id]) defaultMethod = id }

/** today's prayer times -> [{ key, ar, en, date }] in order Fajr…Isha. Every time is rounded to the nearest minute. */
export function prayerTimes(lat, lng, date = new Date(), methodId = defaultMethod, asrFactor = 1) {
  const id = typeof methodId === 'string' && METHODS[methodId] ? methodId : defaultMethod
  const key = `${lat},${lng},${date.getFullYear()}-${date.getMonth()}-${date.getDate()},${id},${asrFactor}`
  const hit = CACHE.get(key)
  if (hit) return hit
  const out = computePrayerTimes(lat, lng, date, METHODS[id], asrFactor)
  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value)
  CACHE.set(key, out)
  return out
}

function computePrayerTimes(lat, lng, date, method, asrFactor) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
  const jd = julian(y, m, d) - lng / (15 * 24)
  const { decl, eqt } = sunPosition(jd)
  const noon = fixHour(12 - eqt - lng / 15)          // solar noon, UTC hours

  const times = {
    fajr: sunAngleTime(method.fajr, lat, decl, noon, 'ccw'),
    sunrise: sunAngleTime(0.833, lat, decl, noon, 'ccw'),
    dhuhr: noon + 1 / 60,
    asr: asrTime(asrFactor, lat, decl, noon),
    maghrib: sunAngleTime(0.833, lat, decl, noon),
    isha: 0,
  }
  times.isha = method.ishaMin ? times.maghrib + method.ishaMin / 60 : sunAngleTime(method.isha, lat, decl, noon)

  // UTC decimal hours -> local Date objects, in the device timezone
  const toDate = (h) => {
    if (!isFinite(h)) return null
    // build the moment in UTC, then let Date render it in local time
    const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    return new Date(Math.round((base + h * 3600000) / 60000) * 60000)   // nearest minute, like printed timetables
  }

  return [
    { key: 'fajr', ar: 'الفجر', en: 'Fajr', date: toDate(times.fajr) },
    { key: 'sunrise', ar: 'الشروق', en: 'Sunrise', date: toDate(times.sunrise), info: true },
    { key: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', date: toDate(times.dhuhr) },
    { key: 'asr', ar: 'العصر', en: 'Asr', date: toDate(times.asr) },
    { key: 'maghrib', ar: 'المغرب', en: 'Maghrib', date: toDate(times.maghrib) },
    { key: 'isha', ar: 'العشاء', en: 'Isha', date: toDate(times.isha) },
  ]
}

/** which prayer is next, and how long until it */
export function nextPrayer(times, now = new Date()) {
  const list = times.filter((t) => t.date && !t.info)
  for (const p of list) if (p.date > now) return { ...p, ms: p.date - now, tomorrow: false }
  // past Isha → next is tomorrow's Fajr
  const first = list[0]
  const tomorrow = new Date(first.date.getTime() + 864e5)
  return { ...first, date: tomorrow, ms: tomorrow - now, tomorrow: true }
}

// Intl formatters are expensive to construct; Home formats ~7 times per second, so build each once.
const TIME_FMT = {}
export function fmtTime(date, lang = 'en') {
  if (!date) return '—'
  const locale = lang === 'ar' ? 'ar-EG' : lang === 'ja' ? 'ja-JP' : 'en-US'
  const f = TIME_FMT[locale] || (TIME_FMT[locale] = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }))
  return f.format(date)
}

export function fmtRemaining(ms) {
  if (ms < 0) ms = 0
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000)
  const two = (n) => String(n).padStart(2, '0')
  return `${two(h)}:${two(m)}:${two(s)}`
}

// Hijri date (tabular civil calculation — may differ ±1 day from local sighting)
const HIJRI_MONTHS = ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجّة']
let HIJRI_FMT, HIJRI_DAY = '', HIJRI_OUT = ''
export function hijriDate(date = new Date()) {
  const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  if (dayKey === HIJRI_DAY) return HIJRI_OUT            // same calendar day → same string
  try {
    HIJRI_FMT = HIJRI_FMT || new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' })
    HIJRI_OUT = HIJRI_FMT.format(date); HIJRI_DAY = dayKey
    return HIJRI_OUT
  } catch {
    const jd = Math.floor((date - new Date(Date.UTC(622, 6, 16))) / 864e5)
    const l = jd + 10632, n = Math.floor((l - 1) / 10631)
    const j = l - 10631 * n
    const mo = Math.floor((24 * j) / 709) % 12
    return `${HIJRI_MONTHS[mo]} ${1 + n * 30}`
  }
}
