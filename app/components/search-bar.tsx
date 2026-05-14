"use client";

type SearchBarProps = {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)]/50 px-4 py-3 pr-12 text-sm text-[var(--app-fg)] placeholder-[var(--app-muted)] transition-colors focus:border-[var(--app-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--app-border-strong)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search / 清空搜索"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors hover:text-[var(--app-fg)]"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
