import instantsearch from "instantsearch.js";

import getRouting from "./routing";
import {
  brands,
  categories,
  clearFilters,
  clearFiltersEmptyResults,
  clearFiltersMobile,
  configuration,
  freeShipping,
  hitsPerPage,
  pagination,
  priceSlider,
  products,
  ratings,
  resultsNumberMobile,
  saveFiltersMobile,
  searchBox,
  sortBy,
} from "./widgets";

// @ts-expect-error
import { schema } from "./schema.js";
import { getSearchClient } from "@stereobooster/pagefind-instantsearch";

// @ts-expect-error
// import * as pagefind from "../public/pagefind/pagefind.js";
const pagefind = await import("../public/pagefind/pagefind.js");
pagefind.init();
await pagefind.filters();

const searchClient = getSearchClient(pagefind, schema);
const search = instantsearch({
  searchClient,
  indexName: "instant_search",
  routing: getRouting({ indexName: "instant_search" }),
  insights: false,
  future: {
    preserveSharedStateOnUnmount: true,
  },
});

search.addWidgets([
  brands,
  categories,
  clearFilters,
  clearFiltersEmptyResults,
  clearFiltersMobile,
  configuration,
  freeShipping,
  hitsPerPage,
  pagination,
  priceSlider,
  products,
  ratings,
  resultsNumberMobile,
  saveFiltersMobile,
  searchBox,
  sortBy,
]);

export default search;
