// ===== USE LOCAL STORAGE HOOK =====
// Type-safe localStorage with SSR support and sync across tabs.

"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
    // Track if we've loaded from localStorage
    const [isLoaded, setIsLoaded] = useState(false);

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
        setIsLoaded(true);
    }, [key]);

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage - uses functional updates
    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setStoredValue((prev) => {
                try {
                    // Allow value to be a function so we have same API as useState
                    const valueToStore = value instanceof Function ? value(prev) : value;

                    if (typeof window !== "undefined") {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    }
                    return valueToStore;
                } catch (error) {
                    console.warn(`Error setting localStorage key "${key}":`, error);
                    return prev;
                }
            });
        },
        [key]
    );

    // Sync across tabs including deletions
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                if (e.newValue === null) {
                    // Key was deleted, reset to initial
                    setStoredValue(initialValue);
                } else {
                    try {
                        setStoredValue(JSON.parse(e.newValue));
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [key, initialValue]);

    return [storedValue, setValue, isLoaded];
}

