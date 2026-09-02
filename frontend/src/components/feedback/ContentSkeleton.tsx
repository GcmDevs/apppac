type ContentSkeletonProps = {
  lines?: number;
  className?: string;
};

export function ContentSkeleton({ lines = 3, className = '' }: ContentSkeletonProps) {
  return (
    <div className={`content-skeleton ${className}`.trim()} role="status" aria-label="Cargando contenido">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className="content-skeleton-line" />
      ))}
    </div>
  );
}
