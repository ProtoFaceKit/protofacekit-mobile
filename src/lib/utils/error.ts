export function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        error.message !== undefined &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    return "Unknown error";
}

export function toastErrorMessage(title: string) {
    return (error: unknown) => {
        console.error(title, error);
        return `${title}: ${getErrorMessage(error)}`;
    };
}
