export type Locale = 'en' | 'de' | 'it' | 'ja' | 'es' | 'fr' | 'pt' | 'ko';

export const LOCALES: { code: Locale; native: string; path: string }[] = [
  { code: 'en', native: 'English', path: '/' },
  { code: 'de', native: 'Deutsch', path: '/de/' },
  { code: 'it', native: 'Italiano', path: '/it/' },
  { code: 'ja', native: '日本語', path: '/ja/' },
  { code: 'es', native: 'Español', path: '/es/' },
  { code: 'fr', native: 'Français', path: '/fr/' },
  { code: 'pt', native: 'Português', path: '/pt/' },
  { code: 'ko', native: '한국어', path: '/ko/' },
];

export interface Dict {
  metaTitle: string;
  metaDescription: string;
  navGuides: string;
  navMeasure: string;
  headerTag: string;
  heroEyebrow: string;
  heroH1: string;
  heroSub: string;
  startMeasuring: string;
  howAccuracy: string;
  liveRegion: string;
  unit: string;
  statusIdle: string;
  statusRequesting: string;
  statusRunning: string;
  statusPaused: string;
  statusStopped: string;
  statusError: string;
  calibrationUncal: string;
  calibrationCal: string;
  micPermission: string;
  permUnknown: string;
  permGranted: string;
  permDenied: string;
  permPrompt: string;
  micSelect: string;
  micDefault: string;
  btnStart: string;
  btnPause: string;
  btnResume: string;
  btnStop: string;
  btnReset: string;
  btnRetry: string;
  btnDismiss: string;
  statCurrent: string;
  statMin: string;
  statLeq: string;
  statMax: string;
  statDuration: string;
  graphLabel: string;
  graphEmpty: string;
  advanced: string;
  weighting: string;
  weightA: string;
  weightC: string;
  weightZ: string;
  response: string;
  respFast: string;
  respSlow: string;
  calTitle: string;
  calOffset: string;
  calLabel: string;
  calApply: string;
  calReset: string;
  sessionDetails: string;
  deviceInfo: string;
  exportTitle: string;
  exportCsv: string;
  exportJson: string;
  historyTitle: string;
  historyEmpty: string;
  historyClear: string;
  stepsTitle: string;
  step1t: string;
  step1d: string;
  step2t: string;
  step2d: string;
  step3t: string;
  step3d: string;
  accTitle: string;
  accBody: string;
  troubleTitle: string;
  troubleBody: string;
  sessionTitle: string;
  sessionBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  guidesTitle: string;
  footerNote: string;
  footerRights: string;
}

function base(over: Dict): Dict {
  return over;
}

const enFaq = [
  {
    q: 'Is this a calibrated sound level meter?',
    a: 'No. Browser microphones vary by device, so readings are estimates. For safety or legal decisions, use a calibrated Class 1 or Class 2 meter.',
  },
  {
    q: 'Is my audio uploaded or recorded?',
    a: 'No. All processing runs locally in your browser via the Web Audio API. Audio never leaves your device through this site.',
  },
  {
    q: 'Why does the meter show --?',
    a: 'The idle display shows -- until you grant microphone permission and press Start. No simulated values are ever shown.',
  },
  {
    q: 'What do dB, dBA, Fast and Slow mean?',
    a: 'dB is the sound level unit. A-weighting (dBA) approximates human hearing; C is flatter; Z is unweighted. Fast (125 ms) follows peaks, Slow (1 s) smooths them.',
  },
  {
    q: 'Can I save a session?',
    a: 'Yes. Export the current session as CSV or JSON, or keep a local history in this browser. Nothing is sent to a server.',
  },
];

