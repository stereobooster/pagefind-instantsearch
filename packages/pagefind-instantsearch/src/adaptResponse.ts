import { Hit, SearchResponse } from "@algolia/client-search";
import { SearchResults, Schema, Item } from "@stereobooster/facets";

export function adaptResponse<S extends Schema, I extends Item<S>>(
  _response: SearchResults<S, I>,
  _query: string,
  _idKey: string | undefined
): SearchResponse<I> {
  return null as any
}

const markRegexp = /<mark>([^<]+)<\/mark>/g;
function highlight(str: string, matchedWords: string[]) {
  let result = str;
  matchedWords.forEach((word) => {
    result = result.replaceAll(
      word,
      `__ais-highlight__${word}__/ais-highlight__`
    );
  });
  return result;
}

export function adaptHighlight(
  item: any,
  excerpt: string,
  textFields: string[]
) {
  let matchedWords = [
    ...new Set([...excerpt.matchAll(markRegexp)].map(([, x]) => x)),
  ]
    .filter((a) => a.length > 3)
    .sort((a, b) => a.length - b.length);
  if (matchedWords.length === 0) return item;
  if (matchedWords.length > 1) {
    matchedWords = matchedWords.filter(
      (x) => x === matchedWords[0] || !x.startsWith(matchedWords[0])
    );
  }
  const _highlightResult: Record<string, any> = {};
  textFields.forEach((field) => {
    _highlightResult[field] = {
      value: highlight(item[field], matchedWords),
    };
  });
  return { ...item, _highlightResult };
}

export async function adaptHit(item: any): Promise<Hit<any>> {
  const data = await item.data();
  return adaptHighlight(
    {
      objectID: item.id,
      ...data.meta,
      categories: data.filters.categories,
      price: parseFloat(data.filters.price[0]),
      rating: parseFloat(data.filters.rating[0]),
    },
    data.excerpt,
    ["name", "description"]
  ) as any;
}

export function adaptFacets(
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
