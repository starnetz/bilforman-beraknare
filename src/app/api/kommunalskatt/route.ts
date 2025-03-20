import { NextResponse } from 'next/server';

// Mock-data för kommuner om API-anropet misslyckas
const mockKommuner = [
  { key: ["0180", "Stockholm"], values: ["29.82"] },
  { key: ["0114", "Upplands Väsby"], values: ["31.95"] },
  { key: ["0115", "Vallentuna"], values: ["31.08"] },
  { key: ["0117", "Österåker"], values: ["29.08"] },
  { key: ["0120", "Värmdö"], values: ["31.26"] },
  { key: ["0123", "Järfälla"], values: ["31.08"] },
  { key: ["0125", "Ekerö"], values: ["30.32"] },
  { key: ["0126", "Huddinge"], values: ["31.95"] },
  { key: ["0127", "Botkyrka"], values: ["32.23"] },
  { key: ["0128", "Salem"], values: ["31.53"] },
  { key: ["0136", "Haninge"], values: ["31.56"] },
  { key: ["0138", "Tyresö"], values: ["30.88"] },
  { key: ["0140", "Nykvarn"], values: ["31.25"] },
  { key: ["0160", "Täby"], values: ["29.63"] },
  { key: ["0162", "Danderyd"], values: ["29.65"] },
  { key: ["0163", "Sollentuna"], values: ["30.20"] },
  { key: ["0181", "Södertälje"], values: ["32.23"] },
  { key: ["0182", "Nacka"], values: ["29.83"] },
  { key: ["0183", "Sundbyberg"], values: ["31.23"] },
  { key: ["0184", "Solna"], values: ["29.20"] },
  { key: ["0186", "Lidingö"], values: ["29.95"] },
  { key: ["0380", "Uppsala"], values: ["33.00"] },
  { key: ["1280", "Malmö"], values: ["32.42"] },
  { key: ["1480", "Göteborg"], values: ["33.00"] },
  { key: ["1980", "Västerås"], values: ["32.07"] },
  { key: ["2180", "Örebro"], values: ["33.50"] },
  { key: ["2281", "Sundsvall"], values: ["33.78"] },
  { key: ["2480", "Umeå"], values: ["34.15"] },
  { key: ["2580", "Luleå"], values: ["33.85"] }
];

export async function GET() {
  try {
    // Prova att hämta från SCB API först
    const response = await fetch('https://api.scb.se/OV0104/v1/doris/sv/ssd/START/OE/OE0101/Kommunalskatter2000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: [
          {
            code: "Region",
            selection: {
              filter: "vs:RegionKommun07EjAggr",
              values: ["*"]
            }
          },
          {
            code: "ContentsCode",
            selection: {
              filter: "item",
              values: ["OE0101D1"]
            }
          },
          {
            code: "Tid",
            selection: {
              filter: "item",
              values: ["2025"]
            }
          }
        ],
        response: {
          format: "json"
        }
      }),
      // Sätt en timeout för att undvika hängande anrop
      signal: AbortSignal.timeout(10000) // 10 sekunder timeout
    });

    if (!response.ok) {
      throw new Error(`SCB API svarade med status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.value) {
      // Om API-svaret inte har förväntat format, använd mock-data
      console.log('Felaktigt format från SCB API, använder mock-data');
      return NextResponse.json({ value: mockKommuner });
    }
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Kunde inte hämta kommunalskatter:', error);
    
    // Använd mock-data som fallback
    console.log('Använder mock-data som fallback');
    return NextResponse.json({ value: mockKommuner });
  }
} 