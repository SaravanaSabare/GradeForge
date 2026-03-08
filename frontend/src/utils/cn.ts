import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge tailwind-like class strings, 
 * resolving conflicts predictably. Even though we rely on vanilla CSS,
 * this acts as a helper for dynamically toggling classes.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
