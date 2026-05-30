"use client";

type SearchBarProps = {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="group relative w-full max-w-2xl">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-fg)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface)]/50 py-3 pl-11 pr-12 text-sm text-[var(--app-fg)] placeholder-[var(--app-muted)] transition-all duration-300 focus:border-[var(--app-border-strong)] focus:bg-[var(--app-surface)]/80 focus:outline-none focus:shadow-[0_0_0_3px_rgba(212,165,116,0.1)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search / 清空搜索"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--app-muted)] transition-all hover:bg-[var(--app-border)] hover:text-[var(--app-fg)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
