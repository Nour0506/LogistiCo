import axios from 'axios';

const geocodeCache = new Map();
let lastGeocodeTime = 0;

export const getExactCoordinates = async (address, name, options = {}) => {
    const { country = 'Tunisia', rateLimit = 1000 } = options;
    const cleanAddress = address.trim().toLowerCase();
    
    if (geocodeCache.has(cleanAddress)) {
        return geocodeCache.get(cleanAddress);
    }

    const now = Date.now();
    const delay = Math.max(0, rateLimit - (now - lastGeocodeTime));
    await new Promise(resolve => setTimeout(resolve, delay));
    lastGeocodeTime = Date.now();

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                format: 'json',
                q: `${address}, ${country}`,
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'Your App Name'
            }
        });

        if (!response.data?.length) {
            throw new Error('Address not found');
        }

        const coords = [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat)
        ];

        geocodeCache.set(cleanAddress, coords);
        return coords;

    } catch (error) {
        console.error(`Geocoding failed for "${name}" (${address}):`, error.message);
        throw error;
    }
};
export default getExactCoordinates;