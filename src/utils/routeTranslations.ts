/**
 * Route-based translation loading configuration
 * Maps routes to their required translation namespaces
 */
export const routeTranslations: Record<string, string[]> = {
  '/dashboard': ['dashboard'],
  '/reservations': ['reservations'],
  '/front-desk': ['frontDesk'],
  '/rooms': ['rooms'],
  '/housekeeping': ['rooms'],
  '/pricing': ['pricing'],
  '/services': ['pricing'],
  '/service-orders': ['pricing'],
  '/customers': ['customers'],
  '/companies': ['customers'],
  '/reports': ['reports'],
  '/settings': ['settings'],
  '/admin': ['admin'],
};

/**
 * Get required translation namespaces for a given route
 * @param pathname - The current route pathname
 * @returns Array of namespace strings
 */
export function getRouteTranslations(pathname: string): string[] {
  // Find exact match first
  if (routeTranslations[pathname]) {
    return routeTranslations[pathname];
  }

  // Find partial match for nested routes
  const matchingRoute = Object.keys(routeTranslations).find(route => 
    pathname.startsWith(route)
  );

  return matchingRoute ? routeTranslations[matchingRoute] : [];
}