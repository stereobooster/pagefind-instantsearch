import {
  MultipleQueriesResponse,
  MultipleQueriesQuery,
  // SearchOptions,
  // SearchForFacetValuesQueryParams,
  // SearchForFacetValuesResponse,
} from "@algolia/client-search";
// import { FacetHit, SearchClient } from "instantsearch.js";
import { SearchClient } from "instantsearch.js";

import { Schema as S } from "./Facets";
export type Schema = S;

import { adaptHit, adaptFacets } from "./adaptResponse";
import { adaptRequest } from "./adaptRequest";

export function getSearchClient<S extends Schema>(
  index: any,
  schema: S
): SearchClient {
  return {
    search: <TObject>(
      requests: readonly MultipleQueriesQuery[]
    ): Readonly<Promise<MultipleQueriesResponse<TObject>>> =>
      Promise.all(
        requests.map(async (request) => {
          const response = await index.search(
            request.params?.query,
            adaptRequest(request)
          );
          // console.log(request);
          // console.log(response);

          const page = request.params?.page || 0;
          const hitsPerPage = request.params?.hitsPerPage || 16;
          const hits = await Promise.all(
            response.results
              .slice(page * hitsPerPage, (page + 1) * hitsPerPage)
              .map(adaptHit)
          );
          const nbHits = response.results.length;
          const facets =
            nbHits === 0 ? await index.filters() : response.filters;
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
      ).then((results) => ({ results })) as any,

    // searchForFacetValues: (
    //   queries: ReadonlyArray<{
    //     readonly indexName: string;
    //     readonly params: SearchForFacetValuesQueryParams & SearchOptions;
    //   }>
    // ): Readonly<Promise<readonly SearchForFacetValuesResponse[]>> => {
    //   // This is quite primitive implementation. Better would be to use TrieMap
    //   return Promise.resolve(
    //     queries.map((querie) => ({
    //       exhaustiveFacetsCount: true,
    //       facetHits: index
    //         .facet(
    //           {
    //             field: querie.params.facetName,
    //             query: querie.params.facetQuery,
    //             perPage:
    //               querie.params.maxFacetHits || querie.params.maxValuesPerFacet,
    //           },
    //           adaptRequest(querie.params as any, index.config().schema)
    //         )
    //         .items.map(
    //           ([value, count]) =>
    //             ({
    //               value,
    //               count,
    //               highlighted: value,
    //             } as FacetHit)
    //         ),
    //     }))
    //   );
    // },
  };
}
