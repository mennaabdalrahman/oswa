// Text for the alarm and timetable screens. English and Arabic are written out; every other language falls
// back to English (add a `de: {...}` block to PACKS and it is picked up automatically).
const en = {
  /* alarm list */
  listH1: 'Prayer alarms', listH2: 'Wake for every prayer', listTag: 'منبه',
  rings: 'Rings', off: 'Off', on: 'On',
  atTime: 'at the prayer time',
  relBefore: (m, p) => `${m} min before ${p}`, relAfter: (m, p) => `${m} min after ${p}`,
  needLocTitle: 'Location needed', needLocLead: 'Prayer times are worked out on your device from where you are.', needLocBtn: 'Use my location', locDenied: 'Location is blocked — allow it in your browser’s site settings.',
  notifLead: 'Get a notification when each alarm is due.', notifAsk: 'Turn on notifications', notifOn: 'Notifications are on', notifBlocked: 'Notifications are blocked in your browser settings.', notifUnsupported: 'This browser does not support notifications.',
  keepOpen: 'Alarms ring while this page is open. Keep it open with the screen on; the screen is kept awake while an alarm is set. A browser cannot ring a closed page.',
  installTitle: 'Install on your home screen', installLead: 'Open the site like an app, and keep alarms on a page that is easy to find.', installBtn: 'Install', installHow: 'In your browser menu choose “Add to Home screen”.', installed: 'Installed',
  sleepRow: 'Sleep reminder', nextSleep: (t) => `Next: ${t}`,

  /* alarm settings */
  editH1: (p) => `${p} alarm`, editH2: 'Set up the alarm', editTag: 'ضبط',
  tabFixed: 'Fixed time', tabPrayer: 'According to prayer',
  hour: 'Hour', minute: 'Minute', ampm: ['AM', 'PM'],
  anchorFajr: 'Fajr', anchorSunrise: 'Sunrise',
  minsLab: 'Minutes', before: 'Before', after: 'After',
  ringsIn: (s) => `Rings in ${s}`,
  sound: 'Sound', volume: 'Alarm volume', volumeNote: 'This alarm uses your phone’s current volume.', volumeCustom: 'Alarm loudness',
  gentle: 'Gentle alarm', gentleNote: 'Starts very quiet and rises gradually.',
  challenge: 'Challenge', snooze: 'Snooze', snoozeOff: 'Off', snoozeN: (n) => `${n} min`,
  awakeRow: 'Are you awake?', save: 'Save', saved: 'Saved', preview: 'Preview alarm', back: 'Back',
  needLocSave: 'Location is needed to time this alarm — allow it first.',

  /* sound picker */
  soundH: 'Alarm sound', yourSounds: 'Your sounds', addSound: 'Add a new sound', builtin: 'Built-in tones', soundsNote: 'Add any audio file, such as an adhan. It stays on this device.',
  playing: 'Stop', play: 'Play', removeSound: 'Remove', soundTooBig: 'That file is too large (12 MB max).',

  /* challenges */
  chName: { none: 'Normal alarm', questions: 'Questions', shake: 'Shake to wake', math: 'Math', memory: 'Memory challenge', qr: 'Scan a QR code', type: 'Type to wake', random: 'Random challenge' },
  chDesc: { none: 'Wake up without any challenge', questions: 'Answer 3 questions to stop the alarm', shake: 'Shake your phone several times to stop the alarm', math: 'Solve 3 math questions to stop the alarm', memory: 'Match the cards to stop the alarm', qr: 'Scan your saved QR code to stop the alarm', type: 'Type the sentence to stop the alarm', random: 'A different challenge each day' },
  chPreviewBar: 'You will need to complete the challenge when the alarm rings', stopPreview: 'Stop preview',
  qrSaved: 'QR code saved', qrNone: 'No QR code saved yet', qrScanSave: 'Scan a QR code to save it', qrUnsupported: 'This browser cannot scan QR codes. Use another challenge.',
  qrScanning: 'Point the camera at your saved QR code', qrWrong: 'That is not the saved code', qrCamera: 'Camera is not available', qrSaveTitle: 'Scan the code you will keep near your bed',

  /* sleep reminder */
  sleepH1: 'Sleep reminder', sleepH2: 'Get enough sleep',
  sleepLead: 'Remind me to sleep early, so I can wake for Fajr easily.', sleepAdjust: 'The reminder time follows your Fajr alarm every day.',
  hrsBefore: 'Hours before Fajr', minBefore: 'Minutes',
  sleepAt: (t) => `Reminder at ${t}`,

  /* are you awake */
  awakeH1: 'Are you awake?', awakeH2: 'Do not go back to sleep',
  awakeLead: 'After the alarm you get a notification to confirm you are awake. If you do not, the alarm rings again.',
  awakeAfter: 'How long after the alarm should we check?', awakeMin: (n) => `After ${n} min`,

  /* ring screen */
  awakeTitle: 'Are you awake?', awakeBtn: 'Yes, I’m awake', awakeLine: 'Confirm to stop the alarm from ringing again.',
  sleepTitle: 'Time to sleep', sleepLine: 'Sleep now so you can wake for Fajr.', sleepOk: 'OK',
  snoozeBtn: (n) => `Snooze ${n} min`, ringTitle: (p) => `Time for ${p}`,
  qOf: (i, n) => `Question ${i} of ${n}`, tapNext: 'Next',
  shakeHint: (n, total) => `Shake your phone — ${n} / ${total}`, shakeAsk: 'Allow motion sensor', shakeFallback: 'No motion sensor here — tap the button instead',
  memoryHint: 'Find all the matching pairs', typeHint: 'Type this sentence exactly', typePh: 'Type here',
  doneChallenge: 'Well done', try: 'Try again', wrongAns: 'Not quite — try again',
  notifBody: 'Tap to open the alarm', awakeNotif: 'Are you awake? Tap to confirm', sleepNotif: 'Time to sleep so you can wake for Fajr',

  /* timetable */
  tabOccasions: 'Occasions', tabMonth: 'Monthly times',
  ttMiladi: 'Date', ttDay: 'Day', ttHijri: 'Hijri', ttToday: 'Today',
  ttFajr: 'Fajr', ttSunrise: 'Sunrise', ttDhuhr: 'Dhuhr', ttAsr: 'Asr', ttMaghrib: 'Maghrib', ttIsha: 'Isha',
  ttPrev: 'Previous month', ttNext: 'Next month', ttAddCal: 'Add prayer times to your calendar', ttShare: 'Share', ttCopied: 'Copied to clipboard',
  ttMethod: 'Calculation method', ttNeedLoc: 'Allow your location to see the monthly prayer times.',
  ttShareText: (date, hijri, lines) => `${date} — ${hijri}\n${lines}`,
}

