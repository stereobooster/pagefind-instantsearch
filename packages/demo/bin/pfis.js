#!/usr/bin/env node

import { readFileSync } from "node:fs";
import * as pagefind from "pagefind";

const { index } = await pagefind.createIndex();

const schema = {
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

const items = JSON.parse(readFileSync("./public/records.json"));

function schemaToTransformer(schema) {
  return (item) => {
    return {
      url: `${item.objectID}`,
      content: [item.name, item.description].join(" "),
      language: "en",
      meta: {
        name: item.name,
        description: item.description,
        image: item.image,
        url: item.url,
        // maybe duplicate filters in meta?
        // price: `${item.price}`,
      },
      filters: {
        brand: [item.brand],
        categories: item.categories,
        "hierarchicalCategories.lvl0": item.hierarchicalCategories.lvl0
          ? [item.hierarchicalCategories.lvl0]
          : undefined,
        "hierarchicalCategories.lvl1": item.hierarchicalCategories.lvl1
          ? [item.hierarchicalCategories.lvl1]
          : undefined,
        price: [`${item.price}`],
        rating: [`${item.rating}`],
        free_shipping: [`${item.free_shipping}`],
      },
      // sort: {
      //   weight: `${item.popularity}`,
      // },
    };
  };
}

const transformer = schemaToTransformer(schema);
for (let item of items) {
  const { errors } = await index.addCustomRecord(transformer(item));
  if (errors && errors.length) console.log(errors);
}

const { errors } = await index.writeFiles({
  outputPath: "public/pagefind",
});
if (errors && errors.length) console.log(errors);

await pagefind.close();
