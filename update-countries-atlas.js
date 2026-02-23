const https = require('https');
const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'lib/mocks/world-data.ts');

https.get('https://unpkg.com/world-atlas@2.0.2/countries-110m.json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const json = JSON.parse(data);
        const DADOS = json.objects.countries.geometries
            .filter(g => g.id && g.id !== '-99') // Ignore unidentified elements or Antarctica if not needed, though we can color it too
            .map(g => {
                const numericId = g.id;
                const nome = g.properties.name || 'Unknown';

                let hash = [...nome].reduce((acc, char) => acc + char.charCodeAt(0), 0);

                // Pseudo-random deterministic values
                const pib = (hash % 60 + 1).toFixed(1);
                const crescPib = ((hash % 100) / 20 - 2).toFixed(1);
                const inflacao = ((hash * 7) % 25 + 0.5).toFixed(1);
                const desemp = ((hash * 3) % 15 + 2).toFixed(1);
                const div = ((hash * 13) % 150 + 10).toFixed(1);
                const merc = ((hash * 17) % 60 - 20).toFixed(1);
                const taxa = ((hash * 19) % 20).toFixed(2);
                const bal = ((hash * 23) % 20 - 10).toFixed(1);

                return `  { iso3: ${JSON.stringify(numericId)}, nome: ${JSON.stringify(nome)}, bandeira: "🗺️", pib: ${parseFloat(pib)}, crescimentoPib: ${parseFloat(crescPib)}, inflacao: ${parseFloat(inflacao)}, desemprego: ${parseFloat(desemp)}, dividaPublica: ${parseFloat(div)}, mercado: ${parseFloat(merc)}, moeda: 'LOCAL', taxaJuro: ${parseFloat(taxa)}, balancaComercial: ${parseFloat(bal)} }`;
            });

        // Sort alphabetically
        DADOS.sort((a, b) => {
            const nameA = a.match(/nome: "([^"]+)"/)?.[1] || "";
            const nameB = b.match(/nome: "([^"]+)"/)?.[1] || "";
            return nameA.localeCompare(nameB);
        });

        let originalContent = fs.readFileSync(targetFile, 'utf8');

        const startIdx = originalContent.indexOf('export const DADOS_MUNDIAIS: DadosPais[] = [');
        const endIdx = originalContent.indexOf('export function getCorChoropleth');

        if (startIdx !== -1 && endIdx !== -1) {
            const topPart = originalContent.substring(0, startIdx);
            const bottomPart = originalContent.substring(endIdx);

            const newDADOSStr = `export const DADOS_MUNDIAIS: DadosPais[] = [\n${DADOS.join(',\n')}\n]\n\n`;

            fs.writeFileSync(targetFile, topPart + newDADOSStr + bottomPart);
            console.log('Successfully updated DADOS_MUNDIAIS with ' + DADOS.length + ' countries from World Atlas!');
        } else {
            console.log('Could not find markers', startIdx, endIdx);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
