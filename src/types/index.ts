export interface Kommun {
  code: string;
  name: string;
  kommunalskatt: number;
}

export interface Bil {
  marke: string;
  modell: string;
  edition: string;
  arsmodell: number;
  drivmedel: 'bensin' | 'diesel' | 'hybrid' | 'el';
  skatt: number;
  registreringsnummer?: string;
}

export interface BerakningsResultat {
  bruttoKostnad: number;
  nettoKostnad: number;
  lonEfterSkatt: number;
  lonEfterSkattOchForman: number;
  ackumuleradKostnad: {
    [key: number]: number;
  };
  detaljer: {
    kommunalskatt: number;
    statligSkatt: number;
    formansvarde: number;
    formansskatt: number;
  };
}

export interface SkatteverketBilData {
  pris: number;
  formanskostnad: number;
  miljoklass: string;
  beskrivning: string;
}

export interface ValideringsFel {
  bruttolon?: string;
  kommun?: string;
  marke?: string;
  modell?: string;
  arsmodell?: string;
  registreringsnummer?: string;
}

export interface ApiFel {
  message: string;
  code: string;
} 