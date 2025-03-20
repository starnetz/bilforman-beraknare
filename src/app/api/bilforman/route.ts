import { NextResponse } from 'next/server';
import { ApiFel } from '@/types';

interface BilInfo {
  pris: number;
  formanskostnad: number;
  miljoklass: string;
  beskrivning: string;
}

interface BilEditionRecord {
  [edition: string]: BilInfo;
}

interface BilModellRecord {
  [modell: string]: BilEditionRecord;
}

interface BilMarkeRecord {
  [marke: string]: BilModellRecord;
}

// Mock-data för bilar (används om API-nyckel saknas)
const mockBilar: BilMarkeRecord = {
  'volvo': {
    'xc90': {
      'B5 AWD': {
        pris: 849900,
        formanskostnad: 9500,
        miljoklass: 'Euro 6',
        beskrivning: 'Volvo XC90 B5 AWD'
      },
      'T8 Recharge': {
        pris: 999900,
        formanskostnad: 8750,
        miljoklass: 'Laddhybrid',
        beskrivning: 'Volvo XC90 T8 Recharge'
      }
    },
    'xc60': {
      'B5 AWD': {
        pris: 649900,
        formanskostnad: 8250,
        miljoklass: 'Euro 6',
        beskrivning: 'Volvo XC60 B5 AWD'
      },
      'T8 Recharge': {
        pris: 799900,
        formanskostnad: 7500,
        miljoklass: 'Laddhybrid',
        beskrivning: 'Volvo XC60 T8 Recharge'
      }
    }
  },
  'tesla': {
    'model 3': {
      'Long Range': {
        pris: 599900,
        formanskostnad: 4250,
        miljoklass: 'Elbil',
        beskrivning: 'Tesla Model 3 Long Range'
      },
      'Performance': {
        pris: 699900,
        formanskostnad: 4750,
        miljoklass: 'Elbil',
        beskrivning: 'Tesla Model 3 Performance'
      }
    },
    'model y': {
      'Long Range': {
        pris: 649900,
        formanskostnad: 4500,
        miljoklass: 'Elbil',
        beskrivning: 'Tesla Model Y Long Range'
      },
      'Performance': {
        pris: 749900,
        formanskostnad: 5000,
        miljoklass: 'Elbil',
        beskrivning: 'Tesla Model Y Performance'
      }
    }
  },
  'bmw': {
    'x5': {
      'xDrive40i': {
        pris: 899900,
        formanskostnad: 10250,
        miljoklass: 'Euro 6',
        beskrivning: 'BMW X5 xDrive40i'
      },
      'xDrive45e': {
        pris: 999900,
        formanskostnad: 9000,
        miljoklass: 'Laddhybrid',
        beskrivning: 'BMW X5 xDrive45e'
      }
    },
    'i4': {
      'eDrive40': {
        pris: 649900,
        formanskostnad: 5250,
        miljoklass: 'Elbil',
        beskrivning: 'BMW i4 eDrive40'
      },
      'M50': {
        pris: 799900,
        formanskostnad: 5750,
        miljoklass: 'Elbil',
        beskrivning: 'BMW i4 M50'
      }
    }
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marke, modell, edition } = body;

    // Använd mock-data om API-nyckel saknas
    if (!process.env.SKATTEVERKET_API_KEY) {
      console.log('API-nyckel saknas, använder mock-data');
      
      const markeNorm = marke.toLowerCase().trim();
      const modellNorm = modell.toLowerCase().trim();
      
      // Försök hitta data i mock-object
      if (
        mockBilar[markeNorm] && 
        mockBilar[markeNorm][modellNorm] && 
        mockBilar[markeNorm][modellNorm][edition]
      ) {
        return NextResponse.json(mockBilar[markeNorm][modellNorm][edition]);
      }
      
      // Fallback om exakt match inte hittades
      // Returnera första tillgängliga bilen för märket och modellen
      if (mockBilar[markeNorm] && mockBilar[markeNorm][modellNorm]) {
        const editions = Object.keys(mockBilar[markeNorm][modellNorm]);
        if (editions.length > 0) {
          return NextResponse.json(mockBilar[markeNorm][modellNorm][editions[0]]);
        }
      }
      
      // Fallback om modellen inte hittades
      if (mockBilar[markeNorm]) {
        const modeller = Object.keys(mockBilar[markeNorm]);
        if (modeller.length > 0) {
          const editions = Object.keys(mockBilar[markeNorm][modeller[0]]);
          if (editions.length > 0) {
            return NextResponse.json(mockBilar[markeNorm][modeller[0]][editions[0]]);
          }
        }
      }
      
      // Om inget matchade, returnera default-värde
      return NextResponse.json({
        pris: 500000,
        formanskostnad: 7500,
        miljoklass: 'Okänd',
        beskrivning: `${marke} ${modell} ${edition}`
      });
    }

    // Annars, använd Skatteverkets API
    const response = await fetch('https://www7.skatteverket.se/portal/apier-och-oppna-data/utvecklarportalen/api/bilforman/2.0.0/Komplett%20testtjanst', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SKATTEVERKET_API_KEY}`
      },
      body: JSON.stringify(body)
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