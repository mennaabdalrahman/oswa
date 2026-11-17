// Content for the wake-up challenges: questions, phrases. Arabic and English.
export const QUESTIONS = [
  { ar: 'كم عدد ركعات صلاة الفجر (الفرض)؟', en: 'How many rak‘ahs is the Fajr obligatory prayer?', a: { ar: ['ركعتان', 'ثلاث ركعات', 'أربع ركعات'], en: ['Two', 'Three', 'Four'] }, c: 0 },
  { ar: 'كم عدد ركعات صلاة المغرب؟', en: 'How many rak‘ahs is the Maghrib prayer?', a: { ar: ['ركعتان', 'ثلاث ركعات', 'أربع ركعات'], en: ['Two', 'Three', 'Four'] }, c: 1 },
  { ar: 'كم عدد الصلوات المفروضة في اليوم؟', en: 'How many prayers are obligatory each day?', a: { ar: ['ثلاث', 'خمس', 'ست'], en: ['Three', 'Five', 'Six'] }, c: 1 },
  { ar: 'ما أول صلاة في اليوم؟', en: 'Which is the first prayer of the day?', a: { ar: ['الفجر', 'الظهر', 'الضحى'], en: ['Fajr', 'Dhuhr', 'Duha'] }, c: 0 },
  { ar: 'كم عدد ركعات صلاة العشاء؟', en: 'How many rak‘ahs is the Isha prayer?', a: { ar: ['ثلاث', 'أربع', 'ركعتان'], en: ['Three', 'Four', 'Two'] }, c: 1 },
  { ar: 'ما اسم الشهر الذي يصومه المسلمون؟', en: 'Which month do Muslims fast?', a: { ar: ['شعبان', 'رمضان', 'رجب'], en: ['Shaban', 'Ramadan', 'Rajab'] }, c: 1 },
  { ar: 'ما أطول سورة في القرآن؟', en: 'What is the longest surah in the Quran?', a: { ar: ['البقرة', 'آل عمران', 'النساء'], en: ['Al-Baqarah', 'Al-Imran', 'An-Nisa'] }, c: 0 },
  { ar: 'إلى أين يتجه المسلمون في الصلاة؟', en: 'Which direction do Muslims face in prayer?', a: { ar: ['القدس', 'الكعبة', 'المدينة'], en: ['Jerusalem', 'The Kaaba', 'Madinah'] }, c: 1 },
  { ar: 'كم عدد أركان الإسلام؟', en: 'How many pillars of Islam are there?', a: { ar: ['أربعة', 'خمسة', 'ستة'], en: ['Four', 'Five', 'Six'] }, c: 1 },
  { ar: 'ما اسم أول سورة في المصحف؟', en: 'What is the first surah of the Quran?', a: { ar: ['الفاتحة', 'البقرة', 'الإخلاص'], en: ['Al-Fatihah', 'Al-Baqarah', 'Al-Ikhlas'] }, c: 0 },
]
export const PHRASES = [
  { ar: 'الصلاة خير من النوم', en: 'Prayer is better than sleep' },
  { ar: 'سبحان الله وبحمده سبحان الله العظيم', en: 'Subhan Allah wa bihamdihi, Subhan Allah al-Azim' },
  { ar: 'لا إله إلا الله وحده لا شريك له', en: 'La ilaha illa Allah wahdahu la sharika lah' },
  { ar: 'أستغفر الله العظيم وأتوب إليه', en: 'Astaghfirullah al-Azim wa atubu ilayh' },
  { ar: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور', en: 'Alhamdulillahil-ladhi ahyana ba‘da ma amatana wa ilayhin-nushur' },
]
export const VERSES = [
  { ar: 'قل لن يصيبنا إلا ما كتب الله لنا هو مولانا وعلى الله فليتوكل المؤمنون', ref: 'التوبة:٥١', en: 'Say: Nothing will ever befall us except what Allah has decreed for us. He is our Protector.', refEn: 'At-Tawbah 9:51' },
  { ar: 'إن مع العسر يسرا', ref: 'الشرح:٦', en: 'Indeed, with hardship comes ease.', refEn: 'Ash-Sharh 94:6' },
  { ar: 'ألا بذكر الله تطمئن القلوب', ref: 'الرعد:٢٨', en: 'Verily, in the remembrance of Allah do hearts find rest.', refEn: 'Ar-Ra‘d 13:28' },
  { ar: 'وأقم الصلاة إن الصلاة تنهى عن الفحشاء والمنكر', ref: 'العنكبوت:٤٥', en: 'And establish prayer; indeed prayer prevents immorality and wrongdoing.', refEn: 'Al-Ankabut 29:45' },
  { ar: 'فاذكروني أذكركم واشكروا لي ولا تكفرون', ref: 'البقرة:١٥٢', en: 'So remember Me; I will remember you.', refEn: 'Al-Baqarah 2:152' },
]
export const EMOJI = ['🌙', '⭐', '🕌', '📿', '🌅', '🕋', '🌴', '☀️']
export const pickRand = (arr) => arr[Math.floor(Math.random() * arr.length)]
export function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