const ar = {
  listH1: 'منبهات الصلاة', listH2: 'استيقظ لكل صلاة', listTag: 'منبه',
  rings: 'يرن', off: 'متوقف', on: 'مفعّل',
  atTime: 'عند وقت الصلاة',
  relBefore: (m, p) => `قبل ${p} بـ ${m.toLocaleString('ar-EG')} د`, relAfter: (m, p) => `بعد ${p} بـ ${m.toLocaleString('ar-EG')} د`,
  needLocTitle: 'نحتاج إلى موقعك', needLocLead: 'تُحسب أوقات الصلاة على جهازك بحسب مكانك.', needLocBtn: 'استخدم موقعي', locDenied: 'الموقع محظور — اسمح به من إعدادات الموقع في المتصفح.',
  notifLead: 'يصلك إشعار عند موعد كل منبه.', notifAsk: 'فعّل الإشعارات', notifOn: 'الإشعارات مفعّلة', notifBlocked: 'الإشعارات محظورة في إعدادات متصفّحك.', notifUnsupported: 'هذا المتصفح لا يدعم الإشعارات.',
  keepOpen: 'تعمل المنبهات والصفحة مفتوحة. أبقِ الصفحة مفتوحة والشاشة صاحية؛ نُبقي الشاشة صاحية ما دام هناك منبه مفعّل. المتصفح لا يستطيع تشغيل منبه في صفحة مغلقة.',
  installTitle: 'ثبّت الموقع على الشاشة الرئيسية', installLead: 'افتح الموقع كأنه تطبيق، وابقَ قريبًا من منبهاتك.', installBtn: 'تثبيت', installHow: 'من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية».', installed: 'تم التثبيت',
  sleepRow: 'التذكير بوقت النوم', nextSleep: (t) => `القادم: ${t}`,

  editH1: (p) => `منبه ${p}`, editH2: 'ضبط المنبه', editTag: 'ضبط',
  tabFixed: 'الوقت المحدد', tabPrayer: 'وفقًا إلى الصلاة',
  hour: 'ساعات', minute: 'دقائق', ampm: ['ص', 'م'],
  anchorFajr: 'الفجر', anchorSunrise: 'الشروق',
  minsLab: 'دقائق', before: 'قبل', after: 'بعد',
  ringsIn: (s) => `يرن خلال ${s}`,
  sound: 'الصوت', volume: 'مستوى صوت المنبه', volumeNote: 'سيستخدم هذا المنبه إعدادات مستوى الصوت الحالية لهاتفك.', volumeCustom: 'علوّ صوت المنبه',
  gentle: 'منبه هادئ', gentleNote: 'يبدأ المنبه من أقل مستوى صوت ويزداد تدريجيًا.',
  challenge: 'التحدي', snooze: 'غفوة', snoozeOff: 'إيقاف', snoozeN: (n) => `${n.toLocaleString('ar-EG')} د`,
  awakeRow: 'هل استيقظت؟', save: 'حفظ', saved: 'تم الحفظ', preview: 'عرض المنبه', back: 'رجوع',
  needLocSave: 'نحتاج إلى الموقع لضبط وقت هذا المنبه — اسمح به أولًا.',

  soundH: 'صوت المنبه', yourSounds: 'أصواتك', addSound: 'أضف صوتًا جديدًا', builtin: 'نغمات جاهزة', soundsNote: 'أضف أي ملف صوتي، مثل أذان. يبقى على هذا الجهاز.',
  playing: 'إيقاف', play: 'تشغيل', removeSound: 'حذف', soundTooBig: 'الملف كبير جدًا (الحد 12 ميغابايت).',

  chName: { none: 'منبه عادي', questions: 'الأسئلة', shake: 'هز الجهاز لتستيقظ', math: 'حساب', memory: 'تحدي الذاكرة', qr: 'مسح رمز QR', type: 'اكتب واستيقظ', random: 'تحدي عشوائي' },
  chDesc: { none: 'الاستيقاظ بدون أي تحدي', questions: 'أجب عن ٣ أسئلة لإيقاف المنبه', shake: 'هز هاتفك عدة مرات لإيقاف المنبه', math: 'حل ٣ أسئلة رياضيات لإيقاف المنبه', memory: 'طابق البطاقات لإيقاف الإنذار', qr: 'امسح رمز QR محفوظًا لإيقاف المنبه', type: 'اكتب الجملة لإيقاف المنبه', random: 'استيقظ لمواجهة تحدٍّ مختلف كل يوم' },
  chPreviewBar: 'ستحتاج إلى إكمال التحدي عندما يعمل المنبه', stopPreview: 'وقف العرض',
  qrSaved: 'تم حفظ رمز QR', qrNone: 'لا يوجد رمز QR محفوظ بعد', qrScanSave: 'امسح رمز QR لحفظه', qrUnsupported: 'هذا المتصفح لا يستطيع مسح رموز QR. اختر تحديًا آخر.',
  qrScanning: 'وجّه الكاميرا إلى رمز QR المحفوظ', qrWrong: 'هذا ليس الرمز المحفوظ', qrCamera: 'الكاميرا غير متاحة', qrSaveTitle: 'امسح الرمز الذي ستضعه قرب سريرك',

  sleepH1: 'التذكير بوقت النوم', sleepH2: 'احصل على قسط كافٍ من النوم',
  sleepLead: 'ذكّرني بالنوم مبكرًا حتى أستطيع الاستيقاظ لصلاة الفجر بسهولة.', sleepAdjust: 'يتغير وقت التذكير يوميًا وفقًا لمنبه الفجر.',
  hrsBefore: 'ساعات قبل الفجر', minBefore: 'دقائق',
  sleepAt: (t) => `التذكير الساعة ${t}`,

  awakeH1: 'هل استيقظت؟', awakeH2: 'لا تعُد للنوم مجددًا',
  awakeLead: 'ستصلك إشعارات بعد انتهاء المنبه للتأكد من أنك مستيقظ، وإذا لم تؤكد فسيعود المنبه للرنين.',
  awakeAfter: 'كم من الوقت بعد المنبه تود أن يتم التحقق من استيقاظك؟', awakeMin: (n) => `بعد ${n.toLocaleString('ar-EG')} دقائق`,

  awakeTitle: 'هل استيقظت؟', awakeBtn: 'نعم، أنا مستيقظ', awakeLine: 'أكّد حتى لا يعود المنبه للرنين.',
  sleepTitle: 'حان وقت النوم', sleepLine: 'نم الآن حتى تستيقظ لصلاة الفجر.', sleepOk: 'حسنًا',
  snoozeBtn: (n) => `غفوة ${n.toLocaleString('ar-EG')} د`, ringTitle: (p) => `حان وقت صلاة ${p}`,
  qOf: (i, n) => `السؤال ${i.toLocaleString('ar-EG')} من ${n.toLocaleString('ar-EG')}`, tapNext: 'التالي',
  shakeHint: (n, total) => `هزّ هاتفك — ${n.toLocaleString('ar-EG')} / ${total.toLocaleString('ar-EG')}`, shakeAsk: 'اسمح بحساس الحركة', shakeFallback: 'لا يوجد حساس حركة هنا — اضغط على الزر بدلًا من ذلك',
  memoryHint: 'اعثر على كل الأزواج المتطابقة', typeHint: 'اكتب هذه الجملة كما هي', typePh: 'اكتب هنا',
  doneChallenge: 'أحسنت', try: 'حاول مرة أخرى', wrongAns: 'ليست صحيحة — حاول مرة أخرى',
  notifBody: 'اضغط لفتح المنبه', awakeNotif: 'هل استيقظت؟ اضغط للتأكيد', sleepNotif: 'حان وقت النوم لتستيقظ لصلاة الفجر',

  tabOccasions: 'المناسبات', tabMonth: 'مواقيت الشهر',
  ttMiladi: 'الميلادي', ttDay: 'اليوم', ttHijri: 'الهجري', ttToday: 'اليوم',
  ttFajr: 'الفجر', ttSunrise: 'الشروق', ttDhuhr: 'الظهر', ttAsr: 'العصر', ttMaghrib: 'المغرب', ttIsha: 'العشاء',
  ttPrev: 'الشهر السابق', ttNext: 'الشهر التالي', ttAddCal: 'أضف مواقيت الصلاة إلى تقويمك', ttShare: 'مشاركة', ttCopied: 'تم النسخ',
  ttMethod: 'طريقة الحساب', ttNeedLoc: 'اسمح بالوصول إلى موقعك لعرض مواقيت الصلاة للشهر.',
}

const PACKS = { en, ar }
/** strings for a language; any key it lacks falls back to English */
export const A = (lang) => (lang === 'en' || !PACKS[lang] ? en : { ...en, ...PACKS[lang] })
