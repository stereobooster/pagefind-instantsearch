#!/usr/bin/env node

import { readFileSync } from "node:fs";
import * as pagefind from "pagefind";
import { schema } from "../src/schema.js";

const { index } = await pagefind.createIndex({});
if (!index) {
  console.log("Can't create index");
  process.exit(1);
}

const items = JSON.parse(readFileSync("./public/records.json").toString());

/**
 * @param {import("@stereobooster/pagefind-instantsearch").Schema} _schema
 */
function schemaToTransformer(_schema) {
  /**
   * @param {any} item
   */
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
          : [],
        "hierarchicalCategories.lvl1": item.hierarchicalCategories.lvl1
          ? [item.hierarchicalCategories.lvl1]
          : [],
        price: [`${item.price}`],
        rating: [`${item.rating}`],
        free_shipping: [`${item.free_shipping}`],
      },
      sort: {
        popularity: `${item.popularity}`.padStart(5, '0'),
        price: item.price.toFixed(2).padStart(7, '0')
      },
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
