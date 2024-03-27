import {
  MultipleQueriesResponse,
  MultipleQueriesQuery,
  SearchOptions,
  SearchForFacetValuesQueryParams,
  SearchForFacetValuesResponse,
} from "@algolia/client-search";
import { FacetHit, SearchClient } from "instantsearch.js";

import { Schema as S } from "./Facets";
export type Schema = S;

import { adaptHit, adaptFacets } from "./adaptResponse";
import { FacetsResponse, adaptRequest } from "./adaptRequest";

const isEmpty = (o: any) => !o || Object.keys(o).length === 0;

export function getSearchClient<S extends Schema>(
  clientPromise: Promise<any>,
  schema: S
): SearchClient {
  let initialFacets: Promise<FacetsResponse>;
  const indexPromise = clientPromise.then(async (pagefind) => {
    pagefind.init();
    initialFacets = pagefind.filters();
    return pagefind;
  });

  return {
    search: <TObject>(
      requests: readonly MultipleQueriesQuery[]
    ): Readonly<Promise<MultipleQueriesResponse<TObject>>> =>
      indexPromise.then(
        (index) =>
          Promise.all(
            requests.map(async (request) => {
              // need to pass null in order to filter without search
              const query = request.params?.query?.trim() || null;
              const filters = adaptRequest(request, await initialFacets);
              const empty = isEmpty(filters.filters) && !query;
              const facetsToShow =
                typeof request.params?.facets === "string"
                  ? [request.params?.facets]
                  : request.params?.facets || [];
              facetsToShow.forEach((key) => {
                if (!filters.filters[key]) {
                  // need to add empty filter, so that `response.filters` would contain data for it
                  filters.filters[key] = { any: [] };
                }
              });

              const response = await index.search(query, filters);

              const page = request.params?.page || 0;
              const hitsPerPage =
                request.params?.hitsPerPage === undefined
                  ? 16
                  : request.params?.hitsPerPage;
              const hits = await Promise.all(
                response.results
                  .slice(page * hitsPerPage, (page + 1) * hitsPerPage)
                  .map(adaptHit)
              );
              const nbHits = response.results.length;

              const facetsRaw = empty
                ? await index.filters()
                : response.filters;
              const facets: FacetsResponse = {};
              facetsToShow.forEach((key) => (facets[key] = facetsRaw[key]));

              const maxValuesPerFacet =
                request.params?.maxValuesPerFacet === undefined
                  ? 10
                  : request.params?.maxValuesPerFacet;

              return {
                hits,
                page,
                hitsPerPage,
                nbHits,
                nbPages:
                  hitsPerPage === 0 ? 0 : Math.ceil(nbHits / hitsPerPage),
                ...adaptFacets(facets, maxValuesPerFacet, schema),
                processingTimeMS: response.timings.total,
                query: request.params?.query,
                exhaustiveNbHits: true,
                params: "",
              };
            })
          ).then((results) => ({ results })) as any
      ),

    searchForFacetValues: (
      requests: ReadonlyArray<{
        readonly indexName: string;
        readonly params: SearchForFacetValuesQueryParams & SearchOptions;
      }>
    ): Readonly<Promise<readonly SearchForFacetValuesResponse[]>> => {
      // This is quite primitive implementation. Better would be to use TrieMap
      return indexPromise.then((index) =>
        Promise.all(
          requests.map(async (request) => {
            const query = request.params?.query?.trim() || null;
            const filters = adaptRequest(request, await initialFacets);
            const empty = isEmpty(filters.filters) && !query;
            const facetsToShow = [request.params.facetName];
            facetsToShow.forEach((key) => {
              if (!filters.filters[key]) {
                // need to add empty filter, so that `response.filters` would contain data for it
                filters.filters[key] = { any: [] };
              }
            });

            const response = await index.search(query, filters);

            const facets = empty ? await index.filters() : response.filters;

            return {
              exhaustiveFacetsCount: true,
              // this is stupidly slow, maybe use Trie
              facetHits: Object.entries(facets[request.params.facetName])
                .filter(
                  ([value, count]: [string, any]) =>
                    count > 0 &&
                    value
                      .toLocaleLowerCase()
                      .startsWith(request.params.facetQuery)
                )
                .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
                .slice(
                  0,
                  request.params.maxFacetHits ||
                    request.params.maxValuesPerFacet
                )
                .map(
                  ([value, count]) =>
                    ({
                      value,
                      count,
                      highlighted: value,
                    } as FacetHit)
                ),
            };
          })
        )
      );
    },
  };
}
