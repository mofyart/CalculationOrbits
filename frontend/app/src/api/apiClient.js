import { API_ENDPOINTS } from "./endpoints";

export const astroService = {
    getOrbitData: async (data) => await fetch(
        API_ENDPOINTS.getOrbitData,
        {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        },
),
};

export default astroService;