import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const Pagination = ({
  meta = {},
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100]
}) => {
  const page = meta.page || 1;
  const limit = meta.limit || 20;
  const totalItems = meta.totalItems ?? meta.total ?? 0;
  const totalPages = meta.totalPages || Math.ceil(totalItems / limit) || 1;

  if (totalItems === 0) return null;

  const startItem = Math.min((page - 1) * limit + 1, totalItems);
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers with window
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Show 2 pages on each side of current page

    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages) {
      if (right < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination-bar no-print">
      {/* Left: Entries Counter */}
      <div className="pagination-info">
        <span>Showing </span>
        <strong>{startItem}</strong>
        <span> to </span>
        <strong>{endItem}</strong>
        <span> of </span>
        <strong>{totalItems}</strong>
        <span> entries</span>
      </div>

      {/* Right: Page Navigation & Rows per page */}
      <div className="pagination-controls">
        {onLimitChange && (
          <div className="pagination-limit-selector">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per page:</span>
            <select
              className="pagination-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pagination-buttons">
          <button
            type="button"
            className="btn-page"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            type="button"
            className="btn-page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  &hellip;
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                className={`btn-page ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            className="btn-page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            className="btn-page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
