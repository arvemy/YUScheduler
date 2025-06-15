import React from "react";
import { Alert, Snackbar, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useError } from "../contexts/ErrorContext";

const ErrorDisplay = () => {
    const { error, clearError } = useError();

    if (!error) {
        return null;
    }

    return (
        <Snackbar
            open={Boolean(error)}
            autoHideDuration={5000}
            onClose={clearError}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                severity="error"
                variant="filled"
                elevation={6}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={clearError}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            >
                {error.message}
            </Alert>
        </Snackbar>
    );
};

export default ErrorDisplay; 