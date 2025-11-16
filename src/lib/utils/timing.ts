export function sleep(duration: number, abort?: AbortController) {
    return new Promise((resolve, reject) => {
        let resolved = false;

        const timeoutHandle = setTimeout(() => {
            resolved = true;
            resolve(undefined);
        }, duration);

        if (abort) {
            abort.signal.addEventListener("abort", () => {
                if (resolved) return;
                clearTimeout(timeoutHandle);
                reject();
            });
        }
    });
}
