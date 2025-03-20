# Förmånsbilskostnadsberäkning

En webbapplikation för att beräkna kostnaden för en förmånsbil, inklusive skatter och ackumulerade kostnader över tid.

## Funktioner

- Beräkning av förmånsbilskostnad baserat på:
  - Bruttolön
  - Kommun
  - Bilinformation (märke, modell, årsmodell, etc.)
  - Registreringsnummer (valfritt)
- Visar:
  - Brutto- och nettokostnad per månad
  - Lön efter skatt
  - Lön efter skatt och förmån
  - Ackumulerad kostnad över valt antal år

## Teknisk stack

- Next.js 14
- TypeScript
- Tailwind CSS
- SCB API för kommunalskatter
- Skatteverket API för bilförmåner

## Installation

1. Klona repot:
```bash
git clone [repo-url]
cd bilforman-beraknare
```

2. Installera beroenden:
```bash
npm install
```

3. Starta utvecklingsservern:
```bash
npm run dev
```

4. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Deployment

Applikationen är konfigurerad för deployment på Vercel. Koppla ditt GitHub-repo till Vercel för automatisk deployment vid push till main-branchen.

## API-nycklar

För att använda Skatteverkets API behöver du registrera dig för en API-nyckel på deras utvecklarportal. Lägg till din API-nyckel i en `.env.local` fil:

```
SKATTEVERKET_API_KEY=din-api-nyckel
```

## Licens

MIT
