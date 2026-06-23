/**
 * Avatar initials helper.
 * John Doe -> JD, JohnDoe -> JO
 */
export function getInitials(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  const single = parts[0];
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }

  return single[0]?.toUpperCase() ?? '?';
}
