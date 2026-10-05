export type AppTab = 'explorer' | 'register' | 'routes' | 'professionals';

const TAB_PARAMS: Record<Exclude<AppTab, 'explorer'>, string> = { routes: 'rotas', professionals: 'profissionais', register: 'cadastro' };

export function tabFromUrl(search: string): AppTab {
  const value = new URLSearchParams(search).get('aba');
  return (Object.keys(TAB_PARAMS) as (keyof typeof TAB_PARAMS)[]).find(tab => TAB_PARAMS[tab] === value) ?? 'explorer';
}

// Switching tabs leaves the place view, so `local` is removed.
export function urlForTab(tab: AppTab, href: string): string {
  const url = new URL(href);
  url.searchParams.delete('local');
  if (tab === 'explorer') url.searchParams.delete('aba'); else url.searchParams.set('aba', TAB_PARAMS[tab]);
  return url.href;
}