export const dicts: Record<Locale, Dict> = {
  en: base({
    metaTitle: 'Real Decibel Meter — Online Decibel Meter in Your Browser',
    metaDescription: 'Measure ambient sound levels in your browser. Local Web Audio processing, no uploads, honest uncalibrated estimates.',
    navGuides: 'Guides', navMeasure: 'Measure', headerTag: 'Browser SPL estimate',
    heroEyebrow: 'Client-side Web Audio meter', heroH1: 'Online Decibel Meter',
    heroSub: 'Microphone readings run entirely inside your browser — nothing is uploaded or recorded.',
    startMeasuring: 'Start Measuring', howAccuracy: 'How Accuracy Works',
    liveRegion: 'Live measurement status',
    unit: 'dB (estimated)', statusIdle: 'Idle', statusRequesting: 'Requesting permission…',
    statusRunning: 'Measuring', statusPaused: 'Paused', statusStopped: 'Stopped', statusError: 'Attention needed',
    calibrationUncal: 'Uncalibrated — readings are estimates only', calibrationCal: 'Calibrated',
    micPermission: 'Microphone', permUnknown: 'Not requested', permGranted: 'Granted', permDenied: 'Denied', permPrompt: 'Prompt',
    micSelect: 'Microphone input', micDefault: 'Default microphone',
    btnStart: 'Start', btnPause: 'Pause', btnResume: 'Resume', btnStop: 'Stop', btnReset: 'Reset',
    btnRetry: 'Try again', btnDismiss: 'Dismiss',
    statCurrent: 'Current', statMin: 'Minimum', statLeq: 'Energy average (Leq)', statMax: 'Maximum', statDuration: 'Duration',
    graphLabel: 'Level history', graphEmpty: 'Press Start to record the live graph. Past levels appear here.',
    advanced: 'Advanced controls', weighting: 'Frequency weighting', weightA: 'A-weighting (speech-like)',
    weightC: 'C-weighting (flatter)', weightZ: 'Z-weighting (flat)',
    response: 'Time response', respFast: 'Fast (125 ms)', respSlow: 'Slow (1 s)',
    calTitle: 'Calibration', calOffset: 'Offset in dB', calLabel: 'Reference note (e.g. “office calibrator 94 dB”)',
    calApply: 'Apply calibration', calReset: 'Reset to uncalibrated',
    sessionDetails: 'Session details', deviceInfo: 'Device & microphone',
    exportTitle: 'Session & export', exportCsv: 'Export CSV', exportJson: 'Export JSON',
    historyTitle: 'Local history', historyEmpty: 'No saved sessions yet on this device.', historyClear: 'Clear history',
    stepsTitle: 'Measure in three steps', step1t: 'Allow the microphone', step1d: 'Press Start and grant permission when the browser asks. Audio stays on your device.',
    step2t: 'Watch the live panel', step2d: 'Read current, minimum, energy-average and maximum levels with the live graph.',
    step3t: 'Tune and export', step3d: 'Pick weighting and response, optionally calibrate, then export CSV or JSON.',
    accTitle: 'How accuracy works', accBody: 'Phone and laptop microphones are not calibrated instruments: gain, placement and frequency response differ per device. This tool reports an honest browser estimate, never a certified reading. Compare against a known reference to add an offset, and use a calibrated meter for safety, workplace or legal decisions.',
    troubleTitle: 'Microphone permission troubleshooting', troubleBody: 'If permission was denied, open the lock/tune icon in the address bar and allow the microphone, then press Start again. If no device appears, connect one and reload. If another app holds the mic (calls, recorders), close it first.',
    sessionTitle: 'Sessions & export', sessionBody: 'Each run accumulates current, min, Leq and max plus duration. Export CSV for spreadsheets or JSON for code. Local history stores up to 20 sessions in this browser only.',
    faqTitle: 'Frequently asked questions', faq: enFaq,
    guidesTitle: 'Related guides', footerNote: 'Static client-side meter. Audio never leaves your browser.',
    footerRights: 'All rights reserved.',
  }),
  de: base({
    metaTitle: 'Real Decibel Meter — Online-Schallpegelmesser im Browser',
    metaDescription: 'Messen Sie Umgebungslautstärke im Browser. Lokale Web-Audio-Verarbeitung, keine Uploads, ehrliche Schätzwerte.',
    navGuides: 'Anleitungen', navMeasure: 'Messen', headerTag: 'Browser-Schätzwert',
    heroEyebrow: 'Clientseitiges Web-Audio-Messgerät', heroH1: 'Online Decibel Meter',
    heroSub: 'Mikrofonwerte werden vollständig in Ihrem Browser berechnet — nichts wird hochgeladen oder aufgenommen.',
    startMeasuring: 'Messung starten', howAccuracy: 'So funktioniert Genauigkeit',
    liveRegion: 'Live-Messstatus',
    unit: 'dB (geschätzt)', statusIdle: 'Bereit', statusRequesting: 'Berechtigung wird angefragt…',
    statusRunning: 'Misst', statusPaused: 'Pausiert', statusStopped: 'Gestoppt', statusError: 'Achtung erforderlich',
    calibrationUncal: 'Unkalibriert — Werte sind nur Schätzungen', calibrationCal: 'Kalibriert',
    micPermission: 'Mikrofon', permUnknown: 'Nicht angefragt', permGranted: 'Erteilt', permDenied: 'Verweigert', permPrompt: 'Abfrage',
    micSelect: 'Mikrofoneingang', micDefault: 'Standardmikrofon',
    btnStart: 'Start', btnPause: 'Pause', btnResume: 'Fortsetzen', btnStop: 'Stopp', btnReset: 'Zurücksetzen',
    btnRetry: 'Erneut versuchen', btnDismiss: 'Schließen',
    statCurrent: 'Aktuell', statMin: 'Minimum', statLeq: 'Energiemittel (Leq)', statMax: 'Maximum', statDuration: 'Dauer',
    graphLabel: 'Pegelverlauf', graphEmpty: 'Drücken Sie Start, um den Live-Graphen aufzuzeichnen.',
    advanced: 'Erweiterte Steuerung', weighting: 'Frequenzbewertung', weightA: 'A-Bewertung (gehörähnlich)',
    weightC: 'C-Bewertung (flacher)', weightZ: 'Z-Bewertung (linear)',
    response: 'Zeitbewertung', respFast: 'Schnell (125 ms)', respSlow: 'Langsam (1 s)',
    calTitle: 'Kalibrierung', calOffset: 'Offset in dB', calLabel: 'Referenznotiz',
    calApply: 'Kalibrierung anwenden', calReset: 'Auf unkalibriert zurücksetzen',
    sessionDetails: 'Sitzungsdetails', deviceInfo: 'Gerät & Mikrofon',
    exportTitle: 'Sitzung & Export', exportCsv: 'CSV exportieren', exportJson: 'JSON exportieren',
    historyTitle: 'Lokaler Verlauf', historyEmpty: 'Noch keine gespeicherten Sitzungen.', historyClear: 'Verlauf löschen',
    stepsTitle: 'In drei Schritten messen', step1t: 'Mikrofon erlauben', step1d: 'Drücken Sie Start und erteilen Sie die Berechtigung. Audio bleibt auf Ihrem Gerät.',
    step2t: 'Live-Anzeige beobachten', step2d: 'Aktuell, Minimum, Energiemittel und Maximum mit Live-Graph ablesen.',
    step3t: 'Anpassen und exportieren', step3d: 'Bewertung und Zeitkonstante wählen, optional kalibrieren, dann exportieren.',
    accTitle: 'So funktioniert Genauigkeit', accBody: 'Handy- und Laptop-Mikrofone sind keine kalibrierten Messgeräte. Dieses Tool liefert ehrliche Browser-Schätzwerte, keine zertifizierten Messungen.',
    troubleTitle: 'Mikrofon-Fehlerbehebung', troubleBody: 'Bei verweigerter Berechtigung öffnen Sie das Schloss-Symbol in der Adressleiste, erlauben das Mikrofon und drücken erneut Start.',
    sessionTitle: 'Sitzungen & Export', sessionBody: 'Jeder Lauf speichert Aktuell, Min, Leq, Max und Dauer. CSV oder JSON exportieren; Verlauf bleibt lokal.',
    faqTitle: 'Häufige Fragen',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: 'Verwandte Anleitungen', footerNote: 'Statisches clientseitiges Messgerät. Audio verlässt nie Ihren Browser.',
    footerRights: 'Alle Rechte vorbehalten.',
  }),
  it: base({
    metaTitle: 'Real Decibel Meter — Fonometro online nel browser',
    metaDescription: 'Misura il rumore ambientale nel browser. Elaborazione Web Audio locale, nessun caricamento, stime oneste.',
    navGuides: 'Guide', navMeasure: 'Misura', headerTag: 'Stima browser',
    heroEyebrow: 'Misuratore Web Audio lato client', heroH1: 'Online Decibel Meter',
    heroSub: 'Le letture del microfono avvengono interamente nel tuo browser — nulla viene caricato o registrato.',
    startMeasuring: 'Inizia a misurare', howAccuracy: 'Come funziona la precisione',
    liveRegion: 'Stato misurazione live',
    unit: 'dB (stimato)', statusIdle: 'In attesa', statusRequesting: 'Richiesta permesso…',
    statusRunning: 'Misurazione', statusPaused: 'In pausa', statusStopped: 'Fermato', statusError: 'Attenzione richiesta',
    calibrationUncal: 'Non calibrato — letture solo stimate', calibrationCal: 'Calibrato',
    micPermission: 'Microfono', permUnknown: 'Non richiesto', permGranted: 'Concesso', permDenied: 'Negato', permPrompt: 'Richiesta',
    micSelect: 'Ingresso microfono', micDefault: 'Microfono predefinito',
    btnStart: 'Avvia', btnPause: 'Pausa', btnResume: 'Riprendi', btnStop: 'Ferma', btnReset: 'Azzera',
    btnRetry: 'Riprova', btnDismiss: 'Chiudi',
    statCurrent: 'Attuale', statMin: 'Minimo', statLeq: 'Media energetica (Leq)', statMax: 'Massimo', statDuration: 'Durata',
    graphLabel: 'Cronologia livelli', graphEmpty: 'Premi Avvia per registrare il grafico live.',
    advanced: 'Controlli avanzati', weighting: 'Ponderazione', weightA: 'Ponderazione A',
    weightC: 'Ponderazione C', weightZ: 'Ponderazione Z',
    response: 'Risposta temporale', respFast: 'Veloce (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibrazione', calOffset: 'Offset in dB', calLabel: 'Nota di riferimento',
    calApply: 'Applica calibrazione', calReset: 'Ripristina non calibrato',
    sessionDetails: 'Dettagli sessione', deviceInfo: 'Dispositivo e microfono',
    exportTitle: 'Sessione ed export', exportCsv: 'Esporta CSV', exportJson: 'Esporta JSON',
    historyTitle: 'Cronologia locale', historyEmpty: 'Nessuna sessione salvata.', historyClear: 'Cancella cronologia',
    stepsTitle: 'Misura in tre passi', step1t: 'Consenti il microfono', step1d: 'Premi Avvia e concedi il permesso. L’audio resta sul tuo dispositivo.',
    step2t: 'Osserva il pannello live', step2d: 'Leggi valori attuali, minimi, medi e massimi con il grafico live.',
    step3t: 'Regola ed esporta', step3d: 'Scegli ponderazione e risposta, calibra se vuoi, poi esporta.',
    accTitle: 'Come funziona la precisione', accBody: 'I microfoni di telefoni e laptop non sono strumenti calibrati. Questo strumento fornisce stime oneste del browser, mai letture certificate.',
    troubleTitle: 'Risoluzione problemi microfono', troubleBody: 'Se il permesso è negato, apri l’icona del lucchetto nella barra degli indirizzi, consenti il microfono e premi di nuovo Avvia.',
    sessionTitle: 'Sessioni ed export', sessionBody: 'Ogni sessione accumula valori attuali, min, Leq, max e durata. Esporta CSV o JSON; la cronologia resta locale.',
    faqTitle: 'Domande frequenti',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: 'Guide correlate', footerNote: 'Misuratore statico lato client. L’audio non lascia mai il browser.',
    footerRights: 'Tutti i diritti riservati.',
  }),
  ja: base({
    metaTitle: 'Real Decibel Meter — ブラウザで使えるオンライン騒音計',
    metaDescription: 'ブラウザで環境騒音を測定。Web Audioによるローカル処理、アップロードなし、正直な推定値。',
    navGuides: 'ガイド', navMeasure: '測定', headerTag: 'ブラウザ推定',
    heroEyebrow: 'クライアントサイドWeb Audioメーター', heroH1: 'Online Decibel Meter',
    heroSub: 'マイクの読み取りはすべてブラウザ内で処理されます — アップロードや録音は行いません。',
    startMeasuring: '測定を開始', howAccuracy: '精度の仕組み',
    liveRegion: 'ライブ測定ステータス',
    unit: 'dB（推定）', statusIdle: '待機中', statusRequesting: '許可を要求中…',
    statusRunning: '測定中', statusPaused: '一時停止中', statusStopped: '停止', statusError: '確認が必要です',
    calibrationUncal: '未校正 — 読み値は推定のみ', calibrationCal: '校正済み',
    micPermission: 'マイク', permUnknown: '未要求', permGranted: '許可', permDenied: '拒否', permPrompt: '確認',
    micSelect: 'マイク入力', micDefault: '既定のマイク',
    btnStart: '開始', btnPause: '一時停止', btnResume: '再開', btnStop: '停止', btnReset: 'リセット',
    btnRetry: '再試行', btnDismiss: '閉じる',
    statCurrent: '現在', statMin: '最小', statLeq: 'エネルギー平均 (Leq)', statMax: '最大', statDuration: '時間',
    graphLabel: 'レベル履歴', graphEmpty: '開始を押すとライブグラフが記録されます。',
    advanced: '詳細設定', weighting: '周波数重み付け', weightA: 'A特性',
    weightC: 'C特性', weightZ: 'Z特性（フラット）',
    response: '時定数', respFast: 'Fast（125ms）', respSlow: 'Slow（1s）',
    calTitle: '校正', calOffset: 'オフセット (dB)', calLabel: '基準メモ',
    calApply: '校正を適用', calReset: '未校正に戻す',
    sessionDetails: 'セッション詳細', deviceInfo: 'デバイスとマイク',
    exportTitle: 'セッションと出力', exportCsv: 'CSVを出力', exportJson: 'JSONを出力',
    historyTitle: 'ローカル履歴', historyEmpty: '保存されたセッションはまだありません。', historyClear: '履歴を消去',
    stepsTitle: '3ステップで測定', step1t: 'マイクを許可', step1d: '開始を押して許可します。音声はデバイス内に留まります。',
    step2t: 'ライブパネルを見る', step2d: '現在・最小・平均・最大をライブグラフで確認します。',
    step3t: '調整と出力', step3d: '重み付けと時定数を選び、必要なら校正して出力します。',
    accTitle: '精度の仕組み', accBody: 'スマートフォンやノートPCのマイクは校正された測定器ではありません。本ツールは正直なブラウザ推定値を示し、認定測定値ではありません。',
    troubleTitle: 'マイクのトラブル解決', troubleBody: '許可が拒否された場合はアドレスバーの錠前アイコンからマイクを許可し、再度開始を押してください。',
    sessionTitle: 'セッションと出力', sessionBody: '各セッションは現在・最小・Leq・最大・時間を蓄積します。CSV/JSONで出力、履歴はローカルのみ。',
    faqTitle: 'よくある質問',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: '関連ガイド', footerNote: '静的クライアントサイドメーター。音声がブラウザ外に出ることはありません。',
    footerRights: 'All rights reserved.',
  }),
  es: base({
    metaTitle: 'Real Decibel Meter — Sonómetro online en tu navegador',
    metaDescription: 'Mide el ruido ambiental en tu navegador. Procesamiento Web Audio local, sin subidas, estimaciones honestas.',
    navGuides: 'Guías', navMeasure: 'Medir', headerTag: 'Estimación del navegador',
    heroEyebrow: 'Medidor Web Audio local', heroH1: 'Online Decibel Meter',
    heroSub: 'Las lecturas del micrófono se procesan por completo en tu navegador — nada se sube ni se graba.',
    startMeasuring: 'Empezar a medir', howAccuracy: 'Cómo funciona la precisión',
    liveRegion: 'Estado de medición en vivo',
    unit: 'dB (estimado)', statusIdle: 'Inactivo', statusRequesting: 'Solicitando permiso…',
    statusRunning: 'Midiendo', statusPaused: 'En pausa', statusStopped: 'Detenido', statusError: 'Atención necesaria',
    calibrationUncal: 'Sin calibrar — solo estimaciones', calibrationCal: 'Calibrado',
    micPermission: 'Micrófono', permUnknown: 'No solicitado', permGranted: 'Concedido', permDenied: 'Denegado', permPrompt: 'Preguntar',
    micSelect: 'Entrada de micrófono', micDefault: 'Micrófono predeterminado',
    btnStart: 'Iniciar', btnPause: 'Pausar', btnResume: 'Reanudar', btnStop: 'Detener', btnReset: 'Restablecer',
    btnRetry: 'Reintentar', btnDismiss: 'Cerrar',
    statCurrent: 'Actual', statMin: 'Mínimo', statLeq: 'Promedio energético (Leq)', statMax: 'Máximo', statDuration: 'Duración',
    graphLabel: 'Historial de nivel', graphEmpty: 'Pulsa Iniciar para registrar el gráfico en vivo.',
    advanced: 'Controles avanzados', weighting: 'Ponderación', weightA: 'Ponderación A',
    weightC: 'Ponderación C', weightZ: 'Ponderación Z',
    response: 'Respuesta temporal', respFast: 'Rápida (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibración', calOffset: 'Desviación en dB', calLabel: 'Nota de referencia',
    calApply: 'Aplicar calibración', calReset: 'Volver a sin calibrar',
    sessionDetails: 'Detalles de sesión', deviceInfo: 'Dispositivo y micrófono',
    exportTitle: 'Sesión y exportación', exportCsv: 'Exportar CSV', exportJson: 'Exportar JSON',
    historyTitle: 'Historial local', historyEmpty: 'Aún no hay sesiones guardadas.', historyClear: 'Borrar historial',
    stepsTitle: 'Mide en tres pasos', step1t: 'Permite el micrófono', step1d: 'Pulsa Iniciar y concede el permiso. El audio queda en tu dispositivo.',
    step2t: 'Observa el panel en vivo', step2d: 'Lee valores actuales, mínimos, promedio y máximos con el gráfico.',
    step3t: 'Ajusta y exporta', step3d: 'Elige ponderación y respuesta, calibra si quieres y exporta.',
    accTitle: 'Cómo funciona la precisión', accBody: 'Los micrófonos de teléfonos y portátiles no son instrumentos calibrados. Esta herramienta ofrece estimaciones honestas del navegador, nunca lecturas certificadas.',
    troubleTitle: 'Solución de problemas del micrófono', troubleBody: 'Si el permiso fue denegado, abre el icono del candado en la barra de direcciones, permite el micrófono y pulsa Iniciar de nuevo.',
    sessionTitle: 'Sesiones y exportación', sessionBody: 'Cada sesión acumula actual, mín, Leq, máx y duración. Exporta CSV o JSON; el historial queda en local.',
    faqTitle: 'Preguntas frecuentes',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: 'Guías relacionadas', footerNote: 'Medidor estático local. El audio nunca sale de tu navegador.',
    footerRights: 'Todos los derechos reservados.',
  }),
  fr: base({
    metaTitle: 'Real Decibel Meter — Sonomètre en ligne dans votre navigateur',
    metaDescription: 'Mesurez le bruit ambiant dans votre navigateur. Traitement Web Audio local, aucun envoi, estimations honnêtes.',
    navGuides: 'Guides', navMeasure: 'Mesurer', headerTag: 'Estimation navigateur',
    heroEyebrow: 'Sonomètre Web Audio local', heroH1: 'Online Decibel Meter',
    heroSub: 'Les lectures du microphone sont calculées entièrement dans votre navigateur — rien n’est envoyé ni enregistré.',
    startMeasuring: 'Commencer à mesurer', howAccuracy: 'Précision : comment ça marche',
    liveRegion: 'État de mesure en direct',
    unit: 'dB (estimé)', statusIdle: 'Au repos', statusRequesting: 'Demande d’autorisation…',
    statusRunning: 'Mesure en cours', statusPaused: 'En pause', statusStopped: 'Arrêté', statusError: 'Attention requise',
    calibrationUncal: 'Non calibré — estimations uniquement', calibrationCal: 'Calibré',
    micPermission: 'Microphone', permUnknown: 'Non demandée', permGranted: 'Accordée', permDenied: 'Refusée', permPrompt: 'Demande',
    micSelect: 'Entrée microphone', micDefault: 'Microphone par défaut',
    btnStart: 'Démarrer', btnPause: 'Pause', btnResume: 'Reprendre', btnStop: 'Arrêter', btnReset: 'Réinitialiser',
    btnRetry: 'Réessayer', btnDismiss: 'Fermer',
    statCurrent: 'Actuel', statMin: 'Minimum', statLeq: 'Moyenne énergétique (Leq)', statMax: 'Maximum', statDuration: 'Durée',
    graphLabel: 'Historique du niveau', graphEmpty: 'Appuyez sur Démarrer pour enregistrer le graphique.',
    advanced: 'Contrôles avancés', weighting: 'Pondération', weightA: 'Pondération A',
    weightC: 'Pondération C', weightZ: 'Pondération Z',
    response: 'Réponse temporelle', respFast: 'Rapide (125 ms)', respSlow: 'Lente (1 s)',
    calTitle: 'Calibrage', calOffset: 'Décalage en dB', calLabel: 'Note de référence',
    calApply: 'Appliquer le calibrage', calReset: 'Revenir à non calibré',
    sessionDetails: 'Détails de session', deviceInfo: 'Appareil et microphone',
    exportTitle: 'Session et export', exportCsv: 'Exporter CSV', exportJson: 'Exporter JSON',
    historyTitle: 'Historique local', historyEmpty: 'Aucune session enregistrée.', historyClear: 'Effacer l’historique',
    stepsTitle: 'Mesurer en trois étapes', step1t: 'Autoriser le microphone', step1d: 'Appuyez sur Démarrer et accordez l’autorisation. L’audio reste sur votre appareil.',
    step2t: 'Suivre le panneau live', step2d: 'Lisez valeurs actuelles, min, moyenne et max avec le graphique live.',
    step3t: 'Régler et exporter', step3d: 'Choisissez pondération et réponse, calibrez si besoin, puis exportez.',
    accTitle: 'Précision : comment ça marche', accBody: 'Les microphones de téléphones et d’ordinateurs ne sont pas des instruments calibrés. Cet outil donne des estimations honnêtes du navigateur, jamais des mesures certifiées.',
    troubleTitle: 'Dépannage du microphone', troubleBody: 'Si l’autorisation est refusée, ouvrez l’icône cadenas dans la barre d’adresse, autorisez le microphone puis appuyez à nouveau sur Démarrer.',
    sessionTitle: 'Sessions et export', sessionBody: 'Chaque session accumule actuel, min, Leq, max et durée. Export CSV ou JSON ; l’historique reste local.',
    faqTitle: 'Questions fréquentes',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: 'Guides associés', footerNote: 'Sonomètre statique côté client. L’audio ne quitte jamais votre navigateur.',
    footerRights: 'Tous droits réservés.',
  }),
  pt: base({
    metaTitle: 'Real Decibel Meter — Medidor de decibéis online no navegador',
    metaDescription: 'Meça o ruído ambiente no navegador. Processamento Web Audio local, sem uploads, estimativas honestas.',
    navGuides: 'Guias', navMeasure: 'Medir', headerTag: 'Estimativa do navegador',
    heroEyebrow: 'Medidor Web Audio local', heroH1: 'Online Decibel Meter',
    heroSub: 'As leituras do microfone são processadas totalmente no seu navegador — nada é enviado ou gravado.',
    startMeasuring: 'Começar a medir', howAccuracy: 'Como funciona a precisão',
    liveRegion: 'Estado da medição ao vivo',
    unit: 'dB (estimado)', statusIdle: 'Inativo', statusRequesting: 'Solicitando permissão…',
    statusRunning: 'Medindo', statusPaused: 'Pausado', statusStopped: 'Parado', statusError: 'Atenção necessária',
    calibrationUncal: 'Sem calibração — apenas estimativas', calibrationCal: 'Calibrado',
    micPermission: 'Microfone', permUnknown: 'Não solicitado', permGranted: 'Concedido', permDenied: 'Negado', permPrompt: 'Perguntar',
    micSelect: 'Entrada de microfone', micDefault: 'Microfone padrão',
    btnStart: 'Iniciar', btnPause: 'Pausar', btnResume: 'Continuar', btnStop: 'Parar', btnReset: 'Redefinir',
    btnRetry: 'Tentar de novo', btnDismiss: 'Fechar',
    statCurrent: 'Atual', statMin: 'Mínimo', statLeq: 'Média energética (Leq)', statMax: 'Máximo', statDuration: 'Duração',
    graphLabel: 'Histórico de nível', graphEmpty: 'Prima Iniciar para registar o gráfico ao vivo.',
    advanced: ' controlos avançados', weighting: 'Ponderação', weightA: 'Ponderação A',
    weightC: 'Ponderação C', weightZ: 'Ponderação Z',
    response: 'Resposta temporal', respFast: 'Rápida (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibração', calOffset: 'Desvio em dB', calLabel: 'Nota de referência',
    calApply: 'Aplicar calibração', calReset: 'Voltar a sem calibração',
    sessionDetails: 'Detalhes da sessão', deviceInfo: 'Dispositivo e microfone',
    exportTitle: 'Sessão e exportação', exportCsv: 'Exportar CSV', exportJson: 'Exportar JSON',
    historyTitle: 'Histórico local', historyEmpty: 'Sem sessões guardadas.', historyClear: 'Limpar histórico',
    stepsTitle: 'Meça em três passos', step1t: 'Permita o microfone', step1d: 'Prima Iniciar e conceda a permissão. O áudio fica no seu dispositivo.',
    step2t: 'Observe o painel ao vivo', step2d: 'Leia valores atuais, mínimos, médios e máximos com o gráfico.',
    step3t: 'Ajuste e exporte', step3d: 'Escolha ponderação e resposta, calibre se quiser e exporte.',
    accTitle: 'Como funciona a precisão', accBody: 'Os microfones de telemóveis e portáteis não são instrumentos calibrados. Esta ferramenta dá estimativas honestas do navegador, nunca leituras certificadas.',
    troubleTitle: 'Resolução de problemas do microfone', troubleBody: 'Se a permissão foi negada, abra o cadeado na barra de endereços, permita o microfone e prima Iniciar novamente.',
    sessionTitle: 'Sessões e exportação', sessionBody: 'Cada sessão acumula atual, mín, Leq, máx e duração. Exporte CSV ou JSON; o histórico fica local.',
    faqTitle: 'Perguntas frequentes',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: 'Guias relacionados', footerNote: 'Medidor estático local. O áudio nunca sai do seu navegador.',
    footerRights: 'Todos os direitos reservados.',
  }),
  ko: base({
    metaTitle: 'Real Decibel Meter — 브라우저 온라인 데시벨 미터',
    metaDescription: '브라우저에서 주변 소음을 측정하세요. Web Audio 로컬 처리, 업로드 없음, 정직한 추정치.',
    navGuides: '가이드', navMeasure: '측정', headerTag: '브라우저 추정치',
    heroEyebrow: '클라이언트 측 Web Audio 미터', heroH1: 'Online Decibel Meter',
    heroSub: '마이크 판독값은 전적으로 브라우저 안에서 처리됩니다 — 업로드나 녹음하지 않습니다.',
    startMeasuring: '측정 시작', howAccuracy: '정확도 원리',
    liveRegion: '실시간 측정 상태',
    unit: 'dB (추정)', statusIdle: '대기', statusRequesting: '권한 요청 중…',
    statusRunning: '측정 중', statusPaused: '일시정지', statusStopped: '정지', statusError: '확인 필요',
    calibrationUncal: '미교정 — 추정값のみ', calibrationCal: '교정됨',
    micPermission: '마이크', permUnknown: '미요청', permGranted: '허용', permDenied: '거부', permPrompt: '확인',
    micSelect: '마이크 입력', micDefault: '기본 마이크',
    btnStart: '시작', btnPause: '일시정지', btnResume: '계속', btnStop: '정지', btnReset: '초기화',
    btnRetry: '다시 시도', btnDismiss: '닫기',
    statCurrent: '현재', statMin: '최소', statLeq: '에너지 평균 (Leq)', statMax: '최대', statDuration: '시간',
    graphLabel: '레벨 기록', graphEmpty: '시작을 눌러 라이브 그래프를 기록하세요.',
    advanced: '고급 설정', weighting: '주파수 가중', weightA: 'A 가중',
    weightC: 'C 가중', weightZ: 'Z 가중(플랫)',
    response: '시간 가중', respFast: 'Fast (125ms)', respSlow: 'Slow (1s)',
    calTitle: '교정', calOffset: '오프셋 (dB)', calLabel: '기준 메모',
    calApply: '교정 적용', calReset: '미교정으로 초기화',
    sessionDetails: '세션 상세', deviceInfo: '기기 및 마이크',
    exportTitle: '세션 및 내보내기', exportCsv: 'CSV 내보내기', exportJson: 'JSON 내보내기',
    historyTitle: '로컬 기록', historyEmpty: '저장된 세션이 없습니다.', historyClear: '기록 지우기',
    stepsTitle: '3단계 측정', step1t: '마이크 허용', step1d: '시작을 누르고 권한을 허용하세요. 오디오는 기기에 남습니다.',
    step2t: '라이브 패널 보기', step2d: '현재·최소·평균·최대 값을 라이브 그래프와 함께 확인하세요.',
    step3t: '조정 및 내보내기', step3d: '가중과 시정수를 고르고 필요하면 교정한 뒤 내보내세요.',
    accTitle: '정확도 원리', accBody: '휴대폰·노트북 마이크는 교정된 측정기가 아닙니다. 이 도구는 정직한 브라우저 추정치를 제공하며 공인 측정값이 아닙니다.',
    troubleTitle: '마이크 문제 해결', troubleBody: '권한이 거부된 경우 주소창의 자물쇠 아이콘에서 마이크를 허용한 뒤 다시 시작을 누르세요.',
    sessionTitle: '세션 및 내보내기', sessionBody: '각 세션은 현재·최소·Leq·최대·시간을 누적합니다. CSV/JSON으로 내보내고 기록은 로컬에만 저장됩니다.',
    faqTitle: '자주 묻는 질문',
    faq: enFaq.map((f) => ({ q: f.q, a: f.a })),
    guidesTitle: '관련 가이드', footerNote: '정적 클라이언트 측 미터. 오디오가 브라우저를 떠나지 않습니다.',
    footerRights: 'All rights reserved.',
  }),
};

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.en;
}
