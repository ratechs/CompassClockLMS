import React from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthcontext } from '../contexts/Authcontext';

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const { setAuthUser } = useAuthcontext();

    const login = async (usernameOrEmail, password, lastLogin) => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/sign_in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ usernameOrEmail, password, lastLogin }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await res.json();

            localStorage.setItem('lms-user', JSON.stringify(data));
            setAuthUser(data);
            toast.success('Logged in successfully');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, login };
};