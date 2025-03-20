'use client';

import { useState, useEffect } from 'react';
import { Kommun, Bil, BerakningsResultat, ValideringsFel } from '@/types';

interface SCBDataItem {
  key: string[];
  values: string[];
}

export default function Home() {
  const [bruttolon, setBruttolon] = useState<number>(0);
  const [valdKommun, setValdKommun] = useState<string>('');
  const [kommuner, setKommuner] = useState<Kommun[]>([]);
  const [bil, setBil] = useState<Bil>({
    marke: '',
    modell: '',
    edition: '',
    arsmodell: new Date().getFullYear(),
    drivmedel: 'bensin',
    skatt: 0
  });
  const [resultat, setResultat] = useState<BerakningsResultat | null>(null);
  const [antalAr, setAntalAr] = useState<number>(3);
  const [laddar, setLaddar] = useState<boolean>(false);
  const [fel, setFel] = useState<ValideringsFel>({});
  const [apiFel, setApiFel] = useState<string>('');

  useEffect(() => {
    const hämtaKommunalskatter = async () => {
      try {
        setLaddar(true);
        setApiFel('');
        console.log('Hämtar kommunalskatter...');
        
        const response = await fetch('/api/kommunalskatt');
        
        if (!response.ok) {
          throw new Error(`Kunde inte hämta kommunalskatter. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Mottagen data struktur:', Object.keys(data));
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Hantera PX-format från SCB API
        if (typeof data === 'string' && data.includes('HEADING=')) {
          console.log('PX-format detekterat, bearbetar data...');
          
          // Förenkla PX-formatet för att hämta kommuner
          const rows = data.split('\n');
          let kommunerData: Kommun[] = [];
          
          // Hitta VALUES-sektionen för regioner
          const valuesStart = rows.findIndex(row => row.startsWith('VALUES("Region"'))+1;
          
          if (valuesStart > 0) {
            let i = valuesStart;
            let regionCodes: string[] = [];
            
            // Samla alla regionkoder
            while (i < rows.length && !rows[i].includes(';')) {
              const code = rows[i].trim().replace(/"/g, '');
              if (code.length > 0) {
                regionCodes.push(code);
              }
              i++;
            }
            
            // Hitta STUB-sektionen för att få namngivningsinformation
            const stubStart = rows.findIndex(row => row.startsWith('STUB="Region"'))+1;
            let regionNames: string[] = [];
            
            if (stubStart > 0) {
              i = stubStart;
              while (i < rows.length && !rows[i].includes(';')) {
                const name = rows[i].trim().replace(/"/g, '');
                if (name.length > 0) {
                  regionNames.push(name);
                }
                i++;
              }
            }
            
            // Hitta DATA-sektionen
            const dataStart = rows.findIndex(row => row.startsWith('DATA='))+1;
            let taxValues: string[] = [];
            
            if (dataStart > 0) {
              i = dataStart;
              while (i < rows.length && !rows[i].includes(';')) {
                const value = rows[i].trim();
                if (value.length > 0) {
                  taxValues.push(value);
                }
                i++;
              }
            }
            
            // Skapa kommuner-array
            for (let j = 0; j < regionCodes.length; j++) {
              const code = regionCodes[j];
              // Filtrera bort län, riket, etc.
              if (code.length >= 4) {
                kommunerData.push({
                  code: code,
                  name: regionNames[j] || code,
                  kommunalskatt: parseFloat(taxValues[j] || '0')
                });
              }
            }
            
            console.log(`Bearbetad PX-data: ${kommunerData.length} kommuner hittades`);
            if (kommunerData.length > 0) {
              console.log('Första kommun:', kommunerData[0]);
            }
          } else {
            throw new Error('Kunde inte hitta regioner i PX-formatet');
          }
          
          // Sortera kommuner efter namn
          kommunerData.sort((a, b) => a.name.localeCompare(b.name));
          setKommuner(kommunerData);
        } else {
          // Fallback till att hantera JSON-format om det inte är PX-format
          let kommunerData: Kommun[] = [];
          
          if (data.data && Array.isArray(data.data)) {
            console.log('Använder data.data-formatet, första item:', data.data[0]);
            kommunerData = data.data
              .filter((item: SCBDataItem) => 
                item.key && 
                item.key.length >= 2 && 
                item.values && 
                item.values.length > 0 &&
                // Filtrera bort icke-kommuner (t.ex. län, riket)
                item.key[0].length >= 4
              )
              .map((item: SCBDataItem) => ({
                code: item.key[0],
                name: item.key[1],
                kommunalskatt: parseFloat(item.values[0])
              }));
          } else if (data.value && Array.isArray(data.value)) {
            console.log('Använder data.value-formatet, första item:', data.value[0]);
            kommunerData = data.value
              .filter((item: SCBDataItem) => 
                item.key && 
                item.key.length >= 2 && 
                item.values && 
                item.values.length > 0 &&
                // Filtrera bort icke-kommuner (t.ex. län, riket)
                item.key[0].length >= 4
              )
              .map((item: SCBDataItem) => ({
                code: item.key[0],
                name: item.key[1],
                kommunalskatt: parseFloat(item.values[0])
              }));
          } else {
            throw new Error('Okänt dataformat från SCB API. Data: ' + JSON.stringify(data).substring(0, 200));
          }
          
          console.log(`Bearbetad JSON-data: ${kommunerData.length} kommuner hittades`);
          if (kommunerData.length > 0) {
            console.log('Första kommun:', kommunerData[0]);
          }
          
          // Sortera kommuner efter namn
          kommunerData.sort((a, b) => a.name.localeCompare(b.name));
          setKommuner(kommunerData);
        }
      } catch (error) {
        console.error('Fel vid hämtning av kommunalskatter:', error);
        setApiFel(error instanceof Error ? error.message : 'Kunde inte hämta kommunalskatter. Försök igen senare.');
      } finally {
        setLaddar(false);
      }
    };

    hämtaKommunalskatter();
  }, []);

  const valideraInput = (): boolean => {
    const nyaFel: ValideringsFel = {};

    if (!bruttolon || bruttolon <= 0) {
      nyaFel.bruttolon = 'Ange en giltig bruttolön';
    }

    if (!valdKommun) {
      nyaFel.kommun = 'Välj en kommun';
    }

    if (!bil.marke.trim()) {
      nyaFel.marke = 'Ange bilmärke';
    }

    if (!bil.modell.trim()) {
      nyaFel.modell = 'Ange bilmodell';
    }

    if (!bil.arsmodell || bil.arsmodell < 1900 || bil.arsmodell > new Date().getFullYear() + 1) {
      nyaFel.arsmodell = 'Ange ett giltigt årsmodell';
    }

    if (bil.registreringsnummer && !/^[A-Z]{3}[0-9]{1,3}$/.test(bil.registreringsnummer)) {
      nyaFel.registreringsnummer = 'Ange ett giltigt registreringsnummer (t.ex. ABC123)';
    }

    setFel(nyaFel);
    return Object.keys(nyaFel).length === 0;
  };

  const beräknaKostnad = async () => {
    if (!valideraInput()) return;

    try {
      setLaddar(true);
      setApiFel('');

      // Hämta bilinformation från Skatteverket
      const bilResponse = await fetch('/api/bilforman', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bil)
      });

      if (!bilResponse.ok) {
        const error = await bilResponse.json();
        throw new Error(error.error || 'Kunde inte hämta bilinformation');
      }

      const bilData = await bilResponse.json();

      // Hitta vald kommun
      const kommun = kommuner.find(k => k.code === valdKommun);
      if (!kommun) {
        throw new Error('Kunde inte hitta vald kommun');
      }

      // Beräkna skatter
      const kommunalskatt = bruttolon * (kommun.kommunalskatt / 100);
      const statligSkatt = bruttolon > 598500 ? (bruttolon - 598500) * 0.2 : 0;
      const totalSkatt = kommunalskatt + statligSkatt;

      // Beräkna förmånsvärde
      const formansvarde = bilData.formanskostnad;
      const formansskatt = formansvarde * (kommun.kommunalskatt / 100);

      // Beräkna resultat
      const resultat: BerakningsResultat = {
        bruttoKostnad: formansvarde,
        nettoKostnad: formansskatt,
        lonEfterSkatt: bruttolon - totalSkatt,
        lonEfterSkattOchForman: bruttolon - totalSkatt - formansskatt,
        ackumuleradKostnad: {},
        detaljer: {
          kommunalskatt,
          statligSkatt,
          formansvarde,
          formansskatt
        }
      };

      // Beräkna ackumulerad kostnad
      for (let år = 1; år <= antalAr; år++) {
        resultat.ackumuleradKostnad[år] = formansskatt * år;
      }

      setResultat(resultat);
    } catch (error) {
      console.error('Kunde inte beräkna kostnad:', error);
      setApiFel(error instanceof Error ? error.message : 'Ett oväntat fel uppstod');
    } finally {
      setLaddar(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Förmånsbilskostnadsberäkning</h1>
        
        {apiFel && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {apiFel}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label className="block mb-2 text-gray-700">Bruttolön (kr/år)</label>
              <input
                type="number"
                value={bruttolon}
                onChange={(e) => setBruttolon(Number(e.target.value))}
                className={`w-full p-2 border rounded ${fel.bruttolon ? 'border-red-500' : ''}`}
              />
              {fel.bruttolon && <p className="text-red-500 text-sm mt-1">{fel.bruttolon}</p>}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Kommun</label>
              <select
                value={valdKommun}
                onChange={(e) => setValdKommun(e.target.value)}
                className={`w-full p-2 border rounded ${fel.kommun ? 'border-red-500' : ''}`}
                disabled={laddar || kommuner.length === 0}
              >
                <option value="">Välj kommun</option>
                {kommuner.map((kommun) => (
                  <option key={kommun.code} value={kommun.code}>
                    {kommun.name}
                  </option>
                ))}
              </select>
              {fel.kommun && <p className="text-red-500 text-sm mt-1">{fel.kommun}</p>}
              {kommuner.length === 0 && !apiFel && (
                <p className="text-gray-500 text-sm mt-1">Laddar kommuner...</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Bilmärke</label>
              <input
                type="text"
                value={bil.marke}
                onChange={(e) => setBil({ ...bil, marke: e.target.value })}
                className={`w-full p-2 border rounded ${fel.marke ? 'border-red-500' : ''}`}
              />
              {fel.marke && <p className="text-red-500 text-sm mt-1">{fel.marke}</p>}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Modell</label>
              <input
                type="text"
                value={bil.modell}
                onChange={(e) => setBil({ ...bil, modell: e.target.value })}
                className={`w-full p-2 border rounded ${fel.modell ? 'border-red-500' : ''}`}
              />
              {fel.modell && <p className="text-red-500 text-sm mt-1">{fel.modell}</p>}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Edition</label>
              <input
                type="text"
                value={bil.edition}
                onChange={(e) => setBil({ ...bil, edition: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Årsmodell</label>
              <input
                type="number"
                value={bil.arsmodell}
                onChange={(e) => setBil({ ...bil, arsmodell: Number(e.target.value) })}
                className={`w-full p-2 border rounded ${fel.arsmodell ? 'border-red-500' : ''}`}
              />
              {fel.arsmodell && <p className="text-red-500 text-sm mt-1">{fel.arsmodell}</p>}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Drivmedel</label>
              <select
                value={bil.drivmedel}
                onChange={(e) => setBil({ ...bil, drivmedel: e.target.value as Bil['drivmedel'] })}
                className="w-full p-2 border rounded"
              >
                <option value="bensin">Bensin</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="el">El</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Registreringsnummer (valfritt)</label>
              <input
                type="text"
                value={bil.registreringsnummer || ''}
                onChange={(e) => setBil({ ...bil, registreringsnummer: e.target.value })}
                className={`w-full p-2 border rounded ${fel.registreringsnummer ? 'border-red-500' : ''}`}
              />
              {fel.registreringsnummer && <p className="text-red-500 text-sm mt-1">{fel.registreringsnummer}</p>}
            </div>

            <div>
              <label className="block mb-2 text-gray-700">Antal år för ackumulerad kostnad</label>
              <input
                type="number"
                value={antalAr}
                onChange={(e) => setAntalAr(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              onClick={beräknaKostnad}
              disabled={laddar || kommuner.length === 0}
              className={`w-full p-3 rounded text-white font-medium ${
                laddar || kommuner.length === 0
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {laddar ? 'Beräknar...' : 'Beräkna kostnad'}
            </button>
          </div>

          {resultat && (
            <div className="space-y-4 bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-800">Resultat</h2>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-700 mb-2">Månadskostnad</h3>
                <p className="text-lg">Bruttokostnad: {resultat.bruttoKostnad.toFixed(2)} kr</p>
                <p className="text-lg">Nettokostnad: {resultat.nettoKostnad.toFixed(2)} kr</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-700 mb-2">Löneinformation</h3>
                <p className="text-lg">Lön efter skatt: {resultat.lonEfterSkatt.toFixed(2)} kr</p>
                <p className="text-lg">Lön efter skatt och förmån: {resultat.lonEfterSkattOchForman.toFixed(2)} kr</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-700 mb-2">Detaljer</h3>
                <p>Kommunalskatt: {resultat.detaljer.kommunalskatt.toFixed(2)} kr</p>
                <p>Statlig skatt: {resultat.detaljer.statligSkatt.toFixed(2)} kr</p>
                <p>Förmånsvärde: {resultat.detaljer.formansvarde.toFixed(2)} kr</p>
                <p>Förmånsskatt: {resultat.detaljer.formansskatt.toFixed(2)} kr</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-700 mb-2">Ackumulerad kostnad</h3>
                {Object.entries(resultat.ackumuleradKostnad).map(([år, kostnad]) => (
                  <p key={år} className="text-lg">
                    Efter {år} år: {kostnad.toFixed(2)} kr
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
