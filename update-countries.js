const https = require('https');
const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'lib/mocks/world-data.ts');

https.get('https://restcountries.com/v3.1/all', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const json = JSON.parse(data);
        const DADOS = json
            .filter(c => c.ccn3)
            .map(c => {
                // Deterministic pseudo-random generation based on char codes so it doesn't jump around on reload
                let hash = [...c.ccn3].reduce((acc, char) => acc + char.charCodeAt(0), 0);

                const pib = (hash % 80 + 2).toFixed(1);
                const crescPib = ((hash % 100) / 10 - 2).toFixed(1);
                const inflacao = ((hash * 7) % 20 + 0.5).toFixed(1);
                const desemp = ((hash * 3) % 15 + 2).toFixed(1);
                const div = ((hash * 13) % 140 + 20).toFixed(1);
                const merc = ((hash * 17) % 40 - 10).toFixed(1);
                const taxa = ((hash * 19) % 15).toFixed(2);
                const bal = ((hash * 23) % 20 - 10).toFixed(1);

                const moeda = c.currencies ? Object.keys(c.currencies)[0] : 'USD';
                const bandeira = c.flag ? c.flag : '';
                const nome = c.translations?.por?.common || c.name.common; // use portuguese if available

                return `  { iso3: ${JSON.stringify(c.ccn3)}, nome: ${JSON.stringify(nome)}, bandeira: ${JSON.stringify(bandeira)}, pib: ${parseFloat(pib)}, crescimentoPib: ${parseFloat(crescPib)}, inflacao: ${parseFloat(inflacao)}, desemprego: ${parseFloat(desemp)}, dividaPublica: ${parseFloat(div)}, mercado: ${parseFloat(merc)}, moeda: '${moeda}', taxaJuro: ${parseFloat(taxa)}, balancaComercial: ${parseFloat(bal)} }`;
            });

        // Sort alphabetically by name
        DADOS.sort((a, b) => {
            const nameA = a.match(/nome: "([^"]+)"/)?.[1] || "";
            const nameB = b.match(/nome: "([^"]+)"/)?.[1] || "";
            return nameA.localeCompare(nameB);
        });

        let originalContent = fs.readFileSync(targetFile, 'utf8');

        // Erase the old DADOS_MUNDIAIS array. It ends before export function getCorChoropleth
        const startIdx = originalContent.indexOf('export const DADOS_MUNDIAIS: DadosPais[] = [');
        const endIdx = originalContent.indexOf('export function getCorChoropleth');

        if (startIdx !== -1 && endIdx !== -1) {
            const topPart = originalContent.substring(0, startIdx);
            const bottomPart = originalContent.substring(endIdx);

            const newDADOSStr = `export const DADOS_MUNDIAIS: DadosPais[] = [\n${DADOS.join(',\n')}\n]\n\n`;

            const res = topPart + newDADOSStr + bottomPart;
            fs.writeFileSync(targetFile, res);
            console.log('Successfully updated DADOS_MUNDIAIS with ' + DADOS.length + ' countries!');
        } else {
            console.log('Could not find markers', startIdx, endIdx);
        }
    });
});
