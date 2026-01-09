'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';

interface GalleryFormData {
    title_en: string;
    description_en: string;
    title_ta: string;
    description_ta: string;
    status: 'active' | 'inactive';
    image: File | null;
    order: number;
    link: string;
}

const ComponentsAppsCreationsCreate = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<GalleryFormData>({
        title_en: '',
        description_en: '',
        title_ta: '',
        description_ta: '',
        status: 'active',
        image: null,
        order: 0,
        link: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof GalleryFormData, string>>>({});

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
        const newErrors: Partial<Record<keyof GalleryFormData, string>> = {};

        // Required field validations
        if (!formData.title_en || !formData.title_en.trim()) {
            newErrors.title_en = 'English title is required';
        }

        if (!formData.description_en || !formData.description_en.trim()) {
            newErrors.description_en = 'English description is required';
        }

        if (!formData.image) {
            newErrors.image = 'Image is required';
        }

        // Additional validations
        if (formData.title_en && formData.title_en.trim().length < 3) {
            newErrors.title_en = 'English title must be at least 3 characters long';
        }

        if (formData.description_en && formData.description_en.trim().length < 10) {
            newErrors.description_en = 'English description must be at least 10 characters long';
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
            alert('You must be logged in to create a gallery item');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title_en', formData.title_en);
            formDataToSend.append('description_en', formData.description_en);
            formDataToSend.append('title_ta', formData.title_ta);
            formDataToSend.append('description_ta', formData.description_ta);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('order', formData.order.toString());
            formDataToSend.append('link', formData.link);
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/gallery`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create gallery item');
            }

            const result = await response.json();
            alert('Gallery item created successfully!');
            router.push('/apps/creations');
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
                    <button onClick={() => router.back()} className="btn ltr:mr-3 rtl:ml-3" style={{ backgroundColor: '#805DCA', color: 'white', border: '1px solid #805DCA' }}>
                        <IconArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-xl font-semibold">Create New Gallery Item</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* English Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">English Title *</label>
                    <input name="title_en" type="text" className="form-input" placeholder="Enter title in English" value={formData.title_en} onChange={handleInputChange} required />
                    {errors.title_en && <p className="text-red-500 text-sm mt-1">{errors.title_en}</p>}
                </div>

                {/* English Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">English Description *</label>
                    <textarea
                        name="description_en"
                        className="form-textarea"
                        rows={4}
                        placeholder="Enter description in English"
                        value={formData.description_en}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.description_en && <p className="text-red-500 text-sm mt-1">{errors.description_en}</p>}
                </div>

                {/* Tamil Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">தமிழ் தலைப்பு (Tamil Title)</label>
                    <input name="title_ta" type="text" className="form-input" placeholder="தலைப்பை தமிழில் உள்ளீடு செய்யவும்" value={formData.title_ta} onChange={handleInputChange} />
                </div>

                {/* Tamil Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">தமிழ் விளக்கம் (Tamil Description)</label>
                    <textarea
                        name="description_ta"
                        className="form-textarea"
                        rows={4}
                        placeholder="விளக்கத்தை தமிழில் உள்ளீடு செய்யவும்"
                        value={formData.description_ta}
                        onChange={handleInputChange}
                    />
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

                {/* Navigation Link */}
                <div>
                    <label className="block text-sm font-medium mb-2">Navigation Link</label>
                    <input name="link" type="url" className="form-input" placeholder="https://example.com/navigation-link" value={formData.link} onChange={handleInputChange} />
                    <p className="text-gray-500 text-sm mt-1">Optional navigation link for the gallery item</p>
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

export default ComponentsAppsCreationsCreate;
