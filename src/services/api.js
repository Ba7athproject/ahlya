const API_URL = "http://localhost:8000/api/v1";

export async function fetchNationalStats() {
    const res = await fetch(`${API_URL}/stats/national`);
    if (!res.ok) throw new Error("Failed to fetch national stats");
    return res.json();
}

export async function fetchWilayaStats(wilaya) {
    const res = await fetch(`${API_URL}/stats/wilayas/${encodeURIComponent(wilaya)}`);
    if (!res.ok) throw new Error("Failed to fetch wilaya stats");
    return res.json();
}

export async function fetchCompanies(filters = {}) {
    const params = new URLSearchParams();
    if (filters.wilaya) params.append("wilaya", filters.wilaya);
    if (filters.group) params.append("group", filters.group);
    if (filters.type) params.append("type", filters.type);
    if (filters.search) params.append("search", filters.search);
    if (filters.limit) params.append("limit", filters.limit);

    const res = await fetch(`${API_URL}/companies/?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch companies");
    return res.json();
}

export async function fetchWilayaRisk(wilaya) {
    const res = await fetch(`${API_URL}/risk/wilayas/${encodeURIComponent(wilaya)}`);
    if (!res.ok) throw new Error("Failed to fetch wilaya risk");
    return res.json();
}

export async function fetchAllWilayasRisk() {
    const res = await fetch(`${API_URL}/risk/wilayas`);
    if (!res.ok) throw new Error("Failed to fetch risks");
    return res.json();
}

export async function fetchCompanyOsintLinks(companyId) {
    const res = await fetch(`${API_URL}/companies/${companyId}/osint_links`);
    if (!res.ok) throw new Error("Failed to fetch OSINT links");
    return res.json();
}

// --- Enrichment API ---

export const saveEnrichment = async (data) => {
    try {
        console.log("Saving enrichment payload:", JSON.stringify(data, null, 2));
        const res = await fetch(`${API_URL}/enrichment/manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => null);
            console.error("Enrichment save failed:", res.status, JSON.stringify(errorBody, null, 2));
            throw new Error('Failed to save enrichment');
        }
        return await res.json();
    } catch (error) {
        console.error("Error saving enrichment:", error);
        return null;
    }
};

export const getEnrichedProfile = async (companyId) => {
    try {
        const res = await fetch(`${API_URL}/enrichment/profile/${companyId}`);
        if (!res.ok) {
            if (res.status === 404) return null; // Not enriched yet
            throw new Error('Failed to fetch profile');
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

export const checkEnrichmentStatus = async (companyId) => {
    try {
        const res = await fetch(`${API_URL}/enrichment/status/${companyId}`);
        if (!res.ok) throw new Error('Failed to check status');
        return await res.json();
    } catch (error) {
        console.error("Error checking status:", error);
        return { is_enriched: false };
    }
};
