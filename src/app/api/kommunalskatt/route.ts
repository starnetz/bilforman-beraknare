import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Kunde inte hämta kommunalskatter' }, { status: 500 });
  }
} 