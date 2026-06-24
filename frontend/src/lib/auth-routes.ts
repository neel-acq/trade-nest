const PUBLIC_PATHS = ['/', '/login', '/offline'];

const AUTH_PATH_PREFIXES = ['/dashboard', '/stocks', '/orders', '/trades', '/portfolio', '/wallet', '/notifications', '/settings', '/admin'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isProtectedPath(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/dashboard';
  }
  if (path === '/login' || path === '/') {
    return '/dashboard';
  }
  if (!isProtectedPath(path) && !path.startsWith('/dashboard')) {
    return '/dashboard';
  }
  return path;
}
