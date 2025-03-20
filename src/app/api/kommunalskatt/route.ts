import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Anropar SCB API med förenklad query...');
    
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
              filter: "all",
              values: ["*"]
            }
          }
        ],
        response: {
          format: "json"
        }
      })
    });

    console.log('SCB API svar status:', response.status);
    
    if (!response.ok) {
      throw new Error(`SCB API svarade med status: ${response.status}`);
    }

    const data = await response.json();
    console.log('SCB API svar struktur:', Object.keys(data));
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Kunde inte hämta kommunalskatter:', error);
    return NextResponse.json({ error: 'Kunde inte hämta kommunalskatter' }, { status: 500 });
  }
} 