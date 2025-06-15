import React, { createContext, useContext, useState, useCallback } from "react";

// Create the error context
const ErrorContext = createContext(null);

// Error provider component
export const ErrorProvider = ({ children }) => {
    const [error, setError] = useState(null);

    // Show error message
    const showError = useCallback((message, details = null) => {
        setError({
            message,
            details,
            timestamp: new Date().getTime()
        });

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setError(null);
        }, 5000);
    }, []);

    // Clear error message
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <ErrorContext.Provider value={{ error, showError, clearError }}>
            {children}
        </ErrorContext.Provider>
    );
};

// Custom hook to use the error context
export const useError = () => {
    const context = useContext(ErrorContext);
    if (context === null) {
        throw new Error("useError must be used within an ErrorProvider");
    }
    return context;
};

export default ErrorContext; 