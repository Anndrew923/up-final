/**
 * Optional autoplay loop — mount only when parent has a real `src`.
 * WHY: Keeps video markup out of still-only parents; corrupt/missing files
 * fall through to the caller's poster without blanking the stage.
 */
export function OptionalLoopVideo({
  src,
  poster,
  className,
  onReadyChange,
}: {
  src: string;
  poster: string;
  className?: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="metadata"
      onLoadedData={() => onReadyChange?.(true)}
      onError={() => {
        // WHY: Corrupt/missing file must never blank the stage — caller keeps poster.
        onReadyChange?.(false);
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
