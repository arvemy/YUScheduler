import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000, // 15 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add request handling here (e.g., add auth tokens)
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor with retry logic
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const { config, response } = error;

        // Skip retry for client errors except 429 (rate limit)
        if (response && response.status >= 400 && response.status < 500 && response.status !== 429) {
            return Promise.reject(error);
        }

        // Set up retry count
        config.retryCount = config.retryCount || 0;

        // Check if we should retry
        const shouldRetry = config.retryCount < MAX_RETRIES;

        if (shouldRetry) {
            config.retryCount += 1;

            // Exponential backoff delay
            const delay = RETRY_DELAY * Math.pow(2, config.retryCount - 1);

            // Wait for the delay and retry
            await new Promise((resolve) => setTimeout(resolve, delay));
            return api(config);
        }

        return Promise.reject(error);
    }
);

// API endpoints
export const apiService = {
    getTerms: async () => {
        try {
            const response = await api.get("/api/terms");
            return response.data;
        } catch (error) {
            handleApiError("Failed to fetch terms", error);
            throw error;
        }
    },

    getCourses: async (term) => {
        try {
            const response = await api.get(`/api/courses?term=${encodeURIComponent(term)}`);
            return response.data;
        } catch (error) {
            handleApiError(`Failed to fetch courses for term ${term}`, error);
            throw error;
        }
    },

    getSections: async (term) => {
        try {
            const response = await api.get(`/api/sections?term=${encodeURIComponent(term)}`);
            return response.data;
        } catch (error) {
            handleApiError(`Failed to fetch sections for term ${term}`, error);
            throw error;
        }
    },

    generateSchedule: async (data) => {
        try {
            const response = await api.post("/api/generate_schedule", data);
            return response.data;
        } catch (error) {
            handleApiError("Failed to generate schedule", error);
            throw error;
        }
    },

    healthCheck: async () => {
        try {
            const response = await api.get("/health");
            return response.data;
        } catch (error) {
            handleApiError("Health check failed", error);
            throw error;
        }
    },
};

// Helper function to handle API errors
function handleApiError(message, error) {
    let errorMessage = message;

    if (error.response) {
        // The server responded with an error status (4xx, 5xx)
        if (error.response.data && error.response.data.error) {
            errorMessage = `${message}: ${error.response.data.error}`;
        } else {
            errorMessage = `${message}: Server error (${error.response.status})`;
        }
    } else if (error.request) {
        // The request was made but no response was received
        errorMessage = `${message}: No response from server`;
    } else {
        // Something else happened while setting up the request
        errorMessage = `${message}: ${error.message}`;
    }

    console.error(errorMessage, error);

    // Return standardized error object
    return {
        message: errorMessage,
        originalError: error,
        status: error.response ? error.response.status : null,
    };
}

export default apiService; 