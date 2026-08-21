interface SkeletonGridProps {
  count?: number;
  height?: number;
  columns?: string;
  gap?: number;
  minWidth?: number;
}

export default function SkeletonGrid({ 
  count = 6, 
  height = 200, 
  columns, 
  gap = 12,
  minWidth
}: SkeletonGridProps) {
  // If minWidth is passed (e.g., from challenges.tsx), use auto-fit CSS grid.
  // Otherwise, fallback to the column definition (e.g., 'repeat(2, 1fr)').
  const gridColumns = minWidth 
    ? `repeat(auto-fit, minmax(${minWidth}px, 1fr))` 
    : (columns || 'repeat(2, 1fr)');

  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: gridColumns, 
        gap, 
        gridColumn: 'span 2',
        width: '100%'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton" 
          style={{ 
            height, 
            width: '100%', 
            borderRadius: 8,
            boxSizing: 'border-box'
          }} 
        />
      ))}
    </div>
  );
}