'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import IconPlus from '@/components/icon/icon-plus';
import IconSearch from '@/components/icon/icon-search';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import Dropdown from '@/components/dropdown';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { IRootState } from '@/store';
import { useSelector } from 'react-redux';

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

const ComponentsAppsBlogs = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchBlog, setSearchBlog] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // Fetch blogs from API
    useEffect(() => {
        const fetchBlogs = async () => {
            if (!session?.accessToken) {
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
                // Sort blogs by order ascending, then by createdAt descending
                const sortedBlogs = (data.blogs || []).sort((a: Blog, b: Blog) => {
                    if (a.order !== b.order) {
                        return a.order - b.order;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setBlogs(sortedBlogs);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch blogs');
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, [session?.accessToken]);

    // Filter blogs by search and status
    const filteredBlogs = blogs.filter((blog) => {
        const matchesSearch =
            blog.title.toLowerCase().includes(searchBlog.toLowerCase()) ||
            blog.shortDescription.toLowerCase().includes(searchBlog.toLowerCase()) ||
            blog.author.name.toLowerCase().includes(searchBlog.toLowerCase());

        const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchBlog, statusFilter]);

    const handleNewBlog = () => {
        router.push('/apps/blogs/create');
    };

    const handleViewBlog = (blog: Blog) => {
        setSelectedBlog(blog);
        setViewModalOpen(true);
    };

    const handleEditBlog = (blogId: string) => {
        router.push(`/apps/blogs/edit/${blogId}`);
    };

    const handleDeleteBlog = async (blogId: string) => {
        if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
            return;
        }

        if (!session?.accessToken) {
            alert('You must be logged in to delete a blog');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/blogs/${blogId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete blog');
            }

            // Refresh the blogs list
            const fetchBlogs = async () => {
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
                    // Sort blogs by order ascending, then by createdAt descending
                    const sortedBlogs = (data.blogs || []).sort((a: Blog, b: Blog) => {
                        if (a.order !== b.order) {
                            return a.order - b.order;
                        }
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setBlogs(sortedBlogs);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch blogs');
                }
            };

            await fetchBlogs();
            alert('Blog deleted successfully!');
        } catch (error) {
            console.error('Error deleting blog:', error);
            alert('Failed to delete blog. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="material-icons text-primary text-2xl">article</span>
                    <h2 className="text-xl font-semibold ltr:ml-3 rtl:mr-3">Thoughts</h2>
                </div>
                <button className="btn btn-primary" onClick={handleNewBlog}>
                    <IconPlus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Blog Post
                </button>
            </div>

            <div className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input type="text" className="form-input ltr:!pr-10 rtl:!pl-10" placeholder="Search blogs..." value={searchBlog} onChange={(e) => setSearchBlog(e.target.value)} />
                        <div className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
                            <IconSearch />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Status:</label>
                        <select className="form-select w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading blogs...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-red-400">error</span>
                        <h3 className="mt-4 text-lg font-medium text-red-600">Error loading blogs</h3>
                        <p className="mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {currentBlogs.map((blog) => (
                                <div key={blog._id} className="panel">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-primary">{blog.title}</h3>
                                                <span className={`badge ${blog.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{blog.status}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">{blog.shortDescription}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span>By {blog.author.name}</span>
                                                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                                                <span className="badge badge-outline-primary">{blog.category.join(', ')}</span>
                                            </div>
                                            {blog.image && (
                                                <div className="mt-3">
                                                    <img src={blog.image} alt={blog.title} className="w-32 h-20 object-cover rounded" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="dropdown">
                                            <Dropdown
                                                offset={[0, 5]}
                                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                                btnClassName="align-middle"
                                                button={<IconHorizontalDots className="rotate-90 opacity-70" />}
                                            >
                                                <ul className="whitespace-nowrap">
                                                    <li>
                                                        <button type="button" onClick={() => handleViewBlog(blog)}>
                                                            <IconEye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            View
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" onClick={() => handleEditBlog(blog._id)}>
                                                            <IconEdit className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            Edit
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="text-danger" onClick={() => handleDeleteBlog(blog._id)}>
                                                            <IconTrash className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            Delete
                                                        </button>
                                                    </li>
                                                </ul>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredBlogs.length)} of {filteredBlogs.length} blogs
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn btn-outline-secondary">
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                            if (pageNum > totalPages) return null;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline-secondary'} w-10 h-10 p-0`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn btn-outline-secondary">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {filteredBlogs.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-gray-400">article</span>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No blogs found</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search terms or status filter.</p>
                    </div>
                )}
            </div>

            {/* View Blog Modal */}
            <Transition appear show={viewModalOpen} as={Fragment}>
                <Dialog as="div" open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel as="div" className="panel my-8 w-full max-w-4xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <div className="text-lg font-bold">Blog Details</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setViewModalOpen(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {selectedBlog && (
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h1 className="text-2xl font-bold text-primary mb-2">{selectedBlog.title}</h1>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                            <span>By {selectedBlog.author.name}</span>
                                                            <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
                                                            <span className={`badge ${selectedBlog.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                                {selectedBlog.status}
                                                            </span>
                                                            <span className="font-medium">Status: {selectedBlog.status === 'active' ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Featured Image */}
                                                {selectedBlog.image && (
                                                    <div className="mb-6">
                                                        <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full max-h-96 object-cover rounded-lg" />
                                                    </div>
                                                )}

                                                {/* Short Description */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                                    <p className="text-gray-700 dark:text-gray-300">{selectedBlog.shortDescription}</p>
                                                </div>

                                                {/* Content */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Content</h3>
                                                    <div className="space-y-4">
                                                        {selectedBlog.paragraphs.map((paragraph, index) => (
                                                            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                                {paragraph}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tags */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedBlog.tags.map((tag, index) => (
                                                            <span key={index} className="badge badge-outline-primary">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Categories */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Categories</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedBlog.category && selectedBlog.category.length > 0 ? (
                                                            selectedBlog.category.map((cat, index) => (
                                                                <span key={index} className="badge badge-outline-primary px-3 py-1">
                                                                    {cat}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-500 italic">No categories assigned</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Medium Link */}
                                                {selectedBlog.mediumLinkEnabled && selectedBlog.mediumLink && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Medium Link</h3>
                                                        <a href={selectedBlog.mediumLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                            {selectedBlog.mediumLink}
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedBlog.order}</div>
                                                        <div className="text-sm text-gray-500">Display Order</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedBlog.tags.length}</div>
                                                        <div className="text-sm text-gray-500">Tags</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedBlog.category.length}</div>
                                                        <div className="text-sm text-gray-500">Categories</div>
                                                    </div>
                                                </div>

                                                {/* Timestamps */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                                        <div>
                                                            <span className="font-medium">Created:</span> {new Date(selectedBlog.createdAt).toLocaleString()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Updated:</span> {new Date(selectedBlog.updatedAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-primary" onClick={() => setViewModalOpen(false)}>
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ComponentsAppsBlogs;
