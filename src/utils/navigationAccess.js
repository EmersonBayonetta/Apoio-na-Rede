export const PUBLIC_NAVIGATION_TABS = Object.freeze(['explorer', 'professionals']);

export function visibleNavigationTabs(authenticated) {
  return authenticated ? [...PUBLIC_NAVIGATION_TABS, 'register', 'my_places'] : [...PUBLIC_NAVIGATION_TABS];
}
