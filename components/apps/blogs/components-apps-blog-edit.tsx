'use client';
import React, { useState, useEffect } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconX from '@/components/icon/icon-x';

interface BlogFormData {
    title: string;
    tags: string;
    shortDescription: string;
    paragraphs: string;
    category: string;
    mediumLink?: string;
    mediumLinkEnabled: boolean;
    status: 'active' | 'inactive';
    order: number;
}

interface Blog {
    _id: string;
    title: string;
    tags: string[];
    image: string;
    shortDescription: string;
    paragraphs: string[];
    category: string[];
    isPublished: boolean;
    author: {
        _id: string;
        name: string;
        email: string;
    };
    views: number;
    likes: string[];
    mediumLink: string;
    mediumLinkEnabled: boolean;
    status: string;
    slug: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

const ComponentsAppsBlogEdit = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const blogId = params.id as string;

    const [images, setImages] = useState<any>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<BlogFormData>({
        title: '',
        tags: '',
        shortDescription: '',
        paragraphs: '',
        category: '',
        mediumLink: '',
        mediumLinkEnabled: true,
        status: 'active',
        order: 0,
    });
    const [errors, setErrors] = useState<Partial<BlogFormData>>({});

    // Fetch blog data for editing
    useEffect(() => {
        const fetchBlog = async () => {
            if (!session?.accessToken || !blogId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/blogs/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch blogs');
                }

                const data = await response.json();
                const blog = data.blogs.find((b: Blog) => b._id === blogId);

                if (blog) {
                    setFormData({
                        title: blog.title,
                        tags: blog.tags.join(', '),
                        shortDescription: blog.shortDescription,
                        paragraphs: blog.paragraphs.join('\n\n'),
                        category: blog.category.join(', '),
                        mediumLink: blog.mediumLink || '',
                        mediumLinkEnabled: blog.mediumLinkEnabled,
                        status: blog.status as 'active' | 'inactive',
                        order: blog.order || 0,
                    });

                    // Set existing image if available
                    if (blog.image) {
                        setImages([{ dataURL: blog.image, file: null }]);
                    }
                } else {
                    alert('Blog not found');
                    router.push('/apps/blogs');
                }
            } catch (error) {
                console.error('Error fetching blog:', error);
                alert('Failed to load blog data');
                router.push('/apps/blogs');
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [session?.accessToken, blogId, router]);

    const onImageChange = (imageList: ImageListType) => {
        setImages(imageList as never[]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof BlogFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<BlogFormData> = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.tags.trim()) newErrors.tags = 'Tags are required';
        if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
        if (!formData.paragraphs.trim()) newErrors.paragraphs = 'Content is required';
        if (!formData.category.trim()) newErrors.category = 'Category is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!session?.accessToken) {
            alert('You must be logged in to update a blog');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(25);

        try {
            // Prepare FormData for multipart upload
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('title', formData.title);
            formDataToSend.append('shortDescription', formData.shortDescription);
            formDataToSend.append('paragraphs', JSON.stringify(formData.paragraphs.split('\n\n').filter((p) => p.trim())));
            formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map((tag) => tag.trim())));
            formDataToSend.append('category', JSON.stringify(formData.category.split(',').map((cat) => cat.trim())));
            formDataToSend.append('mediumLink', formData.mediumLink || '');
            formDataToSend.append('mediumLinkEnabled', formData.mediumLinkEnabled.toString());
            formDataToSend.append('status', formData.status);
            formDataToSend.append('order', formData.order.toString());

            // Add image file if a new one is selected (not just the existing preview)
            if (images.length > 0 && images[0].file) {
                formDataToSend.append('image', images[0].file);
                setUploadProgress(75);
            } else {
                setUploadProgress(50);
            }

            // Update blog
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/blogs/${blogId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formDataToSend,
            });

            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update blog');
            }

            const result = await response.json();
            alert('Blog updated successfully!');
            router.push('/apps/blogs');
        } catch (error) {
            console.error('Error updating blog:', error);
            alert(`Failed to update blog: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
                    <p className="mt-4 text-gray-500">Loading blog data...</p>
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
                    <h2 className="text-xl font-semibold">Edit Blog</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input name="title" type="text" className="form-input" placeholder="Enter blog title" value={formData.title} onChange={handleInputChange} required />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2">Featured Image</label>
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

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium mb-2">Tags *</label>
                    <input name="tags" type="text" className="form-input" placeholder="technology, web development, javascript" value={formData.tags} onChange={handleInputChange} required />
                    <p className="text-gray-500 text-sm mt-1">Separate tags with commas</p>
                    {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
                </div>

                {/* Short Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Short Description *</label>
                    <textarea
                        name="shortDescription"
                        className="form-textarea"
                        rows={3}
                        placeholder="Brief description of the blog post"
                        value={formData.shortDescription}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium mb-2">Content *</label>
                    <textarea
                        name="paragraphs"
                        className="form-textarea"
                        rows={8}
                        placeholder="Write your blog content here. Separate paragraphs with blank lines."
                        value={formData.paragraphs}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.paragraphs && <p className="text-red-500 text-sm mt-1">{errors.paragraphs}</p>}
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <input name="category" type="text" className="form-input" placeholder="tutorial, javascript, react" value={formData.category} onChange={handleInputChange} required />
                    <p className="text-gray-500 text-sm mt-1">Separate categories with commas</p>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Medium Link */}
                <div>
                    <label className="block text-sm font-medium mb-2">Medium Link</label>
                    <input name="mediumLink" type="url" className="form-input" placeholder="https://medium.com/@username/blog-post" value={formData.mediumLink} onChange={handleInputChange} />
                    {errors.mediumLink && <p className="text-red-500 text-sm mt-1">{errors.mediumLink}</p>}
                </div>

                {/* Medium Link Enabled */}
                <div className="flex items-center">
                    <input name="mediumLinkEnabled" type="checkbox" className="form-checkbox" id="mediumLinkEnabled" checked={formData.mediumLinkEnabled} onChange={handleInputChange} />
                    <label htmlFor="mediumLinkEnabled" className="ltr:ml-2 rtl:mr-2">
                        Enable Medium Link
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
                        {isSubmitting ? 'Updating...' : 'Update Blog'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComponentsAppsBlogEdit;
