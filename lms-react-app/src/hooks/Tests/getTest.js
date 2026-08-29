import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthcontext } from '../../contexts/Authcontext';

export const useGetTests = ({id}) => {
    const [loading, setLoading] = useState(false);
    const [tests, setTests] = useState([]);
    const { authUser } = useAuthcontext();
    console.log('authUser', id);
    const fetchTest = async () => {
        console.log('Fetching test data...', id);
        
        setLoading(true);
        try {
            const res = await fetch(`/api/tests/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                  
                },
                credentials: 'include', 
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message);
            }

            const data = await res.json();
            if (data) {
                setLoading(false);
            }
            setTests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTest(); 
        
    },[]); 

    return { loading, tests };
};
