'use client';

import { PageSize, Sort, Layout } from "@/app/types/types";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { FaTh, FaList } from "react-icons/fa";

export default function ShopHeader({ sort, pageSize, layout }: { sort: Sort, pageSize: PageSize, layout: Layout }) {
    const router = useRouter();
    const currentUrl = usePathname();
    const currentSearchParams = useSearchParams();
    
    const [searchQuery, setSearchQuery] = useState(currentSearchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(currentSearchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(currentSearchParams.get('tag') || '');
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const sortOptions = [
        { label: "Latest", value: "latest" },
        { label: "Oldest", value: "oldest" },
        { label: "Price: Low to High", value: "priceLowToHigh" },
        { label: "Price: High to Low", value: "priceHighToLow" }
    ]

    const pageSizeOptions = [
        { label: "12", value: "12" },
        { label: "24", value: "24" },
        { label: "48", value: "48" },
        { label: "All", value: "-1" }
    ]

    // Fetch available categories and tags
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await fetch('/api/v1/product/filters');
                if (response.ok) {
                    const data = await response.json();
                    setAvailableCategories(data.categories || []);
                    setAvailableTags(data.tags || []);
                }
            } catch (error) {
                console.error('Failed to fetch filters:', error);
            }
        };
        fetchFilters();
    }, []);

    const categoryOptions = [
        { label: "All Categories", value: "" },
        ...availableCategories.map(cat => ({ label: cat, value: cat }))
    ];

    const tagOptions = [
        { label: "All Tags", value: "" },
        ...availableTags.map(tag => ({ label: tag, value: tag }))
    ];

    const updateUrl = (params: Record<string, string>) => {
        let newUrl = currentUrl;
        const searchParamsObj = new URLSearchParams(currentSearchParams.toString());
        
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                searchParamsObj.set(key, value);
            } else {
                searchParamsObj.delete(key);
            }
        });

        // Reset to page 1 when filters change
        if (params.search !== undefined || params.category !== undefined || params.tag !== undefined) {
            searchParamsObj.set('page', '1');
        }

        const queryString = searchParamsObj.toString();
        newUrl = queryString ? `${currentUrl}?${queryString}` : currentUrl;
        router.push(newUrl);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrl({ search: searchQuery });
    };

    const setSort = (newSort: Sort) => {
        updateUrl({ sort: newSort });
    };

    const setPageSize = (newPageSize: PageSize) => {
        updateUrl({ pageSize: newPageSize.toString() });
    };

    const setLayout = (newLayout: Layout) => {
        updateUrl({ layout: newLayout });
    };

    const setCategory = (category: string) => {
        setSelectedCategory(category);
        updateUrl({ category });
    };

    const setTag = (tag: string) => {
        setSelectedTag(tag);
        updateUrl({ tag });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedTag('');
        updateUrl({ search: '', category: '', tag: '' });
    };

    const hasActiveFilters = searchQuery || selectedCategory || selectedTag;

    return (
        <Suspense fallback={<div className="flex flex-col w-full p-6"><div>Loading...</div></div>}>
            <div className="flex flex-col w-full p-6 bg-white border-b border-gray-200 mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-row w-full justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Shop Flies & Gear</h1>
                    <div className="flex flex-row items-center gap-6">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                            <button
                                onClick={() => setLayout('grid3')}
                                className={`p-2 rounded transition-colors ${
                                    layout === 'grid3' || layout === 'grid2' || layout === 'grid4' 
                                        ? 'bg-green-600 text-white' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="Grid View"
                            >
                                <FaTh className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setLayout('list')}
                                className={`p-2 rounded transition-colors ${
                                    layout === 'list' 
                                        ? 'bg-green-600 text-white' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="List View"
                            >
                                <FaList className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex flex-row items-center gap-4">
                            <span className="text-sm text-gray-600 whitespace-nowrap">Show</span>
                            <Dropdown 
                                classNames={{ select: "text-sm min-w-[80px]" }}
                                options={pageSizeOptions}
                                selected={pageSizeOptions.find(option => option.value === pageSize.toString()) || pageSizeOptions[0]}
                                setSelected={(newSelected: string) => setPageSize(parseInt(newSelected) as PageSize)}
                            />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex gap-3">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for flies, patterns, materials..."
                            className="flex-1"
                        />
                        <button 
                            type="submit"
                            className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                            Search
                        </button>
                    </div>
                </form>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-6 items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</span>
                        <Dropdown
                            classNames={{ select: "text-sm min-w-[160px]" }}
                            options={sortOptions}
                            selected={sortOptions.find(option => option.value === sort) || sortOptions[0]}
                            setSelected={(newSelected: string) => setSort(newSelected as Sort)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
                        <Dropdown
                            classNames={{ select: "text-sm min-w-[140px]" }}
                            options={categoryOptions}
                            selected={categoryOptions.find(option => option.value === selectedCategory) || categoryOptions[0]}
                            setSelected={setCategory}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Tag:</span>
                        <Dropdown
                            classNames={{ select: "text-sm min-w-[120px]" }}
                            options={tagOptions}
                            selected={tagOptions.find(option => option.value === selectedTag) || tagOptions[0]}
                            setSelected={setTag}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-green-600 hover:text-green-800 underline font-medium"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {searchQuery && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Search: &quot;{searchQuery}&quot;
                                <button 
                                    onClick={() => { setSearchQuery(''); updateUrl({ search: '' }); }}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Category: {selectedCategory}
                                <button 
                                    onClick={() => setCategory('')}
                                    className="ml-2 text-green-600 hover:text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {selectedTag && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Tag: {selectedTag}
                                <button 
                                    onClick={() => setTag('')}
                                    className="ml-2 text-purple-600 hover:text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Suspense>
    )
}