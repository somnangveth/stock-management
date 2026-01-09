'use client';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps<T> {
  data: T[]; 
  onSearch: (results: T[]) => void;
  searchKeys: (keyof T)[];
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export default function SearchBar<T extends Record<string, any>>({
  data,
  onSearch,
  searchKeys,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}: SearchBarProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // If data is undefined or not array, fallback to empty array
    const items = Array.isArray(data) ? data : [];

    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        onSearch(items);
        return;
      }

      const filtered = items.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );

      onSearch(filtered);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, data, searchKeys, debounceMs, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch(Array.isArray(data) ? data : []);
  };

  return (
    <div className={`relative ${className} bg-white`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
