export function CatalogSkeleton() {
  return <section aria-label="Carregando locais" aria-busy="true" className="mb-12">
    <p role="status" className="mb-4 text-sm">Buscando locais…</p>
    <ul className="place-catalog-row" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(index => <li key={index}>
        <div className="place-card premium-card w-full overflow-hidden rounded-2xl border">
          <div className="catalog-skeleton h-32" />
          <div className="space-y-3 p-3.5">
            <div className="catalog-skeleton h-3 w-1/2 rounded" />
            <div className="catalog-skeleton h-5 w-5/6 rounded" />
            <div className="catalog-skeleton h-4 w-full rounded" />
            <div className="flex gap-1.5">{[0, 1, 2].map(tile => <div key={tile} className="catalog-skeleton h-9 w-9 rounded-xl" />)}</div>
            <div className="catalog-skeleton h-11 w-full rounded-xl" />
          </div>
        </div>
      </li>)}
    </ul>
  </section>;
}
