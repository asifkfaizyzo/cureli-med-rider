// cureli-rider-app/src/features/auth/utils/avatar.ts

/**
 * Resolves a rider's profile photo to a public URL.
 * Prioritizes backend-resolved public URLs.
 */
export function getRiderPhotoUrl(
  keyOrUrl: string | null | undefined
): string | null {
  if (!keyOrUrl) return null;

  // If it's already a complete HTTP/S URL returned by the backend, return it as-is
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }

  // Remove any leading slash
  const cleanKey = keyOrUrl.startsWith("/") ? keyOrUrl.slice(1) : keyOrUrl;

  // Fallback direct S3/CloudFront resolution logic
  const s3Path = cleanKey.startsWith("rider_documents/")
    ? cleanKey
    : `rider_documents/${cleanKey}`;

  const cdnDomain = "d2w387j8f8ebzs.cloudfront.net";
  return `https://${cdnDomain}/${s3Path}`;
}