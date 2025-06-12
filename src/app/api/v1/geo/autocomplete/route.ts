import { NextRequest, NextResponse } from "next/server";
import { Suggestion } from "@/app/types/types";

interface Feature {
    type: string,
    properties: {
        country: string,
        country_code: string,
        state: string,
        state_code: string,
        city: string,
        postcode: string,
        street: string,
        lon: number,
        lat: number,
        housenumber: string,
        formatted: string
    },
    bbox: number[]
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        
        const text = searchParams.get("text")
        // const limit = searchParams.get("limit")

        if (text === null) {
            return NextResponse.json({ message: "text parameter required" }, { status: 400 })
        }

        const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&apiKey=${process.env.GEOAPIFY_API_KEY}&filter=countrycode:us&limit=10`, {
            method: "GET"
        })
        const data = await res.json();
        const features = data.features as Feature[];
        const cleanedFeatures = features.filter(feature => feature.properties.formatted.toLowerCase().startsWith(text.toLowerCase()))
        const suggestions = cleanedFeatures.map(feature => {
            const suggestion: Suggestion = {
                country: feature.properties.country,
                state: feature.properties.state,
                city: feature.properties.city,
                zip: feature.properties.postcode,
                street: feature.properties.street,
                houseNumber: feature.properties.housenumber,
                formatted: feature.properties.formatted,
                longitude: feature.properties.lon,
                latitude: feature.properties.lat
            }
            return suggestion
        });

        const limitedSuggestions = suggestions.slice(0, 5);
        
        return NextResponse.json({ message: "Successfully Returned Suggestions", suggestions: limitedSuggestions }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error, message: "Interal Server Error" }, { status: 500 })
    }
}