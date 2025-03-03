import { ReadonlyURLSearchParams } from "next/navigation";

const mapToUrlParms = (params: URLSearchParams): string => {
    return Array.from(params).map(([key, value]) => `${key}=${value}`).join("&");
}

// If the param already exists, replace it, keeping same order. Otherwise, add it
export const addKVToUrl = (currentUrl: string, currentSearchParams: ReadonlyURLSearchParams, key: string, value: string): string => {
    if (currentSearchParams.has(key)) {
        const newParams = new URLSearchParams(currentSearchParams);
        newParams.set(key, value);
        return `${currentUrl}?${mapToUrlParms(newParams)}`;
    }

    const newParams = new URLSearchParams(currentSearchParams);
    newParams.append(key, value);
    return `${currentUrl}?${mapToUrlParms(newParams)}`;
}