import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// Month mapping: "January" → 0, ..., "December" → 11
const monthIndexMap: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11,
};

const toRad = (value: number) => (value * Math.PI) / 180;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Convert custom month/day (e.g. May + 2) into season index (0–35)
function toSeasonIndex(month: string, day: number): number {
    const mIndex = monthIndexMap[month];
    return mIndex * 3 + (day - 1);
}

// Check if two ranges (startA–endA, startB–endB) overlap
function seasonOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart <= bEnd && aEnd >= bStart;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const lat = parseFloat(searchParams.get("latitude") || "");
        const lon = parseFloat(searchParams.get("longitude") || "");
        const radius = parseFloat(searchParams.get("radius") || "0");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("limit") || "10");
        const startMonth = searchParams.get("startMonth");
        const startDay = parseInt(searchParams.get("startDay") || "");
        const endMonth = searchParams.get("endMonth");
        const endDay = parseInt(searchParams.get("endDay") || "");

        if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
            return NextResponse.json({ error: "Invalid coordinates or radius" }, { status: 400 });
        }

        const latDelta = radius / 111;
        const lonDelta = radius / (111 * Math.cos(toRad(lat)));

        const minLat = lat - latDelta;
        const maxLat = lat + latDelta;
        const minLon = lon - lonDelta;
        const maxLon = lon + lonDelta;

        const baseQuery = query(
            collection(db, "testdata"),
            where("Location Latitude", ">=", minLat),
            where("Location Latitude", "<=", maxLat),
            where("Location Longitude", ">=", minLon),
            where("Location Longitude", "<=", maxLon)
        );

        const snapshot = await getDocs(baseQuery);

        const userStartIndex = (startMonth && !isNaN(startDay)) ? toSeasonIndex(startMonth, startDay) : null;
        const userEndIndex = (endMonth && !isNaN(endDay)) ? toSeasonIndex(endMonth, endDay) : null;

        const allDocs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((doc: any) => {
                const dLat = doc["Location Latitude"];
                const dLon = doc["Location Longitude"];
                return haversineDistance(lat, lon, dLat, dLon) <= radius;
            })
            .filter((doc: any) => {
                if (userStartIndex !== null && userEndIndex !== null) {
                    const docStartMonth = doc["Start Month"];
                    const docStartDay = doc["Start Day"];
                    const docEndMonth = doc["End Month"];
                    const docEndDay = doc["End Day"];

                    if (!monthIndexMap[docStartMonth] || !monthIndexMap[docEndMonth]) return false;

                    const docStartIndex = toSeasonIndex(docStartMonth, docStartDay);
                    const docEndIndex = toSeasonIndex(docEndMonth, docEndDay);

                    return seasonOverlap(docStartIndex, docEndIndex, userStartIndex, userEndIndex);
                }
                return true;
            });

        const totalItems = allDocs.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const paginated = allDocs.slice((page - 1) * pageSize, page * pageSize);

        return NextResponse.json({
            data: paginated,
            meta: {
                totalItems,
                totalPages,
                page,
                pageSize,
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred." },
            { status: 500 }
        );
    }
}
