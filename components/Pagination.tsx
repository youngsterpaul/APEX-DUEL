interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={btnStyle(page === 1)}
      >
        ← Prev
      </button>
      <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={btnStyle(page === totalPages)}
      >
        Next →
      </button>
    </div>
  );
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'transparent',
  border: '1px solid var(--panel-border)',
  color: disabled ? 'var(--muted)' : '#fff',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderRadius: 4,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});