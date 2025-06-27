// fetchWebflow.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// 1) Hit the Webflow API
const API_URL =
    'https://api.webflow.com/v2/collections/6827594dfcf4f6f6756d0ac7/items/live?offset=0&limit=100';
const TOKEN = '46274ed627db4d7af9cd40fded3f729886824b6918b58b663b735a02fbeca748';

async function buildGeoJSON() {
    const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Webflow API error: ${res.status}`);
    const { items } = await res.json();

    // 2) Transform into GeoJSON
    const features = items
        .map(item => {
            if (!item.fieldData.latitude) return null;
            const [lat, lng] = item.fieldData.latitude
                .split(',')
                .map(s => parseFloat(s.trim()));
            return {
                type: 'Feature',
                id: item.id,
                properties: {
                    storeid:  item.id,
                    name:     item.fieldData.name,
                    address:  item.fieldData.address,
                    excerpt:  item.fieldData['location-excerpt'],
                    infoHtml: item.fieldData.information,
                    image:    item.fieldData['main-image']?.url || '',
                    category: item.fieldData['category-2'],
                    slug:     item.fieldData.slug,
                },
                geometry: { type: 'Point', coordinates: [lng, lat] },
            };
        })
        .filter(Boolean);

    const geojson = { type: 'FeatureCollection', features };

    // 3) Write to disk under your public folder
    const outDir  = path.join(process.cwd(), 'public', 'data');
    const outPath = path.join(outDir, 'stores.json');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));

    console.log(`✅ GeoJSON written to ${outPath}`);
}

buildGeoJSON().catch(err => {
    console.error(err);
    process.exit(1);
});
