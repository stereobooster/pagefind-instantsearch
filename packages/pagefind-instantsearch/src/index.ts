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

// import { adaptResponse } from "./adaptResponse";
import { adaptRequest } from "./adaptRequest";

async function adaptHit(item: any) {
  const data = await item.data();
  return {
    objectID: item.id,
    ...data.meta,
    categories: data.filters.categories,
    price: parseFloat(data.filters.price[0]),
    rating: parseFloat(data.filters.rating[0]),
  };
}

function adapFacets(
  facets: Record<string, Record<string, number>>,
  maxValuesPerFacet: number,
  schema: Schema
) {
  const newFacets = Object.create(null);
  const facetsStats = Object.create(null);

  Object.keys(facets).forEach((field) => {
    const entries = Object.entries(facets[field]).filter((a) => a[1] !== 0);

    if (schema[field]?.type === "number") {
      const values: number[] = [];
      entries.forEach((a) => values.push(parseFloat(a[0])));
      facetsStats[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    newFacets[field] = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxValuesPerFacet)
      .reduce((facet, [value, count]) => {
        facet[value] = count;
        return facet;
      }, Object.create(null));

    return newFacets;
  });

  return {
    facets: newFacets,
    facets_stats: facetsStats,
  };
}

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
            ...adapFacets(facets, maxValuesPerFacet, schema),
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
