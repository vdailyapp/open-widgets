import React, { useState, useMemo } from 'react';

const WIDGETS_PER_PAGE = 8;

const WidgetCard = ({ widget }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b">
            <div className="text-4xl">{widget.icon}</div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-800">{widget.name}</h3>
            <p className="text-sm text-gray-600 h-16 flex-grow">{widget.description}</p>
            <div className="mt-4">
                <a href={widget.url} className="text-indigo-600 hover:underline">View</a> |
                <a href="#" className="text-indigo-600 hover:underline ml-2">Settings</a>
            </div>
        </div>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex justify-center items-center mt-8 space-x-2">
            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

export default function WidgetManager({ widgets: allWidgets }) {

    console.log("WidgetManager rendered with widgets:", allWidgets);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    const categories = useMemo(() => [...new Set(allWidgets.map(w => w.category))], [allWidgets]);

    const filteredWidgets = useMemo(() => {
        return allWidgets.filter(widget => {
            const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) || widget.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory, allWidgets]);

    const paginatedWidgets = useMemo(() => {
        const startIndex = (currentPage - 1) * WIDGETS_PER_PAGE;
        return filteredWidgets.slice(startIndex, startIndex + WIDGETS_PER_PAGE);
    }, [filteredWidgets, currentPage]);

    const totalPages = Math.ceil(filteredWidgets.length / WIDGETS_PER_PAGE);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    };
    
    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-lg shadow">
                <div className="flex-grow">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <input
                        type="text"
                        id="search"
                        placeholder="Search widgets..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="flex-grow">
                    <label htmlFor="category-filter" className="sr-only">Filter by category</label>
                    <select
                        id="category-filter"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                </div>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedWidgets.map(widget => <WidgetCard key={widget.id} widget={widget} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
        </div>
    );
}
