// import { db } from "@/lib/firebase";
// import { addDoc, collection, doc, setDoc } from "firebase/firestore";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//     try {
//         // Parse the JSON body from the request
//         const data = await request.json();

//         // Check if data is an array
//         if (!Array.isArray(data)) {
//             return NextResponse.json({ error: "Expected an array of objects" }, { status: 400 });
//         }

//         // Upload each item to Firestore under 'testdata/{id}'
//         const uploadPromises = data.map(async (item) => {
//             await addDoc(collection(db, "testdata"), item);
//         });

//         await Promise.all(uploadPromises);

//         return NextResponse.json({ message: "Data uploaded successfully" }, { status: 200 });
//     } catch (error) {
//         return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//     }
// }