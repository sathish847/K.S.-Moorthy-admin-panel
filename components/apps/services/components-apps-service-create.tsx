'use client';
import React, { useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconX from '@/components/icon/icon-x';

interface ServiceFormData {
    title: string;
    paragraphs: string;
    status: 'active' | 'inactive';
    order: number;
}

const ComponentsAppsServiceCreate = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [images, setImages] = useState<any>([]);
    const [additionalImages, setAdditionalImages] = useState<any>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState<ServiceFormData>({
        title: '',
        paragraphs: '',
        status: 'active',
        order: 0,
    });
    const [errors, setErrors] = useState<Partial<ServiceFormData>>({});

    const onImageChange = (imageList: ImageListType) => {
        setImages(imageList as never[]);
    };

    const onAdditionalImagesChange = (imageList: ImageListType) => {
        setAdditionalImages(imageList as never[]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof ServiceFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<ServiceFormData> = {};

        // Required field validations
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.paragraphs || !formData.paragraphs.trim()) {
            newErrors.paragraphs = 'Description is required';
        }

        // Additional validations
        if (formData.title && formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        }

        if (formData.paragraphs && formData.paragraphs.trim().length < 10) {
            newErrors.paragraphs = 'Description must be at least 10 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken) {
            alert('You must be logged in to create a service');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(25);

        try {
            // Prepare FormData for multipart upload
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('title', formData.title);
            formDataToSend.append('paragraphs', JSON.stringify(formData.paragraphs.split('\n\n').filter((p) => p.trim())));
            formDataToSend.append('status', formData.status);
            formDataToSend.append('order', formData.order.toString());

            // Add main image file if selected
            if (images.length > 0) {
                formDataToSend.append('hero_image', images[0].file);
                setUploadProgress(50);
            }

            // Add additional images as separate files
            if (additionalImages.length > 0) {
                additionalImages.forEach((img: any, index: number) => {
                    if (img.file) {
                        formDataToSend.append('images', img.file);
                    }
                });
            }

            setUploadProgress(75);

            // Create service
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/services`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create service');
            }

            const result = await response.json();
            alert('Service created successfully!');
            router.push('/apps/services'); // Navigate back to services list
        } catch (error) {
            console.error('Error creating service:', error);
            alert(`Failed to create service: ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="btn btn-outline-secondary ltr:mr-3 rtl:ml-3">
                        <IconArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-xl font-semibold">Create New Service</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter service title" value={formData.title} onChange={handleInputChange} required />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Hero Image */}
                <div>
                    <label className="block text-sm font-medium mb-2">Hero Image</label>
                    <div className="custom-file-container">
                        <ImageUploading value={images} onChange={onImageChange} maxNumber={1} dataURLKey="dataURL">
                            {({ imageList, onImageUpload, onImageRemoveAll, onImageUpdate, onImageRemove, isDragging, dragProps }) => (
                                <div className="upload__image-wrapper">
                                    <button type="button" className="btn btn-outline-primary" onClick={onImageUpload}>
                                        Choose Image
                                    </button>
                                    {imageList.map((image, index) => (
                                        <div key={index} className="relative mt-4">
                                            <img src={image.dataURL} alt="preview" className="max-w-md rounded" />
                                            <button type="button" className="absolute top-2 right-2 btn btn-danger btn-sm" onClick={() => onImageRemove(index)}>
                                                <IconX className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ImageUploading>
                    </div>
                </div>

                {/* Additional Images */}
                <div>
                    <label className="block text-sm font-medium mb-2">Additional Images</label>
                    <div className="custom-file-container">
                        <ImageUploading value={additionalImages} onChange={onAdditionalImagesChange} maxNumber={4} dataURLKey="dataURL" multiple>
                            {({ imageList, onImageUpload, onImageRemoveAll, onImageUpdate, onImageRemove, isDragging, dragProps }) => (
                                <div className="upload__image-wrapper">
                                    <button type="button" className="btn btn-outline-primary" onClick={onImageUpload}>
                                        Choose Images
                                    </button>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                        {imageList.map((image, index) => (
                                            <div key={index} className="relative">
                                                <img src={image.dataURL} alt={`preview-${index}`} className="w-full h-32 object-cover rounded" />
                                                <button type="button" className="absolute top-2 right-2 btn btn-danger btn-sm" onClick={() => onImageRemove(index)}>
                                                    <IconX className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ImageUploading>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Upload additional images for the service (max 4)</p>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea
                        name="paragraphs"
                        className="form-textarea"
                        rows={8}
                        placeholder="Write your service description here. Separate paragraphs with blank lines."
                        value={formData.paragraphs}
                        onChange={handleInputChange}
                        required
                    />
                    <p className="text-gray-500 text-sm mt-1">Separate paragraphs with blank lines</p>
                    {errors.paragraphs && <p className="text-red-500 text-sm mt-1">{errors.paragraphs}</p>}
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

                {/* Progress Bar */}
                {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Service'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsServiceCreate;
