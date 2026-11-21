'use client';

import { CloseIcon, SearchIcon } from './icons';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
        className="w-full rounded-full border border-line bg-surface py-2.5 pr-10 pl-10 text-sm placeholder:text-muted focus:border-accent/70 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-foreground"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
