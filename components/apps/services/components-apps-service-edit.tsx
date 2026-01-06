'use client';
import React, { useState, useEffect } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconX from '@/components/icon/icon-x';

interface ServiceFormData {
    title?: string;
    paragraphs?: string;
    images?: string;
    status?: 'active' | 'inactive';
    order?: number;
}

interface Service {
    _id: string;
    title: string;
    hero_image: string;
    images: string[];
    paragraphs: string[];
    status: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

const ComponentsAppsServiceEdit = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id as string;

    const [images, setImages] = useState<any>([]);
    const [additionalImages, setAdditionalImages] = useState<any>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [originalService, setOriginalService] = useState<Service | null>(null);
    const [formData, setFormData] = useState<ServiceFormData>({});
    const [errors, setErrors] = useState<Partial<ServiceFormData>>({});

    // Fetch service data for editing
    useEffect(() => {
        const fetchService = async () => {
            if (!session?.accessToken || !serviceId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/services/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch services');
                }

                const data = await response.json();
                const service = data.services.find((s: Service) => s._id === serviceId);

                if (service) {
                    setOriginalService(service);
                    setFormData({
                        title: service.title,
                        paragraphs: service.paragraphs ? service.paragraphs.join('\n\n') : '',
                        status: service.status as 'active' | 'inactive',
                        order: service.order || 0,
                    });

                    // Set existing image if available
                    if (service.hero_image) {
                        setImages([{ dataURL: service.hero_image, file: null }]);
                    }
                } else {
                    alert('Service not found');
                    router.push('/apps/services');
                }
            } catch (error) {
                console.error('Error fetching service:', error);
                alert('Failed to load service data');
                router.push('/apps/services');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [session?.accessToken, serviceId, router]);

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

        if (formData.title !== undefined && !formData.title.trim()) newErrors.title = 'Title is required';
        if (formData.paragraphs !== undefined && !formData.paragraphs.trim()) newErrors.paragraphs = 'Description is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken || !originalService) {
            alert('You must be logged in to update a service');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(25);

        try {
            // Prepare FormData for multipart upload - only include changed fields
            const formDataToSend = new FormData();

            // Check which fields have changed and add them
            if (formData.title !== undefined && formData.title !== originalService.title) {
                formDataToSend.append('title', formData.title);
            }

            if (formData.paragraphs !== undefined && formData.paragraphs !== (originalService.paragraphs ? originalService.paragraphs.join('\n\n') : '')) {
                formDataToSend.append('paragraphs', JSON.stringify(formData.paragraphs.split('\n\n').filter((p) => p.trim())));
            }

            if (formData.status !== undefined && formData.status !== originalService.status) {
                formDataToSend.append('status', formData.status);
            }

            if (formData.order !== undefined && formData.order !== originalService.order) {
                formDataToSend.append('order', formData.order.toString());
            }

            // Add main image file if a new one is selected (not just the existing preview)
            if (images.length > 0 && images[0].file) {
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

            // Only proceed if there are changes to send
            if (formDataToSend.entries().next().done) {
                alert('No changes detected');
                setIsSubmitting(false);
                setUploadProgress(0);
                return;
            }

            // Update service
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/services/${serviceId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update service');
            }

            const result = await response.json();
            alert('Service updated successfully!');
            router.push('/apps/services');
        } catch (error) {
            console.error('Error updating service:', error);
            alert(`Failed to update service: ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="panel">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading service data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="btn btn-outline-secondary ltr:mr-3 rtl:ml-3">
                        <IconArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-xl font-semibold">Edit Service</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter service title" value={formData.title || ''} onChange={handleInputChange} />
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
                                        Choose New Image
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
                    <p className="text-gray-500 text-sm mt-1">Leave empty to keep the current image</p>
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
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                        name="paragraphs"
                        className="form-textarea"
                        rows={8}
                        placeholder="Write your service description here. Separate paragraphs with blank lines."
                        value={formData.paragraphs || ''}
                        onChange={handleInputChange}
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
                        value={formData.order || 0}
                        onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                        min="0"
                    />
                    <p className="text-gray-500 text-sm mt-1">Lower numbers appear first (0, 1, 2, etc.)</p>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select name="status" className="form-select" value={formData.status || 'active'} onChange={handleInputChange}>
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
                        {isSubmitting ? 'Updating...' : 'Update Service'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsServiceEdit;
