const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL || "http://localhost:8010/api/v1";
    // Remove trailing slash if present to avoid double slashes when checking
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // Append /api/v1 if not present
    if (!url.endsWith('/api/v1')) {
        url += '/api/v1';
    }
    return url;
};

export const API_BASE_URL = getApiUrl();

if (!import.meta.env.VITE_API_URL) {
    console.warn("VITE_API_URL is not defined in import.meta.env. Using default: http://localhost:8010/api/v1");
} else {
    console.log("Using API_BASE_URL:", API_BASE_URL);
}
