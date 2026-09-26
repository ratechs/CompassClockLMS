import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthcontext } from '../../contexts/Authcontext';

export const useCourse = () => {
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState([]);
    const { AuthUser } = useAuthcontext();

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:2000';

            const res = await fetch(`/api/courses`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Important for sending cookies
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch courses');
            }

            const data = await res.json();
            setCourse(data);
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses(); // ✅ Only on component mount
    }, []); // ✅ Prevents infinite loop

    return { loading, course };
};
