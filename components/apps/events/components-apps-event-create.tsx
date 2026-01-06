'use client';
import React, { useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconX from '@/components/icon/icon-x';

interface EventFormData {
    title: string;
    tags: string;
    excerpt: string;
    paragraphs: string;
    displayDate: string;
    location: string;
    category: string;
    duration: string;
    knowMoreLink?: string;
    knowMoreLinkEnabled: boolean;
    status: 'upcoming' | 'completed';
    order: number;
}

const ComponentsAppsEventCreate = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [images, setImages] = useState<any>([]);
    const [additionalImages, setAdditionalImages] = useState<any>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        tags: '',
        excerpt: '',
        paragraphs: '',
        displayDate: '',
        location: '',
        category: '',
        duration: '',
        knowMoreLink: '',
        knowMoreLinkEnabled: true,
        status: 'upcoming',
        order: 0,
    });
    const [errors, setErrors] = useState<Partial<EventFormData>>({});

    const onImageChange = (imageList: ImageListType) => {
        setImages(imageList as never[]);
    };

    const onAdditionalImagesChange = (imageList: ImageListType) => {
        setAdditionalImages(imageList as never[]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof EventFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<EventFormData> = {};

        // Required field validations
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.tags || !formData.tags.trim()) {
            newErrors.tags = 'Tags are required';
        }

        if (!formData.excerpt || !formData.excerpt.trim()) {
            newErrors.excerpt = 'Excerpt is required';
        }

        if (!formData.displayDate) {
            newErrors.displayDate = 'Display date is required';
        }

        if (!formData.location || !formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.category || !formData.category.trim()) {
            newErrors.category = 'Category is required';
        }

        // Additional validations
        if (formData.title && formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        }

        if (formData.excerpt && formData.excerpt.trim().length < 10) {
            newErrors.excerpt = 'Excerpt must be at least 10 characters long';
        }

        if (formData.knowMoreLink && formData.knowMoreLink.trim() && !formData.knowMoreLink.match(/^https?:\/\/.+/)) {
            newErrors.knowMoreLink = 'Know more link must be a valid URL starting with http:// or https://';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken) {
            alert('You must be logged in to create an event');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(25);

        try {
            // Prepare FormData for multipart upload
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('title', formData.title);
            formDataToSend.append('excerpt', formData.excerpt);
            formDataToSend.append('paragraphs', JSON.stringify(formData.paragraphs.split('\n\n').filter((p) => p.trim())));
            formDataToSend.append('displayDate', formData.displayDate);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map((tag) => tag.trim())));
            formDataToSend.append('category', JSON.stringify(formData.category.split(',').map((cat) => cat.trim())));
            formDataToSend.append('knowMoreLink', formData.knowMoreLink || '');
            formDataToSend.append('knowMoreLinkEnabled', formData.knowMoreLinkEnabled.toString());
            formDataToSend.append('status', formData.status);
            formDataToSend.append('order', formData.order.toString());

            // Add main image file if selected
            if (images.length > 0) {
                formDataToSend.append('image', images[0].file);
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

            // Create event
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/events`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create event');
            }

            const result = await response.json();
            alert('Event created successfully!');
            router.push('/apps/events'); // Navigate back to events list
        } catch (error) {
            console.error('Error creating event:', error);
            alert(`Failed to create event: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
                    <h2 className="text-xl font-semibold">Create New Event</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter event title" value={formData.title} onChange={handleInputChange} required />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Featured Image */}
                <div>
                    <label className="block text-sm font-medium mb-2">Featured Image</label>
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
                        <ImageUploading value={additionalImages} onChange={onAdditionalImagesChange} maxNumber={10} dataURLKey="dataURL" multiple>
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
                    <p className="text-gray-500 text-sm mt-1">Upload additional images for the event (max 10)</p>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium mb-2">Tags *</label>
                    <input name="tags" type="text" className="form-input" placeholder="conference, technology, networking" value={formData.tags} onChange={handleInputChange} required />
                    <p className="text-gray-500 text-sm mt-1">Separate tags with commas</p>
                    {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
                </div>

                {/* Excerpt */}
                <div>
                    <label className="block text-sm font-medium mb-2">Excerpt *</label>
                    <textarea name="excerpt" className="form-textarea" rows={3} placeholder="Brief description of the event" value={formData.excerpt} onChange={handleInputChange} required />
                    {errors.excerpt && <p className="text-red-500 text-sm mt-1">{errors.excerpt}</p>}
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <textarea
                        name="paragraphs"
                        className="form-textarea"
                        rows={8}
                        placeholder="Write your event content here. Separate paragraphs with blank lines."
                        value={formData.paragraphs}
                        onChange={handleInputChange}
                    />
                    <p className="text-gray-500 text-sm mt-1">Separate paragraphs with blank lines</p>
                </div>

                {/* Display Date */}
                <div>
                    <label className="block text-sm font-medium mb-2">Display Date *</label>
                    <input name="displayDate" type="datetime-local" className="form-input" value={formData.displayDate} onChange={handleInputChange} required />
                    {errors.displayDate && <p className="text-red-500 text-sm mt-1">{errors.displayDate}</p>}
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium mb-2">Location *</label>
                    <input name="location" type="text" className="form-input" placeholder="Conference Center, New York" value={formData.location} onChange={handleInputChange} required />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium mb-2">Duration</label>
                    <input name="duration" type="text" className="form-input" placeholder="8 hours" value={formData.duration} onChange={handleInputChange} />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <input name="category" type="text" className="form-input" placeholder="conference, tech" value={formData.category} onChange={handleInputChange} required />
                    <p className="text-gray-500 text-sm mt-1">Separate categories with commas</p>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Know More Link */}
                <div>
                    <label className="block text-sm font-medium mb-2">Know More Link</label>
                    <input name="knowMoreLink" type="url" className="form-input" placeholder="https://event.com" value={formData.knowMoreLink} onChange={handleInputChange} />
                    {errors.knowMoreLink && <p className="text-red-500 text-sm mt-1">{errors.knowMoreLink}</p>}
                </div>

                {/* Know More Link Enabled */}
                <div className="flex items-center">
                    <input name="knowMoreLinkEnabled" type="checkbox" className="form-checkbox" id="knowMoreLinkEnabled" checked={formData.knowMoreLinkEnabled} onChange={handleInputChange} />
                    <label htmlFor="knowMoreLinkEnabled" className="ltr:ml-2 rtl:mr-2">
                        Enable Know More Link
                    </label>
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
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
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
                        {isSubmitting ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsEventCreate;
