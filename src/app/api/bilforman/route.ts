import { NextResponse } from 'next/server';
import { ApiFel } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marke, modell, edition, arsmodell } = body;

    if (!process.env.SKATTEVERKET_API_KEY) {
      throw new Error('API-nyckel saknas');
    }

    const response = await fetch('https://www7.skatteverket.se/portal/apier-och-oppna-data/utvecklarportalen/api/bilforman/2.0.0/Komplett%20testtjanst', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SKATTEVERKET_API_KEY}`
      },
      body: JSON.stringify({
        marke,
        modell,
        edition,
        arsmodell
      })
    });

    if (!response.ok) {
      const error: ApiFel = await response.json();
      return NextResponse.json(
        { error: error.message || 'Kunde inte hämta bilinformation' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API-fel:', error);
    return NextResponse.json(
      { error: 'Ett oväntat fel uppstod vid hämtning av bilinformation' },
      { status: 500 }
    );
  }
} 