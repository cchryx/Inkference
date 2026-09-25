"use client";

import { useEffect, useState } from "react";

/** Returns `value` only after it stops changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}
