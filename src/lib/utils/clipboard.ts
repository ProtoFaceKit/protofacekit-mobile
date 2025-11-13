export function copyToClipboard(text: string) {
    if (!navigator.clipboard) {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed"; // Prevent scrolling
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand("copy");
            console.log("Copied to clipboard!");
        } catch (err) {
            console.error("Fallback: Unable to copy", err);
        }
        document.body.removeChild(textarea);
        return;
    }

    navigator.clipboard
        .writeText(text)
        .then(() => {
            console.log("Copied to clipboard!");
        })
        .catch((err) => {
            console.error("Async: Could not copy text: ", err);
        });
}
