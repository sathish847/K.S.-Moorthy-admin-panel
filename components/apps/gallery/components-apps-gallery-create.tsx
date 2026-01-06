'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';

interface GalleryFormData {
    title: string;
    description: string;
    youtubeUrl: string;
    status: 'active' | 'inactive';
    order: number;
}

const ComponentsAppsGalleryCreate = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<GalleryFormData>({
        title: '',
        description: '',
        youtubeUrl: '',
        status: 'active',
        order: 0,
    });
    const [errors, setErrors] = useState<Partial<GalleryFormData>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof GalleryFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<GalleryFormData> = {};

        // Required field validations
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.youtubeUrl || !formData.youtubeUrl.trim()) {
            newErrors.youtubeUrl = 'YouTube URL or Instagram link is required';
        }

        // Additional validations
        if (formData.title && formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        }

        if (formData.description && formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters long';
        }

        if (
            formData.youtubeUrl &&
            !(
                formData.youtubeUrl.match(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/) ||
                formData.youtubeUrl.match(/^https?:\/\/(www\.)?youtu\.be\//) ||
                formData.youtubeUrl.match(/^https?:\/\/(www\.)?youtube\.com\/embed\//) ||
                formData.youtubeUrl.match(/^https?:\/\/(www\.)?instagram\.com\/(p\/|reel\/|tv\/)[^\/\?]+/)
            )
        ) {
            newErrors.youtubeUrl = 'Please provide a valid YouTube URL or Instagram link';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken) {
            alert('You must be logged in to create a gallery item');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/gallery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create gallery item');
            }

            const result = await response.json();
            alert('Gallery item created successfully!');
            router.push('/apps/gallery');
        } catch (error) {
            console.error('Error creating gallery item:', error);
            alert(`Failed to create gallery item: ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="btn btn-outline-secondary ltr:mr-3 rtl:ml-3">
                        <IconArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-xl font-semibold">Create New Gallery Item</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter gallery item title" value={formData.title} onChange={handleInputChange} required />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea name="description" className="form-textarea" rows={4} placeholder="Describe the gallery item" value={formData.description} onChange={handleInputChange} required />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* YouTube URL */}
                <div>
                    <label className="block text-sm font-medium mb-2">YouTube URL or Instagram Link *</label>
                    <input
                        name="youtubeUrl"
                        type="url"
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://instagram.com/p/POST_ID"
                        value={formData.youtubeUrl}
                        onChange={handleInputChange}
                        required
                    />
                    <p className="text-gray-500 text-sm mt-1">Enter a valid YouTube URL or Instagram link</p>
                    {errors.youtubeUrl && <p className="text-red-500 text-sm mt-1">{errors.youtubeUrl}</p>}
                </div>

                {/* Display Order */}
                <div>
                    <label className="block text-sm font-medium mb-2">Display Order</label>
                    <input
                        name="order"
                        type="number"
                        className="form-input"
                        placeholder="0"
                        value={formData.order}
                        onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                        min="0"
                    />
                    <p className="text-gray-500 text-sm mt-1">Lower numbers appear first (0, 1, 2, etc.)</p>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    <select name="status" className="form-select" value={formData.status} onChange={handleInputChange} required>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Gallery Item'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsGalleryCreate;
