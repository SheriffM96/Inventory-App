"use client";

/**
 * A search box that filters sibling rows purely via the DOM, so it can sit
 * inside a Server Component's list without needing to lift that list's data
 * and rendering into a client component (functions/JSX can't cross the
 * server/client boundary as props). Mark each filterable row with
 * `data-search-row` and `data-search="<lowercased searchable text>"`, and
 * wrap the whole list (rows + this component) in an element carrying
 * `data-search-scope="<scopeId>"`.
 */
export default function ListSearch({
  scopeId,
  placeholder = "Search...",
  label,
}: {
  scopeId: string;
  placeholder?: string;
  label: string;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={`search-${scopeId}`} className="sr-only">
        {label}
      </label>
      <input
        id={`search-${scopeId}`}
        type="search"
        placeholder={placeholder}
        className="input sm:max-w-xs"
        onChange={(e) => {
          const query = e.target.value.trim().toLowerCase();
          const scope = document.querySelector(`[data-search-scope="${scopeId}"]`);
          if (!scope) return;
          const rows = scope.querySelectorAll<HTMLElement>("[data-search-row]");
          let visibleCount = 0;
          rows.forEach((row) => {
            const text = (row.getAttribute("data-search") ?? row.textContent ?? "").toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? "" : "none";
            if (matches) visibleCount++;
          });
          const emptyState = scope.querySelector<HTMLElement>("[data-search-empty]");
          if (emptyState) emptyState.style.display = visibleCount === 0 ? "block" : "none";
        }}
      />
    </div>
  );
}
