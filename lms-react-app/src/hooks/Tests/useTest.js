import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useTests = () => {
    const [loading, setLoading] = useState(false);
    const [tests, setTests] = useState(null);
    const [error, setError] = useState(null);

    const fetchTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/tests/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch tests');
            }

            setTests(data);
        } catch (error) {
            console.error('Error fetching tests:', error);
            setError(error);
            toast.error(error.message || 'Failed to fetch tests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    return { loading, tests, error, refetch: fetchTests };
};