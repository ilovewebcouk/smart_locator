// server.js
import express from 'express';
import cors    from 'cors';
import fetch   from 'node-fetch';

const app = express();
const PORT = 3000;

// 1) Enable CORS for your map
app.use(cors());

// 2) Webflow API settings
const API_URL =
    'https://api.webflow.com/v2/collections/6827594dfcf4f6f6756d0ac7/items/live?offset=0&limit=100';
const API_TOKEN = '46274ed627db4d7af9cd40fded3f729886824b6918b58b663b735a02fbeca748';

// 3) Proxy endpoint
app.get('/api/locations', async (_req, res) => {
    try {
        const wfRes = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                accept:        'application/json',
            },
        });
        const { items } = await wfRes.json();

        // Build GeoJSON
        const features = items
            .map(item => {
                const latlng = item.fieldData.latitude;
                if (!latlng) return null;
                const [lat, lng] = latlng.split(',').map(s => parseFloat(s.trim()));
                return {
                    type: 'Feature',
                    id:   item.id,
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

        res.json({ type: 'FeatureCollection', features });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Proxy error' });
    }
});

// 4) Start the server
app.listen(PORT, () => {
    console.log(`Proxy listening at http://localhost:${PORT}/api/locations`);
});
