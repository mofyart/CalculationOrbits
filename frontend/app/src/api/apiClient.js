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
    getHistory: async () => await fetch(
        API_ENDPOINTS.getHisotry,
        {
            'method': 'GET',
        },
    ),
};

export default astroService;