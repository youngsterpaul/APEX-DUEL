interface SkeletonGridProps {
  count?: number;
  height?: number;
  columns?: string;
  gap?: number;
}

export default function SkeletonGrid({ 
  count = 6, 
  height = 200, 
  columns = 'repeat(2, 1fr)', 
  gap = 12 
}: SkeletonGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns, gap, gridColumn: 'span 2' }}>
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