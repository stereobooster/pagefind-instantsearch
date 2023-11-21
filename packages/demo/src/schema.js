/**
 * @type {import("@stereobooster/pagefind-instantsearch").Schema}
 */
export const schema = {
  name: {
    type: "string",
    text: true,
  },
  description: {
    type: "string",
    text: true,
  },
  brand: {
    type: "string",
    facet: true,
  },
  categories: {
    type: "string",
    isArray: true,
    facet: true,
  },
  "hierarchicalCategories.lvl0": {
    type: "string",
    facet: true,
    isObject: true,
  },
  "hierarchicalCategories.lvl1": {
    type: "string",
    facet: true,
    isObject: true,
  },
  // "hierarchicalCategories.lvl2": {
  //   type: "string",
  //   facet: true,
  //   isObject: true,
  // },
  // "hierarchicalCategories.lvl3": {
  //   type: "string",
  //   facet: true,
  //   isObject: true,
  // },
  price: {
    type: "number",
    facet: {
      showZeroes: true,
    },
  },
  image: {
    type: "string",
  },
  url: {
    type: "string",
  },
  free_shipping: {
    type: "boolean",
    facet: true,
  },
  rating: {
    type: "number",
    facet: {
      showZeroes: true,
    },
  },
  // TODO: sort by popularity by default?
  popularity: {
    type: "number",
  },
  // type: {
  //   type: "string",
  // },
  // price_range: {
  //   type: "string",
  // },
  // objectID: {
  //   type: "string",
  // },
};
