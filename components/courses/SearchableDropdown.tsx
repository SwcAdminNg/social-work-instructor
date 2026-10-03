"use client";

import { Select } from "@/components/ui/select";

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

/** Kept for existing callers; renders the shared Select (same as the admin app). */
export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search...",
  showSearch = true,
}: SearchableDropdownProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      title={placeholder}
      searchable={showSearch}
      searchPlaceholder={searchPlaceholder}
      menuWidth="auto"
      className="min-w-[200px]"
      options={options.map((o) => ({
        value: o.value,
        label: o.label,
        description: o.count !== undefined ? `${o.count} course${o.count === 1 ? "" : "s"}` : undefined,
      }))}
    />
  );
}
