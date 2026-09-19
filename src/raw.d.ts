declare module '*?raw' {
  const src: string;
  export default src;
}

interface SoundGuideReading {
  value: number | null;
  unit: string;
  calibrated: boolean;
}

interface Window {
  __rdmReading?: SoundGuideReading;
}

interface DocumentEventMap {
  'rdm:reading': CustomEvent<SoundGuideReading>;
}
