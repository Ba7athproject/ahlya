export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

if (!import.meta.env.VITE_API_URL) {
    console.warn("VITE_API_URL is not defined in import.meta.env. Using default: http://localhost:8000/api/v1");
} else {
    console.log("Using API_BASE_URL:", API_BASE_URL);
}
