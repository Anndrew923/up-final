/** Ladder avatar stored locally as compressed JPEG/PNG data URL before Pro sync uploads to Storage. */
export function isLadderAvatarDataUrl(value: string): boolean {
  const t = value.trim();
  return (
    t.startsWith('data:image/jpeg') ||
    t.startsWith('data:image/jpg') ||
    t.startsWith('data:image/png')
  );
}

export function isLadderAvatarHttpsUrl(value: string): boolean {
  return value.trim().startsWith('https://');
}

/**
 * Decodes a `data:image/*;base64,...` string for Firebase Storage upload.
 * WHY: Callable / Firestore only accept https URLs; sync uploads blob once per data URL.
 */
export function ladderAvatarDataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    throw new Error('ladder-avatar-invalid-data-url');
  }
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1]?.trim() || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
