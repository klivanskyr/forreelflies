'use client';

import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';
import { useVendor } from '@/hooks/useVendor';
import { useState } from 'react';

export default function TestAuthPage() {
    const { data: session } = useSession();
    const { user } = useUser();
    const { vendor, loading, error, isApprovedVendor } = useVendor();
    const [debugData, setDebugData] = useState<any>(null);
    const [debugLoading, setDebugLoading] = useState(false);

    const fetchDebugData = async () => {
        setDebugLoading(true);
        try {
            const response = await fetch('/api/v1/debug-user');
            const data = await response.json();
            setDebugData(data);
        } catch (error) {
            console.error('Error fetching debug data:', error);
            setDebugData({ error: 'Failed to fetch debug data' });
        } finally {
            setDebugLoading(false);
        }
    };

    const refreshSession = async () => {
        try {
            await fetch('/api/v1/refresh-session', { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
            
            <div className="space-y-4 mb-6">
                <button 
                    onClick={fetchDebugData}
                    disabled={debugLoading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {debugLoading ? 'Loading...' : 'Fetch Debug Data'}
                </button>
                
                <button 
                    onClick={refreshSession}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
                >
                    Refresh Session
                </button>
            </div>
            
            <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold">Session Data:</h2>
                    <pre className="text-sm mt-2">{JSON.stringify(session, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold">User Context:</h2>
                    <pre className="text-sm mt-2">{JSON.stringify(user, null, 2)}</pre>
                </div>
                
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold">Vendor Data:</h2>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Error: {error || 'None'}</p>
                    <p>Is Approved Vendor: {isApprovedVendor ? 'Yes' : 'No'}</p>
                    <pre className="text-sm mt-2">{JSON.stringify(vendor, null, 2)}</pre>
                </div>
                
                {debugData && (
                    <div className="bg-gray-100 p-4 rounded">
                        <h2 className="font-semibold">Debug Data (Server-side):</h2>
                        <pre className="text-sm mt-2">{JSON.stringify(debugData, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
} 