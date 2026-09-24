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

import { getUi, type UiStrings } from './ui';

export interface CoreDict {
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
  btnCancel: string;
  btnCustomize: string;
  btnStartMeasuring: string;
  btnStartNew: string;
  btnSave: string;
  statusCalRequired: string;
  inputStrength: string;
  calibrateCta: string;
  customizeTitle: string;
  customizeClose: string;
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

export type Dict = CoreDict & { ui: UiStrings };

function base(over: CoreDict): CoreDict {
  return over;
}

export const dicts: Record<Locale, CoreDict> = {
  en: base({
    metaTitle: 'Free Online Decibel Meter – Measure Sound in Browser',
    metaDescription: 'Use this free online decibel meter for an immediate estimated sound level in dBA, dBC or dBZ. Calibrate for better device-specific accuracy.',
    navGuides: 'Guides', navMeasure: 'Measure', headerTag: 'Browser SPL estimate',
    heroEyebrow: 'PRIVATE • REAL-TIME • NO DOWNLOAD', heroH1: 'Online Decibel Meter – Measure Sound Level in Your Browser',
    heroSub: 'Measure an estimated sound level in dBA immediately, then calibrate your device for better device-specific accuracy.',
    startMeasuring: 'Start Measuring', howAccuracy: 'How Accuracy Works',
    liveRegion: 'Live measurement status',
    statusIdle: 'Idle', statusRequesting: 'Requesting permission…',
    statusRunning: 'Measuring', statusPaused: 'Paused', statusStopped: 'Stopped', statusError: 'Attention needed',
    calibrationUncal: 'Uncalibrated — estimated sound level', calibrationCal: 'Calibrated',
    micPermission: 'Microphone', permUnknown: 'Not requested', permGranted: 'Granted', permDenied: 'Denied', permPrompt: 'Prompt',
    micSelect: 'Microphone input', micDefault: 'Default microphone',
    btnStart: 'Start', btnPause: 'Pause', btnResume: 'Resume', btnStop: 'Stop', btnReset: 'Reset',
    btnRetry: 'Try again', btnDismiss: 'Dismiss', btnCancel: 'Cancel',
    btnCustomize: 'Customize', btnStartMeasuring: 'Start Measuring', btnStartNew: 'Start New Measurement', btnSave: 'Save Session',
    statusCalRequired: 'Estimated dBA — calibrate for better accuracy', inputStrength: 'Estimated Sound Level',
    calibrateCta: 'Calibrate for sound level',
    customizeTitle: 'Customize measurement', customizeClose: 'Close',
    statDuration: 'Duration',
    graphLabel: 'Level history', graphEmpty: 'Press Start to record the live graph. Past levels appear here.',
    advanced: 'Advanced controls', weighting: 'Frequency weighting', weightA: 'A-weighting (speech-like)',
    weightC: 'C-weighting (flatter)', weightZ: 'Z-weighting (flat)',
    response: 'Time response', respFast: 'Fast (125 ms)', respSlow: 'Slow (1 s)',
    calTitle: 'Calibration', calOffset: 'Reference meter reading (dBA)', calLabel: 'Calibration profile name (e.g. “office meter”)',
    calApply: 'Apply calibration', calReset: 'Reset to uncalibrated',
    sessionDetails: 'Session details', deviceInfo: 'Device & microphone',
    exportTitle: 'Session & export', exportCsv: 'Export CSV', exportJson: 'Export JSON',
    historyTitle: 'Local history', historyEmpty: 'No saved sessions yet on this device.', historyClear: 'Clear history',
    stepsTitle: 'Measure in three steps', step1t: 'Allow the microphone', step1d: 'Press Start and grant permission when the browser asks. Audio stays on your device.',
    step2t: 'Watch the live panel', step2d: 'Read current, minimum, energy-average and maximum estimated decibels with the matching live graph.',
    step3t: 'Tune and export', step3d: 'Pick weighting and response, optionally calibrate, then export CSV or JSON.',
    accTitle: 'How accuracy works', accBody: 'Phone and laptop microphones are not calibrated instruments: gain, placement and frequency response differ per device. This tool reports an honest browser estimate, never a certified reading. Compare against a known reference to add an offset, and use a calibrated meter for safety, workplace or legal decisions.',
    troubleTitle: 'Microphone permission troubleshooting', troubleBody: 'If permission was denied, open the lock/tune icon in the address bar and allow the microphone, then press Start again. If no device appears, connect one and reload. If another app holds the mic (calls, recorders), close it first.',
    sessionTitle: 'Sessions & export', sessionBody: 'Each run keeps duration and mode-aware statistics. The screen shows a nominal estimate before calibration; device-specific environmental estimates are exported when a compatible calibration is active.',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'Is this a calibrated sound level meter?', a: 'No. Without calibration this page shows a weighted digital dBFS reading plus a nominal +100 dB offset, clearly labeled as an estimate for screening, and you can inspect the raw dBFS underneath in Digital Diagnostics. You should rely on calibrated Class 1 or Class 2 hardware for safety, workplace or legal decisions.' },
      { q: 'Does iPhone have a decibel meter?', a: 'iPhone ships with no built-in decibel readout, yet Safari on your iPhone turns this page into a live estimator. You open the site over HTTPS, press Start, grant microphone permission once for this origin, and watch estimated dBA without installing anything. Our iPhone decibel meter guide walks you through positioning and calibration on that exact device.' },
      { q: 'Is there a decibel meter app?', a: 'You do not need to install one for a quick check because this browser page behaves like a free meter on iPhone and Android. You get live dBA, dBC or dBZ alongside current, minimum, Leq, maximum and duration, plus a graph of the last 240 points. Native apps only pull ahead for offline use or background logging while you do other tasks.' },
      { q: 'Is there a free decibel meter app?', a: 'Yes, this site itself is the free option and it runs entirely in current Chrome, Edge, Firefox or Safari. You create no account, download nothing, and your audio stays on your device during every run. Just press Start Measuring on the homepage to get an immediate live estimate.' },
      { q: 'What is a decibel meter?', a: 'A decibel meter, also called a sound level meter or noise meter, reports sound intensity in decibels from a microphone signal. This online version captures mono audio through getUserMedia and the Web Audio API after you grant permission. You then see that signal shaped by A, C or Z weighting and smoothed by the selected time response.' },
      { q: 'What is a decibel meter called?', a: 'Sound level meter, noise meter, SPL meter and sound meter all describe the same job of reporting sound in decibels. You will see formal teams use calibrated Class 1 or Class 2 hardware for compliance work, while a browser page gives device-dependent estimates. Here your mono microphone input is processed locally with echo cancellation, noise suppression and automatic gain requested off, though the browser may refuse, and the input is never connected to speakers so you hear no feedback loop.' },
      { q: 'Are decibel meter apps accurate?', a: 'They give useful screening estimates rather than interchangeable readings, since two phones on the same sound often differ by 5–10 dB before calibration. Phone capsules typically read too high below around 30 dBA, clip near 95–100 dBA, and under-report deep bass. You narrow that gap by calibrating your own phone against a known reference at the same spot.' },
      { q: 'How accurate is a phone decibel meter?', a: 'Think in whole decibels and ignore the decimals, because uncalibrated phone gain alone can shift results by several dB. You get steadier numbers by watching the 30–60 second average or Leq instead of reacting to each jump. Calibrate once per phone, keep the same case and microphone, and never stretch the result into workplace, legal or medical proof. For context, sustained exposure near 85 dBA across 8 hours carries risk that halves in allowed time with every 3 dB increase, while levels under 70 dBA are generally not a concern, so treat phone numbers as screening hints.' },
      { q: 'How to use a decibel meter?', a: 'Grant the microphone, hold your device at ear height with the mic opening uncovered, stay quiet, and let the reading settle for a few seconds. You should read the average or Leq across 30–60 seconds rather than chasing peaks. Keep distance, weighting choice and Fast or Slow identical whenever you compare two places.' },
      { q: 'How does a decibel meter work?', a: 'The meter converts microphone sound into an RMS level, derives A, C or Z from the dominant frequency band, then smooths the result with Fast at 125 ms or Slow at 1 s. Leq accumulates the energy average across your run while the spectrum view stays display-only. Your browser performs every step locally through the Web Audio API without uploading audio.' },
      { q: 'How to calibrate a decibel meter?', a: 'Set your device beside a stable known reference at the same spot, wait for a steady sound, note the difference, and save it as your offset. That correction belongs to one microphone and setup only, so you redo it whenever your case, phone, browser or position changes. Never copy the number across devices because gain and frequency response do not transfer.' },
      { q: 'How much does a decibel meter cost?', a: 'This browser meter costs you nothing and asks for no purchase, account or install. Standalone hardware spans budget checkers up through Class 2 instruments costing hundreds and Class 1 instruments costing thousands. You need that calibrated hardware, not a phone estimate, for formal compliance or contract evidence.' },
      { q: 'What to look for in a decibel meter?', a: 'Look for calibration profiles, A plus C plus Z weighting, Fast plus Slow response, Leq averaging, and honest export behavior. Here you can tune all of those modes, store up to 20 sessions plus your theme in localStorage, and export CSV or JSON. Calibrated sessions carry dB values while uncalibrated exports deliberately omit dB values to prevent misuse.' },
      { q: 'Does a decibel meter measure bass?', a: 'Phone hardware captures only part of the low end because small capsules favor speech frequencies and weak bass response is normal. You will see deeper sounds read lower than they feel, especially on A-weighting which discounts lows. Switch to C or Z for bass-heavy music or engines, and bring calibrated low-frequency hardware for serious engineering work.' },
      { q: 'Is my audio uploaded or recorded?', a: 'Your audio is neither uploaded nor stored because all analysis happens inside your browser session. The input path is never routed to speakers, and analytics here count page usage only without ever receiving sound. You can keep working after load with the network muted and watch the live graph continue, which proves the loop stays local.' },
      { q: 'Why does the meter show --?', a: 'The idle panel shows -- until you grant microphone access and press Start, which keeps the page honest before data exists. Nothing is simulated or pre-filled while you wait. If you still see the dashes after pressing Start, your browser is still waiting on permission over HTTPS.' },
      { q: 'What do dB, dBA, Fast and Slow mean?', a: 'dB names the logarithmic sound level unit, while dBA shapes the reading toward human hearing, dBC stays flatter, and dBZ leaves it flat from the dominant band. Fast follows peaks with a 125 ms window and Slow calms them with a 1 s window. You pick A for everyday loudness impressions and C or Z when you want more low-frequency content included.' },
      { q: 'Can I save a session?', a: 'You can export the current run as CSV or JSON and keep a rolling local history of 20 sessions in this browser without sending anything to a server. dB values appear in those files only while a compatible calibration is active, so uncalibrated exports carry timing and settings without dB numbers. Your saved theme rides along in the same local storage on your own machine.' },
    ],
    guidesTitle: 'Related guides', footerNote: 'Static client-side meter. Audio never leaves your browser.',
    footerRights: 'All rights reserved.',
  }),
  de: base({
    metaTitle: 'Dezibelmesser Online – Lautstärke im Browser messen',
    metaDescription: 'Kostenloser Dezibelmesser ohne App: sofort geschätzte Schallpegel in dBA, dBC oder dBZ anzeigen und für bessere Genauigkeit kalibrieren.',
    navGuides: 'Anleitungen', navMeasure: 'Messen', headerTag: 'Browser-Schätzwert',
    heroEyebrow: 'Kostenloser Dezibelmesser — ohne App, kein Download', heroH1: 'Dezibelmesser online – Lautstärke im Browser messen',
    heroSub: 'Messen Sie sofort einen geschätzten Schallpegel in dBA und kalibrieren Sie das Gerät für eine bessere gerätespezifische Genauigkeit.',
    startMeasuring: 'Messung starten', howAccuracy: 'So funktioniert Genauigkeit',
    liveRegion: 'Live-Messstatus',
    statusIdle: 'Bereit', statusRequesting: 'Berechtigung wird angefragt…',
    statusRunning: 'Misst', statusPaused: 'Pausiert', statusStopped: 'Gestoppt', statusError: 'Achtung erforderlich',
    calibrationUncal: 'Unkalibriert — geschätzter Schallpegel', calibrationCal: 'Kalibriert',
    micPermission: 'Mikrofon', permUnknown: 'Nicht angefragt', permGranted: 'Erteilt', permDenied: 'Verweigert', permPrompt: 'Abfrage',
    micSelect: 'Mikrofoneingang', micDefault: 'Standardmikrofon',
    btnStart: 'Start', btnPause: 'Pause', btnResume: 'Fortsetzen', btnStop: 'Stopp', btnReset: 'Zurücksetzen',
    btnRetry: 'Erneut versuchen', btnDismiss: 'Schließen', btnCancel: 'Abbrechen',
    btnCustomize: 'Anpassen', btnStartMeasuring: 'Messung starten', btnStartNew: 'Neue Messung starten', btnSave: 'Speichern',
    statusCalRequired: 'Geschätzte dBA — für bessere Genauigkeit kalibrieren', inputStrength: 'Geschätzter Schallpegel',
    calibrateCta: 'Für Schallpegel kalibrieren',
    customizeTitle: 'Messung anpassen', customizeClose: 'Schließen',
    statDuration: 'Dauer',
    graphLabel: 'Pegelverlauf', graphEmpty: 'Drücken Sie Start, um den Live-Graphen aufzuzeichnen.',
    advanced: 'Erweiterte Steuerung', weighting: 'Frequenzbewertung', weightA: 'A-Bewertung (gehörähnlich)',
    weightC: 'C-Bewertung (flacher)', weightZ: 'Z-Bewertung (linear)',
    response: 'Zeitbewertung', respFast: 'Schnell (125 ms)', respSlow: 'Langsam (1 s)',
    calTitle: 'Kalibrierung', calOffset: 'Referenzwert des Messgeräts (dBA)', calLabel: 'Name des Kalibrierprofils (z. B. „Büro-Messgerät“)',
    calApply: 'Kalibrierung anwenden', calReset: 'Auf unkalibriert zurücksetzen',
    sessionDetails: 'Sitzungsdetails', deviceInfo: 'Gerät & Mikrofon',
    exportTitle: 'Sitzung & Export', exportCsv: 'CSV exportieren', exportJson: 'JSON exportieren',
    historyTitle: 'Lokaler Verlauf', historyEmpty: 'Noch keine gespeicherten Sitzungen.', historyClear: 'Verlauf löschen',
    stepsTitle: 'In drei Schritten messen', step1t: 'Mikrofon erlauben', step1d: 'Drücken Sie Start und erteilen Sie die Berechtigung, wenn der Browser fragt. Audio bleibt auf Ihrem Gerät.',
    step2t: 'Live-Anzeige beobachten', step2d: 'Lesen Sie aktuellen, minimalen, gemittelten und maximalen geschätzten Dezibelwert mit Live-Graph ab.',
    step3t: 'Anpassen und exportieren', step3d: 'Bewertung und Zeitkonstante wählen, optional mit Referenz kalibrieren, dann als CSV oder JSON exportieren.',
    accTitle: 'So funktioniert Genauigkeit', accBody: 'Handy- und Laptop-Mikrofone sind keine kalibrierten Schallpegelmesser: Verstärkung, Position und Frequenzgang unterscheiden sich je Gerät. Dieses Tool liefert ehrliche Browser-Schätzwerte, keine zertifizierten Messungen. Vergleichen Sie mit einer bekannten Referenz und nutzen Sie für Arbeitsschutz oder rechtliche Fragen ein kalibriertes Messgerät.',
    troubleTitle: 'Mikrofon-Fehlerbehebung', troubleBody: 'Bei verweigerter Berechtigung öffnen Sie das Schloss-Symbol in der Adressleiste, erlauben das Mikrofon und drücken erneut Start. Erscheint kein Gerät, schließen Sie eines an und laden Sie neu. Hält eine andere App das Mikrofon belegt, schließen Sie diese zuerst.',
    sessionTitle: 'Sitzungen & Export', sessionBody: 'Jeder Lauf speichert Dauer und Statistik. Vor der Kalibrierung zeigt die Anzeige einen nominalen Schätzwert; gerätespezifische Schallpegel werden mit kompatibler Kalibrierung exportiert.',
    faqTitle: 'Häufige Fragen',
    faq: [
      { q: 'Ist das ein kalibrierter Schallpegelmesser?', a: 'Nein. Browser-Mikrofone unterscheiden sich je nach Gerät, daher sind alle Werte Schätzungen. Für Sicherheit oder rechtliche Fragen nutzen Sie ein kalibriertes Messgerät der Klasse 1 oder 2.' },
      { q: 'Kann man Dezibel mit dem Handy messen?', a: 'Ja, für Alltagsfragen. Öffnen Sie diesen kostenlosen Dezibelmesser im Browser, tippen Sie auf Start, erlauben Sie das Mikrofon – schon sehen Sie live geschätzte dBA. Eine App ist nicht nötig, die Messung läuft online ohne Download.' },
      { q: 'Wie kann man Dezibel messen?', a: 'Mikrofon erlauben, Handy in Ohrhöhe halten, Mikrofonöffnung frei lassen, ruhig bleiben und 30–60 Sekunden den Mittelwert oder Leq ablesen. Abstand, Bewertung (A/C/Z) und Fast/Slow für Vergleiche gleich lassen.' },
      { q: 'Wie kann ich Dezibel zuhause messen?', a: 'Legen oder halten Sie das Handy dort, wo Sie sitzen, Mikrofon zur Geräuschquelle, 1–2 Minuten messen und den Leq notieren. Lüftung und eigene Geräusche vermeiden. Für Lärmprotokolle helfen Datum, Uhrzeit und Abstand.' },
      { q: 'Geht Dezibel messen mit dem iPhone?', a: 'Ja. Das iPhone hat keine eingebaute dB-Anzeige, aber Safari eignet sich: Diese Seite im iPhone-Browser öffnen, Start drücken, Mikrofon erlauben – fertig. Einmal pro iPhone gegen eine Referenz kalibrieren.' },
      { q: 'Geht Dezibel messen online ohne App, kostenlos?', a: 'Ja. Dieses Tool ist ein kostenloser Online-Dezibelmesser ohne App: dBA, dBC oder dBZ live, Verlauf als Graph, Export als CSV oder JSON. Audio bleibt auf Ihrem Gerät.' },
      { q: 'Was ist ein Dezibelmesser?', a: 'Ein Dezibelmesser, auch Schallmesser, Schallpegelmesser oder Lärmmesser genannt, misst die Lautstärke in Dezibel (dB). Diese Seite ist die Online-Version davon – mit Browser-Mikrofon und ehrlich gekennzeichnetem Schätzwert.' },
      { q: 'Brauche ich eine Dezibelmesser-App?', a: 'Für schnelle Checks nicht. Die Browser-Seite ersetzt eine kostenlose Dezibelmesser-App: kein Installieren, keine Konten, immer aktuell. Native Apps lohnen sich nur für Offline- oder Dauerlogging.' },
      { q: 'Wie genau ist ein Online-Dezibelmesser?', a: 'Als grobe Schätzung auf wenige dB. Zwei Handys weichen am gleichen Geräusch oft 5–10 dB ab, unter ca. 30 dBA rauscht das Mikrofon, über ca. 95–100 dBA clippt es. Einmal kalibrieren verbessert den Gesamtpegel deutlich.' },
      { q: 'Wird mein Audio hochgeladen oder aufgenommen?', a: 'Nein. Die gesamte Verarbeitung läuft lokal in Ihrem Browser über die Web Audio API. Über diese Seite verlässt kein Audio Ihr Gerät.' },
      { q: 'Warum zeigt das Messgerät --?', a: 'Die Anzeige zeigt --, bis Sie die Mikrofonberechtigung erteilen und Start drücken. Es werden niemals simulierte Werte angezeigt.' },
      { q: 'Was bedeuten dB, dBA, Fast und Slow?', a: 'dB ist die Einheit des Schallpegels. Die A-Bewertung (dBA) folgt ungefähr dem menschlichen Hören; C ist flacher, Z ist linear. Fast (125 ms) folgt Spitzen, Slow (1 s) glättet sie.' },
      { q: 'Kann ich eine Sitzung speichern?', a: 'Ja. Exportieren Sie die aktuelle Sitzung als CSV oder JSON oder behalten Sie einen lokalen Verlauf in diesem Browser. Nichts wird an einen Server gesendet.' },
    ],
    guidesTitle: 'Verwandte Anleitungen', footerNote: 'Statisches clientseitiges Messgerät. Audio verlässt nie Ihren Browser.',
    footerRights: 'Alle Rechte vorbehalten.',
  }),
  it: base({
    metaTitle: 'Fonometro Online Gratis – Misura i Decibel nel Browser',
    metaDescription: 'Fonometro online gratis: visualizza subito una stima in dBA, dBC o dBZ e calibra il dispositivo per una precisione migliore.',
    navGuides: 'Guide', navMeasure: 'Misura', headerTag: 'Stima browser',
    heroEyebrow: 'Fonometro online gratis — senza download', heroH1: 'Fonometro online – Misura i decibel nel browser',
    heroSub: 'Misura subito un livello sonoro stimato in dBA, poi calibra il dispositivo per una migliore precisione specifica.',
    startMeasuring: 'Inizia a misurare', howAccuracy: 'Come funziona la precisione',
    liveRegion: 'Stato misurazione live',
    statusIdle: 'In attesa', statusRequesting: 'Richiesta permesso…',
    statusRunning: 'Misurazione', statusPaused: 'In pausa', statusStopped: 'Fermato', statusError: 'Attenzione richiesta',
    calibrationUncal: 'Non calibrato — letture solo stimate', calibrationCal: 'Calibrato',
    micPermission: 'Microfono', permUnknown: 'Non richiesto', permGranted: 'Concesso', permDenied: 'Negato', permPrompt: 'Richiesta',
    micSelect: 'Ingresso microfono', micDefault: 'Microfono predefinito',
    btnStart: 'Avvia', btnPause: 'Pausa', btnResume: 'Riprendi', btnStop: 'Ferma', btnReset: 'Azzera',
    btnRetry: 'Riprova', btnDismiss: 'Chiudi', btnCancel: 'Annulla',
    btnCustomize: 'Personalizza', btnStartMeasuring: 'Inizia a misurare', btnStartNew: 'Avvia nuova misurazione', btnSave: 'Salva',
    statusCalRequired: 'dBA stimati — calibra per maggiore precisione', inputStrength: 'Livello sonoro stimato',
    calibrateCta: 'Calibra per il livello sonoro',
    customizeTitle: 'Personalizza misurazione', customizeClose: 'Chiudi',
    statDuration: 'Durata',
    graphLabel: 'Cronologia livelli', graphEmpty: 'Premi Avvia per registrare il grafico live.',
    advanced: 'Controlli avanzati', weighting: 'Ponderazione', weightA: 'Ponderazione A (simile all’udito)',
    weightC: 'Ponderazione C (più piatta)', weightZ: 'Ponderazione Z (piatta)',
    response: 'Risposta temporale', respFast: 'Veloce (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibrazione', calOffset: 'Lettura del fonometro di riferimento (dBA)', calLabel: 'Nome del profilo di calibrazione (es. “fonometro ufficio”)',
    calApply: 'Applica calibrazione', calReset: 'Ripristina non calibrato',
    sessionDetails: 'Dettagli sessione', deviceInfo: 'Dispositivo e microfono',
    exportTitle: 'Sessione ed export', exportCsv: 'Esporta CSV', exportJson: 'Esporta JSON',
    historyTitle: 'Cronologia locale', historyEmpty: 'Nessuna sessione salvata.', historyClear: 'Cancella cronologia',
    stepsTitle: 'Misura in tre passi', step1t: 'Consenti il microfono', step1d: 'Premi Avvia e concedi il permesso quando il browser lo chiede. L’audio resta sul tuo dispositivo.',
    step2t: 'Osserva il pannello live', step2d: 'Leggi i decibel stimati attuali, minimi, medi e massimi con il grafico live.',
    step3t: 'Regola ed esporta', step3d: 'Scegli ponderazione e risposta, calibra con un riferimento se serve, poi esporta CSV o JSON.',
    accTitle: 'Come funziona la precisione', accBody: 'I microfoni di telefoni e laptop non sono fonometri calibrati: guadagno, posizione e risposta in frequenza cambiano con ogni dispositivo. Questo strumento fornisce stime oneste del browser, mai letture certificate. Confronta con un riferimento noto e usa uno strumento calibrato per sicurezza o questioni legali.',
    troubleTitle: 'Risoluzione problemi microfono', troubleBody: 'Se il permesso è negato, apri l’icona del lucchetto nella barra degli indirizzi, consenti il microfono e premi di nuovo Avvia. Se non appare alcun dispositivo, collegane uno e ricarica. Se un’altra app occupa il microfono, chiudila prima.',
    sessionTitle: 'Sessioni ed export', sessionBody: 'Ogni sessione salva durata e statistiche. Prima della calibrazione lo schermo mostra una stima nominale; le stime specifiche del dispositivo vengono esportate con una calibrazione compatibile.',
    faqTitle: 'Domande frequenti',
    faq: [
      { q: 'È un fonometro calibrato?', a: 'No. I microfoni del browser variano con il dispositivo, quindi le letture sono stime. Per sicurezza o questioni legali usa un fonometro calibrato di Classe 1 o 2.' },
      { q: 'Il mio audio viene caricato o registrato?', a: 'No. Tutta l’elaborazione avviene localmente nel tuo browser tramite Web Audio API. Nessun audio lascia il tuo dispositivo.' },
      { q: 'Perché lo strumento mostra --?', a: 'Mostra -- finché non concedi il permesso microfono e premi Avvia. Non vengono mai mostrati valori simulati.' },
      { q: 'Cosa significano dB, dBA, Fast e Slow?', a: 'dB è l’unità del livello sonoro. La ponderazione A (dBA) segue circa l’udito umano; C è più piatta, Z è piatta. Fast (125 ms) segue i picchi, Slow (1 s) li smussa.' },
      { q: 'Posso salvare una sessione?', a: 'Sì. Esporta la sessione come CSV o JSON oppure conserva la cronologia locale in questo browser. Nulla viene inviato a un server.' },
    ],
    guidesTitle: 'Guide correlate', footerNote: 'Misuratore statico lato client. L’audio non lascia mai il browser.',
    footerRights: 'Tutti i diritti riservati.',
  }),
  ja: base({
    metaTitle: 'デシベル測定オンライン – ブラウザで音量を計測',
    metaDescription: '無料のブラウザ・デシベル測定ツール。dBA・dBC・dBZの推定値をすぐ表示し、校正で端末ごとの精度を高めます。',
    navGuides: 'ガイド', navMeasure: '測定', headerTag: 'ブラウザ推定',
    heroEyebrow: '無料オンラインデシベル計 — ダウンロード不要', heroH1: 'オンライン騒音計 – ブラウザでデシベルを測定',
    heroSub: '推定dBAをすぐ測定し、端末を校正して機種ごとの精度を高めます。処理はすべてブラウザ内で完結します。',
    startMeasuring: '測定を開始', howAccuracy: '精度の仕組み',
    liveRegion: 'ライブ測定ステータス',
    statusIdle: '待機中', statusRequesting: '許可を要求中…',
    statusRunning: '測定中', statusPaused: '一時停止中', statusStopped: '停止', statusError: '確認が必要です',
    calibrationUncal: '未校正 — 読み値は推定のみ', calibrationCal: '校正済み',
    micPermission: 'マイク', permUnknown: '未要求', permGranted: '許可', permDenied: '拒否', permPrompt: '確認',
    micSelect: 'マイク入力', micDefault: '既定のマイク',
    btnStart: '開始', btnPause: '一時停止', btnResume: '再開', btnStop: '停止', btnReset: 'リセット',
    btnRetry: '再試行', btnDismiss: '閉じる', btnCancel: 'キャンセル',
    btnCustomize: 'カスタマイズ', btnStartMeasuring: '測定を開始', btnStartNew: '新規測定を開始', btnSave: '保存',
    statusCalRequired: '推定dBA — 校正で精度が向上します', inputStrength: '推定音圧レベル',
    calibrateCta: '騒音レベル用に校正',
    customizeTitle: '測定をカスタマイズ', customizeClose: '閉じる',
    statDuration: '時間',
    graphLabel: 'レベル履歴', graphEmpty: '開始を押すとライブグラフが記録されます。',
    advanced: '詳細設定', weighting: '周波数重み付け', weightA: 'A特性（聴感補正）',
    weightC: 'C特性', weightZ: 'Z特性（フラット）',
    response: '時定数', respFast: 'Fast（125ms）', respSlow: 'Slow（1s）',
    calTitle: '校正', calOffset: '基準騒音計の表示値（dBA）', calLabel: '校正プロファイル名（例: オフィス騒音計）',
    calApply: '校正を適用', calReset: '未校正に戻す',
    sessionDetails: 'セッション詳細', deviceInfo: 'デバイスとマイク',
    exportTitle: 'セッションと出力', exportCsv: 'CSVを出力', exportJson: 'JSONを出力',
    historyTitle: 'ローカル履歴', historyEmpty: '保存されたセッションはまだありません。', historyClear: '履歴を消去',
    stepsTitle: '3ステップで測定', step1t: 'マイクを許可', step1d: '開始を押してブラウザの許可ダイアログで承認します。音声はデバイス内に留まります。',
    step2t: 'ライブパネルを見る', step2d: '現在・最小・平均・最大の推定デシベル値をライブグラフで確認します。',
    step3t: '調整と出力', step3d: '重み付けと時定数を選び、必要なら基準器で校正してCSV・JSONで出力します。',
    accTitle: '精度の仕組み', accBody: 'スマートフォンやノートPCのマイクは校正された騒音計ではありません。感度・位置・周波数特性は機器ごとに異なります。本ツールは正直なブラウザ推定値を示し、認定測定値ではありません。安全・法令判断には校正された測定器を使ってください。',
    troubleTitle: 'マイクのトラブル解決', troubleBody: '許可が拒否された場合はアドレスバーの錠前アイコンからマイクを許可し、再度開始を押してください。デバイスが表示されない場合は接続して再読み込みし、他の通話アプリがマイクを使用中なら終了してください。',
    sessionTitle: 'セッションと出力', sessionBody: '各セッションは時間と統計を保持します。未校正では公称推定値を表示し、互換性のある校正時は端末固有の環境騒音推定値を出力します。',
    faqTitle: 'よくある質問',
    faq: [
      { q: '校正された騒音計ですか？', a: 'いいえ。ブラウザのマイクは機器ごとに感度が異なり、表示は推定値です。安全・法令判断にはクラス1・クラス2の校正済み騒音計を使ってください。' },
      { q: '騒音計アプリで何ができますか？', a: 'このページが無料の騒音計アプリとして使えます。ブラウザで開始を押し、マイクを許可すると推定dBA・dBC・dBZ、最小・平均・最大・Leqをライブ表示し、CSV・JSONで保存できます。' },
      { q: '無料の騒音計アプリはありますか？', a: 'はい、このサイトが無料の騒音計アプリです。ダウンロードや登録は不要で、音声は端末外に送信されません。トップページの測定開始からすぐ使えます。' },
      { q: 'iPhoneの無料騒音計アプリは？', a: 'iPhoneに内蔵のdB表示はありませんが、Safariでこのページを開けば無料騒音計になります。開始→マイク許可で推定値を表示。iPhoneごとに一度基準器と比べると精度が上がります。' },
      { q: 'Androidの無料騒音計アプリは？', a: 'Chromeでこのページを開けばAndroidでも無料測定できます。エコー除去などの自動処理オフを要求し、端末パネルに状態を表示します。同じ位置・設定での比較がコツです。' },
      { q: '騒音計アプリの精度は？', a: '数dB程度の目安として使ってください。同じ音でも機種で5～10dBずれることがあり、約30dBA以下では高め、約95～100dBA以上では低めに出ます。小数点は無視し30～60秒の平均で見てください。' },
      { q: 'デシベル計測とは？', a: '音の大きさをデシベル（dB）で数値化することです。デシベル計測・騒音測定・音量測定は同じ意味で使われます。このサイトはブラウザでできるオンライン・デシベル計測ツールです。' },
      { q: 'デシベル計測アプリや計測器は必要？', a: '簡易チェックならブラウザで十分です。低音や大きなピークの比較にはC・Z特性を選び、正式な評価には校正された騒音計・デシベル計測器を使ってください。' },
      { q: 'スマホでデシベル計測できますか？', a: 'はい。スマホのブラウザでこのページを開き、マイクを許可して開始するだけです。マイク穴を塞がず、耳の高さで30～60秒測るのがコツです。無料で何度でも使えます。' },
      { q: '音声はアップロードや録音されますか？', a: 'いいえ。処理はWeb Audio APIによりブラウザ内で完結し、このサイトから音声が外部送信されることはありません。' },
      { q: 'なぜ -- と表示されますか？', a: 'マイク許可を与えて開始を押すまで -- と表示されます。シミュレーション値は一切表示しません。' },
      { q: 'dB・dBA・Fast・Slowとは？', a: 'dBは音量の単位です。A特性（dBA）は人間の聴感に近く、Cはより平坦、Zは無補正です。Fast（125ms）はピークに追従し、Slow（1s）は平滑化します。' },
      { q: 'セッションを保存できますか？', a: 'はい。現在のセッションをCSV・JSONで出力したり、このブラウザにローカル履歴を残せます。サーバー送信は行いません。' },
    ],
    guidesTitle: '関連ガイド', footerNote: '静的クライアントサイドメーター。音声がブラウザ外に出ることはありません。',
    footerRights: '無断転載を禁じます。',
  }),
  es: base({
    metaTitle: 'Medidor de Decibelios Online – Medir Ruido en el Navegador',
    metaDescription: 'Sonómetro online gratis: muestra de inmediato una estimación en dBA, dBC o dBZ y calibra el dispositivo para mejorar la precisión.',
    navGuides: 'Guías', navMeasure: 'Medir', headerTag: 'Estimación del navegador',
    heroEyebrow: 'Sonómetro online gratis — sin descargas', heroH1: 'Sonómetro online – Mide decibelios en tu navegador',
    heroSub: 'Mide de inmediato un nivel sonoro estimado en dBA y calibra el dispositivo para mejorar la precisión específica.',
    startMeasuring: 'Empezar a medir', howAccuracy: 'Cómo funciona la precisión',
    liveRegion: 'Estado de medición en vivo',
    statusIdle: 'Inactivo', statusRequesting: 'Solicitando permiso…',
    statusRunning: 'Midiendo', statusPaused: 'En pausa', statusStopped: 'Detenido', statusError: 'Atención necesaria',
    calibrationUncal: 'Sin calibrar — solo estimaciones', calibrationCal: 'Calibrado',
    micPermission: 'Micrófono', permUnknown: 'No solicitado', permGranted: 'Concedido', permDenied: 'Denegado', permPrompt: 'Preguntar',
    micSelect: 'Entrada de micrófono', micDefault: 'Micrófono predeterminado',
    btnStart: 'Iniciar', btnPause: 'Pausar', btnResume: 'Reanudar', btnStop: 'Detener', btnReset: 'Restablecer',
    btnRetry: 'Reintentar', btnDismiss: 'Cerrar', btnCancel: 'Cancelar',
    btnCustomize: 'Personalizar', btnStartMeasuring: 'Empezar a medir', btnStartNew: 'Iniciar nueva medición', btnSave: 'Guardar',
    statusCalRequired: 'dBA estimados — calibra para mayor precisión', inputStrength: 'Nivel sonoro estimado',
    calibrateCta: 'Calibrar para nivel sonoro',
    customizeTitle: 'Personalizar medición', customizeClose: 'Cerrar',
    statDuration: 'Duración',
    graphLabel: 'Historial de nivel', graphEmpty: 'Pulsa Iniciar para registrar el gráfico en vivo.',
    advanced: 'Controles avanzados', weighting: 'Ponderación', weightA: 'Ponderación A (como el oído)',
    weightC: 'Ponderación C (más plana)', weightZ: 'Ponderación Z (plana)',
    response: 'Respuesta temporal', respFast: 'Rápida (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibración', calOffset: 'Lectura del sonómetro de referencia (dBA)', calLabel: 'Nombre del perfil de calibración (ej. «sonómetro oficina»)',
    calApply: 'Aplicar calibración', calReset: 'Volver a sin calibrar',
    sessionDetails: 'Detalles de sesión', deviceInfo: 'Dispositivo y micrófono',
    exportTitle: 'Sesión y exportación', exportCsv: 'Exportar CSV', exportJson: 'Exportar JSON',
    historyTitle: 'Historial local', historyEmpty: 'Aún no hay sesiones guardadas.', historyClear: 'Borrar historial',
    stepsTitle: 'Mide en tres pasos', step1t: 'Permite el micrófono', step1d: 'Pulsa Iniciar y concede el permiso cuando el navegador lo pida. El audio queda en tu dispositivo.',
    step2t: 'Observa el panel en vivo', step2d: 'Lee los decibelios estimados actuales, mínimos, medios y máximos con el gráfico en vivo.',
    step3t: 'Ajusta y exporta', step3d: 'Elige ponderación y respuesta, calibra con una referencia si lo necesitas y exporta CSV o JSON.',
    accTitle: 'Cómo funciona la precisión', accBody: 'Los micrófonos de teléfonos y portátiles no son sonómetros calibrados: la ganancia, la posición y la respuesta varían con cada dispositivo. Esta herramienta ofrece estimaciones honestas del navegador, nunca lecturas certificadas. Compara con una referencia conocida y usa un equipo calibrado para seguridad o cuestiones legales.',
    troubleTitle: 'Solución de problemas del micrófono', troubleBody: 'Si el permiso fue denegado, abre el icono del candado en la barra de direcciones, permite el micrófono y pulsa Iniciar de nuevo. Si no aparece ningún dispositivo, conecta uno y recarga. Si otra app ocupa el micrófono, ciérrala antes.',
    sessionTitle: 'Sesiones y exportación', sessionBody: 'Cada sesión guarda duración y estadísticas. Sin calibrar se muestra una estimación nominal; las estimaciones específicas del dispositivo se exportan con una calibración compatible.',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      { q: '¿Es un sonómetro calibrado?', a: 'No. Los micrófonos del navegador varían según el dispositivo, así que las lecturas son estimaciones. Para seguridad o decisiones legales, usa un sonómetro calibrado de Clase 1 o 2.' },
      { q: '¿Mi audio se sube o se graba?', a: 'No. Todo el procesamiento ocurre localmente en tu navegador con Web Audio API. Ningún audio sale de tu dispositivo.' },
      { q: '¿Por qué muestra --?', a: 'Muestra -- hasta que concedes el permiso de micrófono y pulsas Iniciar. Nunca se muestran valores simulados.' },
      { q: '¿Qué significan dB, dBA, Fast y Slow?', a: 'dB es la unidad del nivel sonoro. La ponderación A (dBA) se acerca al oído humano; C es más plana y Z es plana. Fast (125 ms) sigue los picos, Slow (1 s) los suaviza.' },
      { q: '¿Puedo guardar una sesión?', a: 'Sí. Exporta la sesión actual como CSV o JSON o conserva el historial local en este navegador. Nada se envía a un servidor.' },
    ],
    guidesTitle: 'Guías relacionadas', footerNote: 'Medidor estático local. El audio nunca sale de tu navegador.',
    footerRights: 'Todos los derechos reservados.',
  }),
  fr: base({
    metaTitle: 'Sonomètre en Ligne – Mesurer les Décibels en Ligne',
    metaDescription: 'Sonomètre en ligne gratuit : affichez immédiatement une estimation en dBA, dBC ou dBZ et calibrez l’appareil pour plus de précision.',
    navGuides: 'Guides', navMeasure: 'Mesurer', headerTag: 'Estimation navigateur',
    heroEyebrow: 'Sonomètre en ligne gratuit — sans téléchargement', heroH1: 'Sonomètre en ligne – Mesurez les décibels dans votre navigateur',
    heroSub: 'Mesurez immédiatement un niveau sonore estimé en dBA, puis calibrez l’appareil pour une meilleure précision propre au matériel.',
    startMeasuring: 'Commencer à mesurer', howAccuracy: 'Précision : comment ça marche',
    liveRegion: 'État de mesure en direct',
    statusIdle: 'Au repos', statusRequesting: 'Demande d’autorisation…',
    statusRunning: 'Mesure en cours', statusPaused: 'En pause', statusStopped: 'Arrêté', statusError: 'Attention requise',
    calibrationUncal: 'Non calibré — estimations uniquement', calibrationCal: 'Calibré',
    micPermission: 'Microphone', permUnknown: 'Non demandée', permGranted: 'Accordée', permDenied: 'Refusée', permPrompt: 'Demande',
    micSelect: 'Entrée microphone', micDefault: 'Microphone par défaut',
    btnStart: 'Démarrer', btnPause: 'Pause', btnResume: 'Reprendre', btnStop: 'Arrêter', btnReset: 'Réinitialiser',
    btnRetry: 'Réessayer', btnDismiss: 'Fermer', btnCancel: 'Annuler',
    btnCustomize: 'Personnaliser', btnStartMeasuring: 'Commencer à mesurer', btnStartNew: 'Nouvelle mesure', btnSave: 'Enregistrer',
    statusCalRequired: 'dBA estimés — calibrez pour plus de précision', inputStrength: 'Niveau sonore estimé',
    calibrateCta: 'Calibrer pour le niveau sonore',
    customizeTitle: 'Personnaliser la mesure', customizeClose: 'Fermer',
    statDuration: 'Durée',
    graphLabel: 'Historique du niveau', graphEmpty: 'Appuyez sur Démarrer pour enregistrer le graphique.',
    advanced: 'Contrôles avancés', weighting: 'Pondération', weightA: 'Pondération A (proche de l’oreille)',
    weightC: 'Pondération C (plus plate)', weightZ: 'Pondération Z (plate)',
    response: 'Réponse temporelle', respFast: 'Rapide (125 ms)', respSlow: 'Lente (1 s)',
    calTitle: 'Calibrage', calOffset: 'Valeur du sonomètre de référence (dBA)', calLabel: 'Nom du profil de calibrage (ex. « sonomètre bureau »)',
    calApply: 'Appliquer le calibrage', calReset: 'Revenir à non calibré',
    sessionDetails: 'Détails de session', deviceInfo: 'Appareil et microphone',
    exportTitle: 'Session et export', exportCsv: 'Exporter CSV', exportJson: 'Exporter JSON',
    historyTitle: 'Historique local', historyEmpty: 'Aucune session enregistrée.', historyClear: 'Effacer l’historique',
    stepsTitle: 'Mesurer en trois étapes', step1t: 'Autoriser le microphone', step1d: 'Appuyez sur Démarrer et accordez l’autorisation quand le navigateur la demande. L’audio reste sur votre appareil.',
    step2t: 'Suivre le panneau live', step2d: 'Lisez les décibels estimés actuels, minimaux, moyens et maximaux avec le graphique en direct.',
    step3t: 'Régler et exporter', step3d: 'Choisissez pondération et réponse, calibrez avec une référence si besoin, puis exportez en CSV ou JSON.',
    accTitle: 'Précision : comment ça marche', accBody: 'Les microphones de téléphones et d’ordinateurs ne sont pas des sonomètres calibrés : le gain, la position et la réponse varient selon l’appareil. Cet outil donne des estimations honnêtes du navigateur, jamais des mesures certifiées. Comparez avec une référence connue et utilisez un appareil calibré pour la sécurité ou le juridique.',
    troubleTitle: 'Dépannage du microphone', troubleBody: 'Si l’autorisation est refusée, ouvrez l’icône cadenas dans la barre d’adresse, autorisez le microphone puis appuyez à nouveau sur Démarrer. Si aucun appareil n’apparaît, branchez-en un et rechargez. Si une autre application utilise le micro, fermez-la d’abord.',
    sessionTitle: 'Sessions et export', sessionBody: 'Chaque session conserve durée et statistiques. Sans calibrage, l’écran affiche une estimation nominale ; les estimations propres à l’appareil sont exportées avec un calibrage compatible.',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: 'Est-ce un sonomètre calibré ?', a: 'Non. Les microphones du navigateur varient selon l’appareil, donc les lectures sont des estimations. Pour la sécurité ou le juridique, utilisez un sonomètre calibré de classe 1 ou 2.' },
      { q: 'Mon audio est-il envoyé ou enregistré ?', a: 'Non. Tout le traitement a lieu localement dans votre navigateur via Web Audio API. Aucun audio ne quitte votre appareil.' },
      { q: 'Pourquoi l’appareil affiche -- ?', a: 'Il affiche -- jusqu’à ce que vous autorisiez le microphone et appuyiez sur Démarrer. Aucune valeur simulée n’est affichée.' },
      { q: 'Que signifient dB, dBA, Fast et Slow ?', a: 'dB est l’unité du niveau sonore. La pondération A (dBA) suit à peu près l’oreille humaine ; C est plus plate, Z est plate. Fast (125 ms) suit les crêtes, Slow (1 s) les lisse.' },
      { q: 'Puis-je enregistrer une session ?', a: 'Oui. Exportez la session en CSV ou JSON ou conservez l’historique local dans ce navigateur. Rien n’est envoyé à un serveur.' },
    ],
    guidesTitle: 'Guides associés', footerNote: 'Sonomètre statique côté client. L’audio ne quitte jamais votre navigateur.',
    footerRights: 'Tous droits réservés.',
  }),
  pt: base({
    metaTitle: 'Medidor de Decibéis Online – Medir Som no Navegador',
    metaDescription: 'Medidor de decibéis online e grátis: veja imediatamente uma estimativa em dBA, dBC ou dBZ e calibre para maior precisão.',
    navGuides: 'Guias', navMeasure: 'Medir', headerTag: 'Estimativa do navegador',
    heroEyebrow: 'Medidor de decibéis online grátis — sem download', heroH1: 'Medidor de decibéis online – Meça o som no navegador',
    heroSub: 'Meça imediatamente um nível sonoro estimado em dBA e calibre o dispositivo para melhorar a precisão específica.',
    startMeasuring: 'Começar a medir', howAccuracy: 'Como funciona a precisão',
    liveRegion: 'Estado da medição ao vivo',
    statusIdle: 'Inativo', statusRequesting: 'Solicitando permissão…',
    statusRunning: 'Medindo', statusPaused: 'Pausado', statusStopped: 'Parado', statusError: 'Atenção necessária',
    calibrationUncal: 'Sem calibração — apenas estimativas', calibrationCal: 'Calibrado',
    micPermission: 'Microfone', permUnknown: 'Não solicitado', permGranted: 'Concedido', permDenied: 'Negado', permPrompt: 'Perguntar',
    micSelect: 'Entrada de microfone', micDefault: 'Microfone padrão',
    btnStart: 'Iniciar', btnPause: 'Pausar', btnResume: 'Continuar', btnStop: 'Parar', btnReset: 'Redefinir',
    btnRetry: 'Tentar de novo', btnDismiss: 'Fechar', btnCancel: 'Cancelar',
    btnCustomize: 'Personalizar', btnStartMeasuring: 'Começar a medir', btnStartNew: 'Iniciar nova medição', btnSave: 'Salvar',
    statusCalRequired: 'dBA estimados — calibre para maior precisão', inputStrength: 'Nível sonoro estimado',
    calibrateCta: 'Calibrar para nível sonoro',
    customizeTitle: 'Personalizar medição', customizeClose: 'Fechar',
    statDuration: 'Duração',
    graphLabel: 'Histórico de nível', graphEmpty: 'Prima Iniciar para registar o gráfico ao vivo.',
    advanced: 'Controlos avançados', weighting: 'Ponderação', weightA: 'Ponderação A (como o ouvido)',
    weightC: 'Ponderação C (mais plana)', weightZ: 'Ponderação Z (plana)',
    response: 'Resposta temporal', respFast: 'Rápida (125 ms)', respSlow: 'Lenta (1 s)',
    calTitle: 'Calibração', calOffset: 'Leitura do medidor de referência (dBA)', calLabel: 'Nome do perfil de calibração (ex. “medidor do escritório”)',
    calApply: 'Aplicar calibração', calReset: 'Voltar a sem calibração',
    sessionDetails: 'Detalhes da sessão', deviceInfo: 'Dispositivo e microfone',
    exportTitle: 'Sessão e exportação', exportCsv: 'Exportar CSV', exportJson: 'Exportar JSON',
    historyTitle: 'Histórico local', historyEmpty: 'Sem sessões guardadas.', historyClear: 'Limpar histórico',
    stepsTitle: 'Meça em três passos', step1t: 'Permita o microfone', step1d: 'Prima Iniciar e conceda a permissão quando o navegador pedir. O áudio fica no seu dispositivo.',
    step2t: 'Observe o painel ao vivo', step2d: 'Leia os decibéis estimados atuais, mínimos, médios e máximos no gráfico ao vivo.',
    step3t: 'Ajuste e exporte', step3d: 'Escolha ponderação e resposta, calibre com uma referência se preciso e exporte CSV ou JSON.',
    accTitle: 'Como funciona a precisão', accBody: 'Os microfones de telemóveis e portáteis não são sonómetros calibrados: ganho, posição e resposta variam com cada dispositivo. Esta ferramenta dá estimativas honestas do navegador, nunca leituras certificadas. Compare com uma referência conhecida e use equipamento calibrado para segurança ou questões legais.',
    troubleTitle: 'Resolução de problemas do microfone', troubleBody: 'Se a permissão foi negada, abra o cadeado na barra de endereços, permita o microfone e prima Iniciar novamente. Se nenhum dispositivo aparece, ligue um e recarregue. Se outra app ocupa o microfone, feche-a antes.',
    sessionTitle: 'Sessões e exportação', sessionBody: 'Cada sessão guarda duração e estatísticas. Sem calibração, o ecrã mostra uma estimativa nominal; estimativas específicas do dispositivo são exportadas com calibração compatível.',
    faqTitle: 'Perguntas frequentes',
    faq: [
      { q: 'É um sonómetro calibrado?', a: 'Não. Os microfones do navegador variam com o dispositivo, por isso as leituras são estimativas. Para segurança ou decisões legais, use um sonómetro calibrado de Classe 1 ou 2.' },
      { q: 'O meu áudio é enviado ou gravado?', a: 'Não. Todo o processamento acontece localmente no seu navegador via Web Audio API. Nenhum áudio sai do seu dispositivo.' },
      { q: 'Por que mostra --?', a: 'Mostra -- até conceder a permissão do microfone e premir Iniciar. Nunca são mostrados valores simulados.' },
      { q: 'O que significam dB, dBA, Fast e Slow?', a: 'dB é a unidade do nível sonoro. A ponderação A (dBA) segue aproximadamente o ouvido humano; C é mais plana e Z é plana. Fast (125 ms) segue os picos, Slow (1 s) suaviza.' },
      { q: 'Posso salvar uma sessão?', a: 'Sim. Exporte a sessão atual como CSV ou JSON ou mantenha o histórico local neste navegador. Nada é enviado a um servidor.' },
    ],
    guidesTitle: 'Guias relacionados', footerNote: 'Medidor estático local. O áudio nunca sai do seu navegador.',
    footerRights: 'Todos os direitos reservados.',
  }),
  ko: base({
    metaTitle: '온라인 데시벨 측정기 – 브라우저에서 소음 측정',
    metaDescription: '무료 온라인 데시벨 측정기: dBA·dBC·dBZ 추정값을 즉시 표시하고 교정으로 기기별 정확도를 높입니다.',
    navGuides: '가이드', navMeasure: '측정', headerTag: '브라우저 추정치',
    heroEyebrow: '무료 온라인 데시벨 측정기 — 다운로드 불필요', heroH1: '온라인 데시벨 측정기 – 브라우저에서 소음 측정',
    heroSub: '추정 dBA를 즉시 측정하고 기기를 교정해 기기별 정확도를 높이세요. 모든 처리는 브라우저 안에서 이루어집니다.',
    startMeasuring: '측정 시작', howAccuracy: '정확도 원리',
    liveRegion: '실시간 측정 상태',
    statusIdle: '대기', statusRequesting: '권한 요청 중…',
    statusRunning: '측정 중', statusPaused: '일시정지', statusStopped: '정지', statusError: '확인 필요',
    calibrationUncal: '미교정 — 추정값만 표시', calibrationCal: '교정됨',
    micPermission: '마이크', permUnknown: '미요청', permGranted: '허용', permDenied: '거부', permPrompt: '확인',
    micSelect: '마이크 입력', micDefault: '기본 마이크',
    btnStart: '시작', btnPause: '일시정지', btnResume: '계속', btnStop: '정지', btnReset: '초기화',
    btnRetry: '다시 시도', btnDismiss: '닫기', btnCancel: '취소',
    btnCustomize: '맞춤 설정', btnStartMeasuring: '측정 시작', btnStartNew: '새 측정 시작', btnSave: '저장',
    statusCalRequired: '추정 dBA — 교정하면 정확도가 향상됩니다', inputStrength: '추정 소음 레벨',
    calibrateCta: '소음 레벨용으로 교정',
    customizeTitle: '측정 맞춤 설정', customizeClose: '닫기',
    statDuration: '시간',
    graphLabel: '레벨 기록', graphEmpty: '시작을 눌러 라이브 그래프를 기록하세요.',
    advanced: '고급 설정', weighting: '주파수 가중', weightA: 'A 가중 (청감 보정)',
    weightC: 'C 가중', weightZ: 'Z 가중(플랫)',
    response: '시간 가중', respFast: 'Fast (125ms)', respSlow: 'Slow (1s)',
    calTitle: '교정', calOffset: '기준 소음계 측정값(dBA)', calLabel: '교정 프로파일 이름(예: 사무실 소음계)',
    calApply: '교정 적용', calReset: '미교정으로 초기화',
    sessionDetails: '세션 상세', deviceInfo: '기기 및 마이크',
    exportTitle: '세션 및 내보내기', exportCsv: 'CSV 내보내기', exportJson: 'JSON 내보내기',
    historyTitle: '로컬 기록', historyEmpty: '저장된 세션이 없습니다.', historyClear: '기록 지우기',
    stepsTitle: '3단계 측정', step1t: '마이크 허용', step1d: '시작을 누르고 브라우저 요청 시 권한을 허용하세요. 오디오는 기기에 남습니다.',
    step2t: '라이브 패널 보기', step2d: '현재·최소·평균·최대 추정 데시벨을 라이브 그래프에서 확인하세요.',
    step3t: '조정 및 내보내기', step3d: '가중과 시정수를 고르고 필요하면 기준기로 교정한 뒤 CSV·JSON으로 내보내세요.',
    accTitle: '정확도 원리', accBody: '휴대폰·노트북 마이크는 교정된 소음계가 아닙니다. 감도·위치·주파수 특성은 기기마다 다릅니다. 이 도구는 정직한 브라우저 추정치를 제공하며 공인 측정값이 아닙니다. 안전·법적 판단에는 교정된 측정기를 사용하세요.',
    troubleTitle: '마이크 문제 해결', troubleBody: '권한이 거부된 경우 주소창의 자물쇠 아이콘에서 마이크를 허용한 뒤 다시 시작을 누르세요. 장치가 없으면 연결 후 새로고침하고, 다른 통화 앱이 마이크를 사용 중이면 먼저 종료하세요.',
    sessionTitle: '세션 및 내보내기', sessionBody: '각 세션은 시간과 통계를 저장합니다. 미교정 상태에서는 공칭 추정값을 표시하고, 호환 교정 시 기기별 환경 소음 추정값을 내보냅니다.',
    faqTitle: '자주 묻는 질문',
    faq: [
      { q: '교정된 소음계인가요?', a: '아니요. 브라우저 마이크는 기기마다 감도가 달라 표시값은 추정치입니다. 안전·법적 판단에는 클래스 1·2 교정 소음계를 사용하세요.' },
      { q: '오디오가 업로드·녹음되나요?', a: '아니요. 모든 처리는 Web Audio API로 브라우저 안에서 이루어지며, 이 사이트에서 오디오가 외부로 전송되지 않습니다.' },
      { q: '왜 -- 로 표시되나요?', a: '마이크 권한을 허용하고 시작을 누르기 전까지 -- 로 표시됩니다. 시뮬레이션 값은 표시하지 않습니다.' },
      { q: 'dB·dBA·Fast·Slow란?', a: 'dB는 소음 레벨 단위입니다. A가중(dBA)은 사람 청감에 가깝고, C는 더 평탄하며, Z는 무보정입니다. Fast(125ms)는 피크를 따르고, Slow(1s)는 평활화합니다.' },
      { q: '세션을 저장할 수 있나요?', a: '예. 현재 세션을 CSV·JSON으로 내보내거나 이 브라우저에 로컬 기록을 남길 수 있습니다. 서버로 전송하지 않습니다.' },
    ],
    guidesTitle: '관련 가이드', footerNote: '정적 클라이언트 측 미터. 오디오가 브라우저를 떠나지 않습니다.',
    footerRights: '모든 권리 보유.',
  }),
};

export function getDict(locale: Locale): Dict {
  const resolved = dicts[locale] ? locale : 'en';
  return { ...dicts[resolved], ui: getUi(resolved) };
}
