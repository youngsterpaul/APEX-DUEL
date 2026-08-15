interface SkeletonGridProps {
  count?: number;
  height?: number;
  minWidth?: number;
}

export default function SkeletonGrid({ count = 6, height = 200, minWidth = 260 }: SkeletonGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`, gap: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, width: '100%' }} />
      ))}
    </div>
  );
}