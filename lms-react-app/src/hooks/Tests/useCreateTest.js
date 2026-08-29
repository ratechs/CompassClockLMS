// hooks/Tests/useCreateTest.js
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useCreateTests = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const createTest = async (testData) => {
        setLoading(true);
        try {
            const res = await fetch('/api/tests/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(testData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create test');
            }

            toast.success('Test created successfully!');
            navigate('/instructor/tests');
            return data;
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error(error.message || 'Failed to create test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createTest, loading };
};

export const updateTest = async (id, testData) => {
    try {
        // Remove created_by from update payload
        const { created_by, ...updatePayload } = testData;

        const res = await fetch(`/api/tests/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updatePayload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to update test');
        }

        toast.success('Test updated successfully!');
        return data;
    } catch (error) {
        console.error('Error updating test:', error);
        toast.error(error.message || 'Failed to update test');
        throw error;
    }
};