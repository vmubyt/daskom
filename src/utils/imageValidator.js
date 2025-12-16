
/**
 * Validates the aspect ratio of an image file or URL.
 * @param {File|string} source - The image file object or URL string.
 * @param {number} expectedRatio - The expected width/height ratio (e.g. 1 or 16/9).
 * @param {number} tolerance - Allowed deviation from the ratio (default 0.05).
 * @returns {Promise<boolean>} - Resolves true if valid. Rejects with Error if invalid.
 */
export const validateImageAspectRatio = (source, expectedRatio, tolerance = 0.05) => {
    return new Promise((resolve, reject) => {
        if (!source) {
            reject(new Error("No image source provided"));
            return;
        }

        const img = new Image();

        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const ratio = width / height;
            const diff = Math.abs(ratio - expectedRatio);

            if (diff <= tolerance) {
                resolve(true);
            } else {
                const ratioName = expectedRatio === 1 ? "1:1 (Square)" : "16:9";
                reject(new Error(`Product images must be square (1:1 aspect ratio).`));
                // Note: The specific error message request differs per type, 
                // but we can generate a generic one or pass context.
                // Re-reading request: 
                // Product: "Product images must be square (1:1 aspect ratio)."
                // Slider: "Slider images must use a 16:9 aspect ratio."

                // Let's customize the error based on ratio for simplicity here
                if (Math.abs(expectedRatio - 1) < 0.01) {
                    reject(new Error("Product images must be square (1:1 aspect ratio)."));
                } else {
                    reject(new Error("Slider images must use a 16:9 aspect ratio."));
                }
            }
        };

        img.onerror = () => {
            // If URL simple fails to load, maybe don't block? 
            // Or reject? "Validation... must occur".
            // If it's a file, it should load. If URL, it might be 404.
            reject(new Error("Failed to load image for validation."));
        };

        if (typeof source === 'string') {
            img.src = source;
        } else if (source instanceof File) {
            img.src = URL.createObjectURL(source);
        } else {
            reject(new Error("Invalid source type"));
        }
    });
};
