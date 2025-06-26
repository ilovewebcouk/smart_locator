/**
 * Cloud Function: webflowToGeoJSON
 */
exports.webflowToGeoJSON = async (req, res) => {
    // Allow any origin
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');

    try {
        // Fetch your Webflow CMS items
        const wfRes = await fetch(
            'https://api.webflow.com/v2/collections/6827594dfcf4f6f6756d0ac7/items/live?offset=0&limit=100',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer 1193c1cb3de815373967020c3a54df9b1a8cd972a3828ad0ececf181f09bdad3',
                    'accept': 'application/json'
                }
            }
        );
        const body = await wfRes.json();

        // Build GeoJSON features
        const features = body.items
            .map(item => {
                const latLng = item.fieldData.latitude;
                if (!latLng) return null;
                const [latStr, lngStr] = latLng.split(',').map(s => s.trim());
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
                        category: item.fieldData['category-2']
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lngStr), parseFloat(latStr)]
                    }
                };
            })
            .filter(f => f);

        // Return as GeoJSON
        res.status(200).json({ type: 'FeatureCollection', features });
    } catch (err) {
        console.error('Webflow fetch error:', err);
        res.status(500).send('Internal Server Error');
    }
};