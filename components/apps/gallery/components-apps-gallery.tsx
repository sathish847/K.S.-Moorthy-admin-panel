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

interface GalleryItem {
    _id: string;
    title: string;
    description: string;
    youtubeUrl: string;
    status: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

const ComponentsAppsGallery = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchGallery, setSearchGallery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // Helper function to extract YouTube video ID from various URL formats
    const getYouTubeVideoId = (url: string): string => {
        const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/, /youtube\.com\/v\/([^&\n?#]+)/];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // If no pattern matches, return the URL as is (fallback)
        return url;
    };

    // Helper function to check if URL is YouTube
    const isYouTubeUrl = (url: string): boolean => {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url);
    };

    // Helper function to check if URL is Instagram
    const isInstagramUrl = (url: string): boolean => {
        return /^https?:\/\/(www\.)?instagram\.com\/(p\/|reel\/|tv\/)/.test(url);
    };

    // Helper function to get Instagram embed URL
    const getInstagramEmbedUrl = (url: string): string => {
        // Convert Instagram URL to embed format
        const match = url.match(/instagram\.com\/(p|reel|tv)\/([^\/\?]+)/);
        if (match) {
            return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
        }
        return url;
    };

    // Fetch gallery items from API
    useEffect(() => {
        const fetchGalleryItems = async () => {
            if (!session?.accessToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/gallery/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch gallery items');
                }

                const data = await response.json();
                // Sort gallery items by order ascending, then by createdAt descending
                const sortedGalleryItems = (data.gallery || []).sort((a: GalleryItem, b: GalleryItem) => {
                    if (a.order !== b.order) {
                        return a.order - b.order;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setGalleryItems(sortedGalleryItems);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch gallery items');
            } finally {
                setLoading(false);
            }
        };

        fetchGalleryItems();
    }, [session?.accessToken]);

    // Filter gallery items by search and status
    const filteredGalleryItems = galleryItems.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(searchGallery.toLowerCase()) || item.description.toLowerCase().includes(searchGallery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredGalleryItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentGalleryItems = filteredGalleryItems.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchGallery, statusFilter]);

    const handleNewGalleryItem = () => {
        router.push('/apps/gallery/create');
    };

    const handleViewGalleryItem = (item: GalleryItem) => {
        setSelectedGalleryItem(item);
        setViewModalOpen(true);
    };

    const handleEditGalleryItem = (itemId: string) => {
        router.push(`/apps/gallery/edit/${itemId}`);
    };

    const handleDeleteGalleryItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this gallery item? This action cannot be undone.')) {
            return;
        }

        if (!session?.accessToken) {
            alert('You must be logged in to delete a gallery item');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/gallery/${itemId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete gallery item');
            }

            // Refresh the gallery items list
            const fetchGalleryItems = async () => {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/gallery/admin/all`, {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch gallery items');
                    }

                    const data = await response.json();
                    // Sort gallery items by order ascending, then by createdAt descending
                    const sortedGalleryItems = (data.gallery || []).sort((a: GalleryItem, b: GalleryItem) => {
                        if (a.order !== b.order) {
                            return a.order - b.order;
                        }
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setGalleryItems(sortedGalleryItems);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch gallery items');
                }
            };

            await fetchGalleryItems();
            alert('Gallery item deleted successfully!');
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            alert('Failed to delete gallery item. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="material-icons text-primary text-2xl">video_library</span>
                    <h2 className="text-xl font-semibold ltr:ml-3 rtl:mr-3">Visual Diary</h2>
                </div>
                <button className="btn btn-primary" onClick={handleNewGalleryItem}>
                    <IconPlus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Gallery Item
                </button>
            </div>

            <div className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="form-input ltr:!pr-10 rtl:!pl-10"
                            placeholder="Search gallery items..."
                            value={searchGallery}
                            onChange={(e) => setSearchGallery(e.target.value)}
                        />
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
                        <p className="mt-4 text-gray-500">Loading gallery items...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-red-400">error</span>
                        <h3 className="mt-4 text-lg font-medium text-red-600">Error loading gallery items</h3>
                        <p className="mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {currentGalleryItems.map((item) => (
                                <div key={item._id} className="panel">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                                                <span className={`badge ${item.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{item.status}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span>Media URL: {item.youtubeUrl}</span>
                                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
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
                                                        <button type="button" onClick={() => handleViewGalleryItem(item)}>
                                                            <IconEye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            View
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" onClick={() => handleEditGalleryItem(item._id)}>
                                                            <IconEdit className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            Edit
                                                        </button>
                                                    </li>

                                                    <li>
                                                        <button type="button" className="text-danger" onClick={() => handleDeleteGalleryItem(item._id)}>
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
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredGalleryItems.length)} of {filteredGalleryItems.length} gallery items
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

                {filteredGalleryItems.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-gray-400">video_library</span>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No gallery items found</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search terms or status filter.</p>
                    </div>
                )}
            </div>

            {/* View Gallery Item Modal */}
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
                                        <div className="text-lg font-bold">Gallery Item Details</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setViewModalOpen(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {selectedGalleryItem && (
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h1 className="text-2xl font-bold text-primary mb-2">{selectedGalleryItem.title}</h1>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                            <span className={`badge ${selectedGalleryItem.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                                {selectedGalleryItem.status}
                                                            </span>
                                                            <span className="font-medium">Status: {selectedGalleryItem.status === 'active' ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Media Embed */}
                                                {selectedGalleryItem.youtubeUrl && (
                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-semibold mb-2">Media</h3>
                                                        <div className="aspect-video">
                                                            {isYouTubeUrl(selectedGalleryItem.youtubeUrl) ? (
                                                                <iframe
                                                                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedGalleryItem.youtubeUrl)}`}
                                                                    title={selectedGalleryItem.title}
                                                                    className="w-full h-full rounded-lg"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : isInstagramUrl(selectedGalleryItem.youtubeUrl) ? (
                                                                <iframe
                                                                    src={getInstagramEmbedUrl(selectedGalleryItem.youtubeUrl)}
                                                                    title={selectedGalleryItem.title}
                                                                    className="w-full h-full rounded-lg"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                                    <p className="text-gray-500">Unsupported media format</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Description */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                                    <p className="text-gray-700 dark:text-gray-300">{selectedGalleryItem.description}</p>
                                                </div>

                                                {/* Media URL */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Media URL</h3>
                                                    <a href={selectedGalleryItem.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        {selectedGalleryItem.youtubeUrl}
                                                    </a>
                                                </div>

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedGalleryItem.order}</div>
                                                        <div className="text-sm text-gray-500">Display Order</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedGalleryItem.status === 'active' ? 'Active' : 'Inactive'}</div>
                                                        <div className="text-sm text-gray-500">Status</div>
                                                    </div>
                                                </div>

                                                {/* Timestamps */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                                        <div>
                                                            <span className="font-medium">Created:</span> {new Date(selectedGalleryItem.createdAt).toLocaleString()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Updated:</span> {new Date(selectedGalleryItem.updatedAt).toLocaleString()}
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

export default ComponentsAppsGallery;
