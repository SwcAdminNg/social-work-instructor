"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search...",
  showSearch = true,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      className={`relative w-full min-w-[200px] ${isOpen ? "z-[100]" : "z-10"}`}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 bg-white dark:bg-[#0a0f0c] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] font-medium transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-700"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[240px] left-0 bg-white dark:bg-[#111a14] border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {showSearch && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0a0f0c] rounded-lg pl-9 pr-3 py-2 text-sm focus:border-none focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] text-gray-700 dark:text-gray-200 border border-transparent focus:border-[#2D6A4F]/30 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-[260px] overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchQuery("");
              }}
              className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                !value
                  ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#2D6A4F]/20 dark:text-[#52b788] font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              All {placeholder}
              {!value && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 mt-0.5 text-sm rounded-lg transition-colors ${
                    value === opt.value
                      ? "bg-[#2D6A4F] text-white font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : opt.count !== undefined ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                      {opt.count}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
