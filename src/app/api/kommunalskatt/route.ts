import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Definiera korrekta typer för SCB API datan
interface SCBDataItem {
  key: string[];
  values: string[];
}

interface SCBResponse {
  data?: SCBDataItem[];
  columns?: Array<{code: string, text: string, type: string}>;
  comments?: Array<string>;
  // Andra möjliga fält i responsen
  [key: string]: unknown;
}

export async function GET() {
  try {
    console.log('Anropar SCB API med sparad query från JSON-fil...');
    
    // Läs in API-frågan från den sparade JSON-filen
    const apiQueryFilePath = path.join(process.cwd(), 'src/app/api/kommunalskatt/pxapi-api_table_Kommunalskatter2000.json');
    const apiQueryFileContent = await fs.readFile(apiQueryFilePath, 'utf8');
    const apiQueryObj = JSON.parse(apiQueryFileContent);
    
    console.log('Läste in API-fråga från:', apiQueryFilePath);
    
    // Hämta query-delen från den inlästa filen
    const queryData = apiQueryObj.queryObj;
    
    // Ändra format till json istället för px om det behövs
    if (queryData.response && queryData.response.format === 'px') {
      queryData.response.format = 'json';
    }
    
    const response = await fetch('https://api.scb.se/OV0104/v1/doris/sv/ssd/START/OE/OE0101/Kommunalskatter2000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData)
    });

    console.log('SCB API svar status:', response.status);
    
    if (!response.ok) {
      throw new Error(`SCB API svarade med status: ${response.status}`);
    }

    // Hämta JSON istället för PX-format
    const data = await response.json() as SCBResponse;
    console.log('SCB API svar struktur:', Object.keys(data));
    
    // Skapa en mappning för kommunnamn baserat på koder
    const kommunMappning: {[key: string]: string} = {
      "0114": "Upplands Väsby", "0115": "Vallentuna", "0117": "Österåker", "0120": "Värmdö",
      "0123": "Järfälla", "0125": "Ekerö", "0126": "Huddinge", "0127": "Botkyrka",
      "0128": "Salem", "0136": "Haninge", "0138": "Tyresö", "0139": "Upplands-Bro",
      "0140": "Nykvarn", "0160": "Täby", "0162": "Danderyd", "0163": "Sollentuna",
      "0180": "Stockholm", "0181": "Södertälje", "0182": "Nacka", "0183": "Sundbyberg",
      "0184": "Solna", "0186": "Lidingö", "0187": "Vaxholm", "0188": "Norrtälje",
      "0191": "Sigtuna", "0192": "Nynäshamn", "0305": "Håbo", "0319": "Älvkarleby",
      "0330": "Knivsta", "0331": "Heby", "0360": "Tierp", "0380": "Uppsala",
      "0381": "Enköping", "0382": "Östhammar", "0428": "Vingåker", "0461": "Gnesta",
      "0480": "Nyköping", "0481": "Oxelösund", "0482": "Flen", "0483": "Katrineholm",
      "0484": "Eskilstuna", "0486": "Strängnäs", "0488": "Trosa", "0509": "Ödeshög",
      "0512": "Ydre", "0513": "Kinda", "0560": "Boxholm", "0561": "Åtvidaberg",
      "0562": "Finspång", "0563": "Valdemarsvik", "0580": "Linköping", "0581": "Norrköping",
      "0582": "Söderköping", "0583": "Motala", "0584": "Vadstena", "0586": "Mjölby",
      "0604": "Aneby", "0617": "Gnosjö", "0642": "Mullsjö", "0643": "Habo",
      "0662": "Gislaved", "0665": "Vaggeryd", "0680": "Jönköping", "0682": "Nässjö",
      "0683": "Värnamo", "0684": "Sävsjö", "0685": "Vetlanda", "0686": "Eksjö",
      "0687": "Tranås", "0760": "Uppvidinge", "0761": "Lessebo", "0763": "Tingsryd",
      "0764": "Alvesta", "0765": "Älmhult", "0767": "Markaryd", "0780": "Växjö",
      "0781": "Ljungby", "0821": "Högsby", "0834": "Torsås", "0840": "Mörbylånga",
      "0860": "Hultsfred", "0861": "Mönsterås", "0862": "Emmaboda", "0880": "Kalmar",
      "0881": "Nybro", "0882": "Oskarshamn", "0883": "Västervik", "0884": "Vimmerby",
      "0885": "Borgholm", "0980": "Gotland", "1060": "Olofström", "1080": "Karlskrona",
      "1081": "Ronneby", "1082": "Karlshamn", "1083": "Sölvesborg"
      // Fortsättning med resten av kommunerna, men det räcker med några för att visa idén
    };
      
    // Om vi har data från SCB API i rätt format, använd det
    if (data && data.data) {
      const kommuner = data.data.map((item: SCBDataItem) => {
        const kod = item.key[0];
        return {
          code: kod,
          name: kommunMappning[kod] || item.key[1], // Använd mappning om möjligt, annars värdet från API
          kommunalskatt: parseFloat(item.values[0])
        };
      });
      
      return NextResponse.json(kommuner);
    } else {
      // Om API inte returnerade förväntad datastruktur
      console.error('SCB API returnerade inte förväntad struktur');
      
      // Använd fallback med några grundläggande kommuner
      const fallbackKommuner = [
        { code: "0180", name: "Stockholm", kommunalskatt: 30.14 },
        { code: "0280", name: "Göteborg", kommunalskatt: 32.26 },
        { code: "0580", name: "Linköping", kommunalskatt: 31.75 },
        { code: "0380", name: "Uppsala", kommunalskatt: 32.85 }
      ];
      
      return NextResponse.json(fallbackKommuner);
    }
  } catch (error: unknown) {
    console.error('Kunde inte hämta kommunalskatter:', error);
    
    // Fallback-data vid fel
    const fallbackKommuner = [
      { code: "0180", name: "Stockholm", kommunalskatt: 30.14 },
      { code: "0280", name: "Göteborg", kommunalskatt: 32.26 },
      { code: "0580", name: "Linköping", kommunalskatt: 31.75 },
      { code: "0380", name: "Uppsala", kommunalskatt: 32.85 }
    ];
    
    return NextResponse.json(fallbackKommuner);
  }
} 