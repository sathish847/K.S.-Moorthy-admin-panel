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

const ComponentsAppsServices = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchService, setSearchService] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // Fetch services from API
    useEffect(() => {
        const fetchServices = async () => {
            if (!session?.accessToken) {
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
                // Sort services by order ascending, then by createdAt descending
                const sortedServices = (data.services || []).sort((a: Service, b: Service) => {
                    if (a.order !== b.order) {
                        return a.order - b.order;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setServices(sortedServices);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch services');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [session?.accessToken]);

    // Filter services by search and status
    const filteredServices = services.filter((service) => {
        const matchesSearch = service.title.toLowerCase().includes(searchService.toLowerCase());
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentServices = filteredServices.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchService, statusFilter]);

    const handleNewService = () => {
        router.push('/apps/services/create');
    };

    const handleViewService = (service: Service) => {
        setSelectedService(service);
        setViewModalOpen(true);
    };

    const handleEditService = (serviceId: string) => {
        router.push(`/apps/services/edit/${serviceId}`);
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }

        if (!session?.accessToken) {
            alert('You must be logged in to delete a service');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete service');
            }

            // Refresh the services list
            const fetchServices = async () => {
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
                    // Sort services by order ascending, then by createdAt descending
                    const sortedServices = (data.services || []).sort((a: Service, b: Service) => {
                        if (a.order !== b.order) {
                            return a.order - b.order;
                        }
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setServices(sortedServices);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch services');
                }
            };

            await fetchServices();
            alert('Service deleted successfully!');
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Failed to delete service. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="material-icons text-primary text-2xl">build</span>
                    <h2 className="text-xl font-semibold ltr:ml-3 rtl:mr-3">What I Create</h2>
                </div>
                <button className="btn btn-primary" onClick={handleNewService}>
                    <IconPlus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Service
                </button>
            </div>

            <div className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input type="text" className="form-input ltr:!pr-10 rtl:!pl-10" placeholder="Search services..." value={searchService} onChange={(e) => setSearchService(e.target.value)} />
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
                        <p className="mt-4 text-gray-500">Loading services...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-red-400">error</span>
                        <h3 className="mt-4 text-lg font-medium text-red-600">Error loading services</h3>
                        <p className="mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {currentServices.map((service) => (
                                <div key={service._id} className="panel">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-primary">{service.title}</h3>
                                                <span className={`badge ${service.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{service.status}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                {service.paragraphs && service.paragraphs.length > 0 ? service.paragraphs[0].substring(0, 150) + '...' : 'No description available'}
                                            </p>
                                            {service.hero_image && (
                                                <div className="mt-3">
                                                    <img src={service.hero_image} alt={service.title} className="w-32 h-20 object-cover rounded" />
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
                                                        <button type="button" onClick={() => handleViewService(service)}>
                                                            <IconEye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            View
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" onClick={() => handleEditService(service._id)}>
                                                            <IconEdit className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            Edit
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="text-danger" onClick={() => handleDeleteService(service._id)}>
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
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredServices.length)} of {filteredServices.length} services
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

                {filteredServices.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-gray-400">build</span>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No services found</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search terms or status filter.</p>
                    </div>
                )}
            </div>

            {/* View Service Modal */}
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
                                        <div className="text-lg font-bold">Service Details</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setViewModalOpen(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {selectedService && (
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h1 className="text-2xl font-bold text-primary mb-2">{selectedService.title}</h1>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                            <span className={`badge ${selectedService.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                                {selectedService.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hero Image */}
                                                {selectedService.hero_image && (
                                                    <div className="mb-6">
                                                        <img src={selectedService.hero_image} alt={selectedService.title} className="w-full max-h-96 object-cover rounded-lg" />
                                                    </div>
                                                )}

                                                {/* Description */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                                    {selectedService.paragraphs && selectedService.paragraphs.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {selectedService.paragraphs.map((paragraph, index) => (
                                                                <p key={index} className="text-gray-700 dark:text-gray-300">
                                                                    {paragraph}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 italic">No description available</p>
                                                    )}
                                                </div>

                                                {/* Additional Images */}
                                                {selectedService.images && selectedService.images.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Additional Images</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {selectedService.images.map((img, index) => (
                                                                <img key={index} src={img} alt={`Service image ${index + 1}`} className="w-full h-32 object-cover rounded" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedService.order}</div>
                                                        <div className="text-sm text-gray-500">Display Order</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedService.paragraphs ? selectedService.paragraphs.length : 0}</div>
                                                        <div className="text-sm text-gray-500">Paragraphs</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedService.images ? selectedService.images.length : 0}</div>
                                                        <div className="text-sm text-gray-500">Images</div>
                                                    </div>
                                                </div>

                                                {/* Timestamps */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                                        <div>
                                                            <span className="font-medium">Created:</span> {new Date(selectedService.createdAt).toLocaleString()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Updated:</span> {new Date(selectedService.updatedAt).toLocaleString()}
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

export default ComponentsAppsServices;
