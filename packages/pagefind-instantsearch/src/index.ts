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
import { adaptRequest } from "./adaptRequest";

const isEmpty = (o: Record<string, any>) => Object.keys(o).length === 0;

export function getSearchClient<S extends Schema>(
  clientPromise: Promise<any>,
  schema: S
): SearchClient {
  const indexPromise = clientPromise.then(async (pagefind) => {
    pagefind.init();
    pagefind.filters();
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
              const response = await index.search(
                // https://github.com/CloudCannon/pagefind/issues/546#issuecomment-1896570871
                request.params?.query?.trim() || null,
                adaptRequest(request)
              );

              const page = request.params?.page || 0;
              const hitsPerPage = request.params?.hitsPerPage || 16;
              const hits = await Promise.all(
                response.results
                  .slice(page * hitsPerPage, (page + 1) * hitsPerPage)
                  .map(adaptHit)
              );
              const nbHits = response.results.length;
              // TODO: if search is null and there are no filters - use `await index.filters()`
              const facets = isEmpty(response.filters)
                ? await index.filters()
                : response.filters;
              const maxValuesPerFacet = request.params?.maxValuesPerFacet || 10;

              return {
                hits,
                page,
                hitsPerPage,
                nbHits,
                nbPages: Math.ceil(nbHits / hitsPerPage),
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
            const response = await index.search(
              request.params?.query?.trim() || null,
              adaptRequest(request)
            );

            // TODO: if search is null and there are no filters - use `await index.filters()`
            const facets = isEmpty(response.filters)
              ? await index.filters()
              : response.filters;

            return {
              exhaustiveFacetsCount: true,
              facetHits: Object.entries(facets[request.params.facetName])
                .filter(
                  ([value, count]: [string, any]) =>
                    value
                      .toLocaleLowerCase()
                      .startsWith(request.params.facetQuery) && count > 0
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
