import { MultipleQueriesQuery } from "@algolia/client-search";
import { Schema } from "./Facets";

export function adaptRequest<S extends Schema>(
  request: MultipleQueriesQuery,
  _schema?: S
) {
  // const highlight =
  //   request.params?.highlightPostTag && request.params?.highlightPreTag
  //     ? {
  //         start: request.params.highlightPreTag,
  //         end: request.params.highlightPostTag,
  //         key: "_highlightResult",
  //         subKey: "value",
  //       }
  //     : undefined;

  adaptNumericFilters(request.params?.numericFilters as any);
  return {
    sort: adaptSort(request.indexName),
    filters: adaptFacetFilters(request.params?.facetFilters as any),
  };
}

export function adaptSort(indexName?: string) {
  if (!indexName) return;
  const parts = indexName.split("_");
  if (parts.length < 3) return;
  const field = parts[parts.length - 2];
  const order = parts[parts.length - 1];
  if (order !== "asc" && order !== "desc") return;
  return [field, order] as [string, "asc" | "desc"];
}

export function adaptFacetFilters(
  facetFilters: string | string[] | string[][] | undefined
) {
  const filter: Record<string, string[]> = Object.create(null);

  if (!facetFilters) return filter;
  if (typeof facetFilters === "string") {
    adaptFacetFilter(facetFilters, filter);
    return filter;
  }

  facetFilters.forEach((facets) => {
    if (Array.isArray(facets)) {
      facets.forEach((facet) => adaptFacetFilter(facet, filter));
    } else {
      adaptFacetFilter(facets, filter);
    }
  });

  return filter;
}

// https://pagefind.app/docs/js-api-filtering/#using-compound-filters
export function adaptFacetFilter(facet: string, filter: Record<string, any>) {
  const facetRegex = new RegExp(/(.+)(:)(.+)/);
  let [, field, , value] = facet.match(facetRegex) || [];

  if (filter[field]) {
    filter[field].any.push(value);
  } else {
    filter[field] = { any: [value] };
  }
}

export function adaptNumericFilters(
  numericFilters: string | string[] | string[][] | undefined
) {
  const filter: Record<string, { from?: number; to?: number }> =
    Object.create(null);

  if (!numericFilters) return filter;
  console.log(numericFilters);
  if (typeof numericFilters === "string") {
    adaptNumericFilter(numericFilters, filter);
    return filter;
  }

  numericFilters.forEach((facets) => {
    if (Array.isArray(facets)) {
      facets.forEach((facet) => adaptNumericFilter(facet, filter));
    } else {
      adaptNumericFilter(facets, filter);
    }
  });

  return filter;
}

export function adaptNumericFilter(
  facet: string,
  filter: Record<string, { from?: number; to?: number }>
) {
  const numericRegex = new RegExp(/([^<=!>]+)(<|<=|=|!=|>|>=)(\d+)/);
  const [, field, operator, value] = facet.match(numericRegex) || [];

  if (!filter[field]) filter[field] = Object.create(null);

  switch (operator) {
    case "<":
    case "<=":
      filter[field].to = parseFloat(value);
      break;
    case ">":
    case ">=":
      filter[field].from = parseFloat(value);
      break;
    case "=":
    // filter[field] = [parseFloat(value)];
    // break;
    case "!=":
      throw new Error("Not implemented!");
  }
}
