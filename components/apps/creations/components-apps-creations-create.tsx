'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';

interface CreationFormData {
    title: string;
    category: string;
    status: 'active' | 'inactive';
    image: File | null;
    order: number;
}

const ComponentsAppsCreationsCreate = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const [formData, setFormData] = useState<CreationFormData>({
        title: '',
        category: '',
        status: 'active',
        image: null,
        order: 0,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof CreationFormData, string>>>({});

    // Fetch existing categories
    useEffect(() => {
        const fetchCategories = async () => {
            if (!session?.accessToken) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/works/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const categories = Array.from(new Set((data.works || []).map((item: any) => item.category).filter(Boolean))) as string[];
                    setExistingCategories(categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [session?.accessToken]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof CreationFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        setFormData((prev) => ({
            ...prev,
            image: file,
        }));

        // Create preview
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }

        // Clear error
        if (errors.image) {
            setErrors((prev) => ({
                ...prev,
                image: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreationFormData, string>> = {};

        // Required field validations
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.category || !formData.category.trim()) {
            newErrors.category = 'Category is required';
        }

        if (!formData.image) {
            newErrors.image = 'Image is required';
        }

        // Additional validations
        if (formData.title && formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        }

        if (formData.category && formData.category.trim().length < 2) {
            newErrors.category = 'Category must be at least 2 characters long';
        }

        // Image validation
        if (formData.image) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(formData.image.type)) {
                newErrors.image = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (formData.image.size > maxSize) {
                newErrors.image = 'Image size must be less than 5MB';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken) {
            alert('You must be logged in to create a creation');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('order', formData.order.toString());
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/works`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create creation');
            }

            const result = await response.json();
            alert('Creation created successfully!');
            router.push('/apps/creations');
        } catch (error) {
            console.error('Error creating creation:', error);
            alert(`Failed to create creation: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
                    <h2 className="text-xl font-semibold">Create New Creation</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter creation title" value={formData.title} onChange={handleInputChange} required />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <input
                        name="category"
                        type="text"
                        className="form-input"
                        placeholder="Enter category (e.g., Web Development, Design)"
                        value={formData.category}
                        onChange={handleInputChange}
                        list="category-list"
                        required
                    />
                    <datalist id="category-list">
                        {existingCategories.map((category) => (
                            <option key={category} value={category} />
                        ))}
                    </datalist>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2">Image *</label>
                    <input name="image" type="file" accept="image/*" className="form-input" onChange={handleFileChange} required />
                    <p className="text-gray-500 text-sm mt-1">Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB</p>
                    {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Preview:</p>
                            <img src={imagePreview} alt="Preview" className="max-w-xs max-h-48 object-cover rounded-lg border" />
                        </div>
                    )}
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
                        {isSubmitting ? 'Creating...' : 'Create Creation'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsCreationsCreate;
