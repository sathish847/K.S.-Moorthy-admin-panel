'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface LoginFormData {
    email: string;
    password: string;
}

const ComponentsAuthLoginForm = () => {
    const router = useRouter();
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else if (result?.ok) {
                // Wait a moment for session to be established
                setTimeout(() => {
                    router.push('/apps/creations');
                }, 100);
            }
        } catch (err) {
            setError('An error occurred');
        }
    };

    return (
        <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div>
                <label htmlFor="Email">Email</label>
                <div className="relative text-white-dark">
                    <input id="Email" type="email" placeholder="Enter Email" className="form-input ps-10 placeholder:text-white-dark" {...register('email', { required: 'Email is required' })} />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconMail fill={true} />
                    </span>
                </div>
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
            </div>
            <div>
                <label htmlFor="Password">Password</label>
                <div className="relative text-white-dark">
                    <input
                        id="Password"
                        type="password"
                        placeholder="Enter Password"
                        className="form-input ps-10 placeholder:text-white-dark"
                        {...register('password', { required: 'Password is required' })}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                </div>
                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
            </div>

            <button
                type="submit"
                style={{ color: 'white' }}
                disabled={isSubmitting}
                className="btn bg-[#ED2629] !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] disabled:opacity-50"
            >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
    );
};

export default ComponentsAuthLoginForm;
