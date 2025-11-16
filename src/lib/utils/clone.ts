export function deepClone<T>(value: T, hash = new WeakMap()): T {
    // Return primitive types and functions directly
    if (value === null || typeof value !== "object") {
        return value;
    }

    // Handle cyclic references
    if (hash.has(value)) {
        return hash.get(value) as T;
    }

    // Handle Date
    if (value instanceof Date) {
        return new Date(value.getTime()) as T;
    }

    // Handle RegExp
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as T;
    }

    if (value instanceof Map) {
        const result = new Map();
        hash.set(value, result);
        value.forEach((v, k) => {
            result.set(deepClone(k, hash), deepClone(v, hash));
        });
        return result as unknown as T;
    }

    if (value instanceof Set) {
        const result = new Set();
        hash.set(value, result);
        value.forEach((v) => result.add(deepClone(v, hash)));
        return result as unknown as T;
    }

    if (Array.isArray(value)) {
        const result: any[] = [];
        hash.set(value, result);
        value.forEach((item, index) => {
            result[index] = deepClone(item, hash);
        });
        return result as unknown as T;
    }

    // Handle plain objects
    const result: Record<string, any> = {};
    hash.set(value, result);
    Object.keys(value).forEach((key) => {
        result[key] = deepClone((value as Record<string, any>)[key], hash);
    });

    return result as T;
}
