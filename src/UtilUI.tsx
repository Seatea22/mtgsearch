export function waitForElm(selector: string, timeout = 10000): Promise<Element | null> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(selector);
        if (existing) {
            return resolve(existing);
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                cleanup();
                resolve(el);
            }
        });

        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`waitForElm: "${selector}" not found within ${timeout}ms`));
        }, timeout);

        function cleanup() {
            observer.disconnect();
            clearTimeout(timer);
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}