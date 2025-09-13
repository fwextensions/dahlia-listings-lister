# Refactoring Plan: Listings Lister

## Constraints and decisions
- **Keep local cache for instant load**: show cached listings immediately; refresh in background.
- **Use React Query (RQ)** to manage fetching, cache, and background refresh.
- **Do not use RSC** yet; keep `src/app/page.tsx` as a client component for now.
- **Use existing structure**: `src/components/` and `src/hooks/`.
- **Tests later**; plan aims for testable seams.

## Goals
- **Reduce `src/app/page.tsx` to a thin orchestrator** focusing on composition.
- **Separate concerns**: data fetching, search/filter, selection, keyboard nav, preferences fetching, and rendering.
- **Improve type-safety** between list vs detail payloads.
- **Keep behavior parity**: persisted filter, keyboard navigation, autoselect, scroll-into-view, result count text.

## Hook extraction
- **`src/hooks/useListingsQuery.ts`**
  - Wrap `/api/listings` via RQ: `useQuery({ queryKey: ["listings"], queryFn })`.
  - Seed with local cache using `initialData: getCachedListings()` from `src/utils/api.ts`.
  - Drive refresh spinner via `isFetching`.
  - Returns `{ data, isLoading, isFetching, error, refetch }`.

- **`src/hooks/useListingFilter.ts`**
  - Manage `ListingFilter` with localStorage key `"listingFilter"`.
  - Returns `{ currentFilter, setCurrentFilter }`.

- **`src/hooks/useSearchTerm.ts`**
  - Manage `searchTerm` + `useDebounce` (250ms).
  - Returns `{ searchTerm, setSearchTerm, debouncedSearchTerm }`.

- **`src/hooks/useFilteredListings.ts`**
  - Pure derivation of filtered + sorted listings.
  - Move `compareDates` into `src/utils/listingSort.ts` and import here.
  - Signature: `(listings, term, filter) => Listing[]`.

- **`src/hooks/useListingSelection.ts`**
  - Manage `selectedListingId`, keep it valid against filtered list, default to first when needed.
  - Returns `{ selectedListingId, setSelectedListingId, currentSelectedListing }`.

- **`src/hooks/useKeyboardNavigation.ts`**
  - Encapsulate Arrow/Home/End/PageUp/PageDown logic, page-size estimation, and optional scroll-into-view.
  - Returns `{ onKeyDown, registerItemRef, containerRef }`.

- **`src/hooks/usePreferencesQuery.ts`**
  - RQ keyed by `["preferences", listingId]` calling `/api/preferences/[listingId]`.
  - Replaces manual caching with RQ cache.
  - Returns `{ data: preferences, isLoading, error }`.

## Component decomposition
- **`src/components/FinderPane.tsx`**
  - Contains `SearchBox`, `FilterBar`, results count text, and the list of `ListingItem`.
  - Props: search term handlers, filter handlers, filtered listings, selection handlers, `onKeyDown`, and refs as needed.

- **`src/components/DetailsPane.tsx`**
  - Accepts `{ listing }` and uses `usePreferencesQuery(listing?.Id)` internally.
  - Renders existing `ListingDetails` with `{ listing, preferences, isPreferencesLoading, preferencesError }`.

- **Small UI states** (optional now, easy later):
  - `src/components/LoadingState.tsx`
  - `src/components/ErrorState.tsx`
  - `src/components/EmptyState.tsx`

## Utilities and types
- **`src/utils/listingSort.ts`**: export `compareDates(a, b)`.
- **`src/utils/listingText.ts`**: export `getResultsCountText(count, term, filter, isLoading, error)`.
- **`src/utils/logger.ts`**: tiny wrapper over `console` to silence in prod if desired.
- **Split types**:
  - `src/types/listing-summary.ts`: list item shape from `/api/listings`.
  - `src/types/listing-details.ts`: detail shape from `/api/listings/[listingID]`.
  - Gradually migrate from `src/types/listings.ts` to these for stronger safety.

## Page simplification (`src/app/page.tsx`)
- Use the hooks above to replace inline logic and refs.
- Provide `isRefreshing={isFetching}` to `Layout` instead of custom `isRefreshing` state.
- Remove bootstrapping flags; `initialData` + RQ covers instant paint and background refresh.

## Local cache strategy with React Query
- Continue using `src/utils/api.ts` for localStorage read/write initially.
  - `useListingsQuery` uses `initialData: getCachedListings()` to avoid spinner.
  - `queryFn` fetches `/api/listings` and, on success, calls `cacheListings(data)` to keep localStorage fresh.
- Later optional: add `@tanstack/react-query-persist-client` for broader offline caching.

## Migration steps (incremental)
1) Introduce `useListingsQuery` using localStorage `initialData`. Swap `page.tsx` to use it.
2) Extract `useListingFilter`, `useSearchTerm`, and `useFilteredListings`. Wire into `page.tsx`.
3) Extract `useListingSelection` and `useKeyboardNavigation`. Wire selection + keyboard behavior.
4) Create `FinderPane.tsx` and move finder UI out of `page.tsx`.
5) Create `usePreferencesQuery` and `DetailsPane.tsx`. Remove preferences wiring from `page.tsx`.
6) Split list/detail types; update components progressively.
7) Move helpers (`compareDates`, results text) to `utils/`. Add small UI state components if desired.

## Acceptance criteria
- Behavior parity maintained (filter persistence, keyboard nav, autoselect, scroll-into-view, result count text).
- `src/app/page.tsx` ~120–150 lines, primarily composition.
- RQ manages refresh; toolbar spinner reflects `isFetching`.
- Clear type boundaries between list and detail data.

## Out of scope for now
- RSC prefetching.  Consider later for FCP improvements.
- Tests (unit for hooks/utils) to be added in a follow-up.

## Notes
- Dynamic API route param handling in Next.js 15 already follows the promised `params` pattern in `src/app/api/listings/[listingID]/route.ts` and `src/app/api/preferences/[listingId]/route.ts`. Reuse the same pattern if adding more routes.
