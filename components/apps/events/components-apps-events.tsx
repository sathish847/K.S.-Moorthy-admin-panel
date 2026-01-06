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

interface Event {
    _id: string;
    title: string;
    tags: string[];
    image: string;
    excerpt: string;
    displayDate: string;
    location: string;
    category: string[];
    status: string;
    images: string[];
    duration: string;
    knowMoreLink: string;
    knowMoreLinkEnabled: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

const ComponentsAppsEvents = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchEvent, setSearchEvent] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            if (!session?.accessToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/events/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch events');
                }

                const data = await response.json();
                // Sort events by order ascending, then by createdAt descending
                const sortedEvents = (data.events || []).sort((a: Event, b: Event) => {
                    if (a.order !== b.order) {
                        return a.order - b.order;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setEvents(sortedEvents);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [session?.accessToken]);

    // Filter events by search and status
    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchEvent.toLowerCase()) ||
            event.excerpt.toLowerCase().includes(searchEvent.toLowerCase()) ||
            event.location.toLowerCase().includes(searchEvent.toLowerCase());

        const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentEvents = filteredEvents.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchEvent, statusFilter]);

    const handleNewEvent = () => {
        router.push('/apps/events/create');
    };

    const handleViewEvent = (event: Event) => {
        setSelectedEvent(event);
        setViewModalOpen(true);
    };

    const handleEditEvent = (eventId: string) => {
        router.push(`/apps/events/edit/${eventId}`);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        if (!session?.accessToken) {
            alert('You must be logged in to delete an event');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            // Refresh the events list
            const fetchEvents = async () => {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/api/events/admin/all`, {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch events');
                    }

                    const data = await response.json();
                    // Sort events by order ascending, then by createdAt descending
                    const sortedEvents = (data.events || []).sort((a: Event, b: Event) => {
                        if (a.order !== b.order) {
                            return a.order - b.order;
                        }
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    setEvents(sortedEvents);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch events');
                }
            };

            await fetchEvents();
            alert('Event deleted successfully!');
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="material-icons text-primary text-2xl">event</span>
                    <h2 className="text-xl font-semibold ltr:ml-3 rtl:mr-3">Moments</h2>
                </div>
                <button className="btn btn-primary" onClick={handleNewEvent}>
                    <IconPlus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Event
                </button>
            </div>

            <div className="mt-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input type="text" className="form-input ltr:!pr-10 rtl:!pl-10" placeholder="Search events..." value={searchEvent} onChange={(e) => setSearchEvent(e.target.value)} />
                        <div className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
                            <IconSearch />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Status:</label>
                        <select className="form-select w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading events...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-red-400">error</span>
                        <h3 className="mt-4 text-lg font-medium text-red-600">Error loading events</h3>
                        <p className="mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {currentEvents.map((event) => (
                                <div key={event._id} className="panel">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                                                <span className={`badge ${event.status === 'upcoming' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{event.status}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">{event.excerpt}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span>📅 {new Date(event.displayDate).toLocaleDateString()}</span>
                                                <span>📍 {event.location}</span>
                                                <span className="badge badge-outline-primary">{event.category.join(', ')}</span>
                                            </div>
                                            {event.image && (
                                                <div className="mt-3">
                                                    <img src={event.image} alt={event.title} className="w-32 h-20 object-cover rounded" />
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
                                                        <button type="button" onClick={() => handleViewEvent(event)}>
                                                            <IconEye className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            View
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" onClick={() => handleEditEvent(event._id)}>
                                                            <IconEdit className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                                                            Edit
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="text-danger" onClick={() => handleDeleteEvent(event._id)}>
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
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
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

                {filteredEvents.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <span className="material-icons mx-auto text-6xl text-gray-400">event</span>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No events found</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search terms or status filter.</p>
                    </div>
                )}
            </div>

            {/* View Event Modal */}
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
                                        <div className="text-lg font-bold">Event Details</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setViewModalOpen(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {selectedEvent && (
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h1 className="text-2xl font-bold text-primary mb-2">{selectedEvent.title}</h1>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                            <span>📅 {new Date(selectedEvent.displayDate).toLocaleDateString()}</span>
                                                            <span>📍 {selectedEvent.location}</span>
                                                            <span className={`badge ${selectedEvent.status === 'upcoming' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                                {selectedEvent.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Featured Image */}
                                                {selectedEvent.image && (
                                                    <div className="mb-6">
                                                        <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full max-h-96 object-cover rounded-lg" />
                                                    </div>
                                                )}

                                                {/* Excerpt */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                                    <p className="text-gray-700 dark:text-gray-300">{selectedEvent.excerpt}</p>
                                                </div>

                                                {/* Duration */}
                                                {selectedEvent.duration && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Duration</h3>
                                                        <p className="text-gray-700 dark:text-gray-300">{selectedEvent.duration}</p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedEvent.tags.map((tag, index) => (
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
                                                        {selectedEvent.category && selectedEvent.category.length > 0 ? (
                                                            selectedEvent.category.map((cat, index) => (
                                                                <span key={index} className="badge badge-outline-primary px-3 py-1">
                                                                    {cat}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-500 italic">No categories assigned</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Know More Link */}
                                                {selectedEvent.knowMoreLinkEnabled && selectedEvent.knowMoreLink && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Know More Link</h3>
                                                        <a href={selectedEvent.knowMoreLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                            {selectedEvent.knowMoreLink}
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Additional Images */}
                                                {selectedEvent.images && selectedEvent.images.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Additional Images</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {selectedEvent.images.map((img, index) => (
                                                                <img key={index} src={img} alt={`Event image ${index + 1}`} className="w-full h-32 object-cover rounded" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedEvent.order}</div>
                                                        <div className="text-sm text-gray-500">Display Order</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedEvent.tags.length}</div>
                                                        <div className="text-sm text-gray-500">Tags</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedEvent.category.length}</div>
                                                        <div className="text-sm text-gray-500">Categories</div>
                                                    </div>
                                                </div>

                                                {/* Timestamps */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                                        <div>
                                                            <span className="font-medium">Created:</span> {new Date(selectedEvent.createdAt).toLocaleString()}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Updated:</span> {new Date(selectedEvent.updatedAt).toLocaleString()}
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

export default ComponentsAppsEvents;
