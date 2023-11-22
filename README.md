# Facets monorepo

It is the monorepo repository:

- [InstantSearch adapter for pagefind](/packages/pagefind-instantsearch/) ![npm version](https://img.shields.io/npm/v/%40stereobooster/pagefind-instantsearch)
- and [demo site](/packages/demo/)

## Idea

Idea is to create InstantSearch adapter for pagefind and build the same demo site as I did for [facets](https://github.com/stereobooster/facets). This way we can compare "apples to apples".

In order to do so I wanted to use same Schema as in **facets**:

- [to convert JSON file to pagefind index](/packages/demo/bin/pfis.js)
- [to convert pagefind response to InstantSearch Hit](/packages/pagefind-instantsearch/src/adaptResponse.ts)

I started implementation with hardcoded conversion. I managed to create working demo. But I realized that pagenfind can't be used as general faceted search engine.

### Convertion

pagefind supports only string values, so all values need to be converted to strings before indexing and back to initial type on the client side.

Indexing:

```js
brand: [item.brand],
categories: item.categories,
price: [`${item.price}`],
rating: [`${item.rating}`],
free_shipping: [`${item.free_shipping}`],
```

Client side:

```ts
{
  objectID: item.id,
  ...data.meta,
  categories: data.filters.categories,
  price: parseFloat(data.filters.price[0]),
  rating: parseFloat(data.filters.rating[0]),
}
```

### Sorting

To sort by numbers we need to convert values to alphabetically sortable strings:

```js
sort: {
  popularity: `${item.popularity}`.padStart(5, '0'),
  price: item.price.toFixed(2).padStart(7, '0')
},
```

### Stats for numerical facets

Because there is no support for number in order to get stats we need to conver strings to numbers on the client side and calculate stats:

```ts
if (schema[field]?.type === "number") {
  const values: number[] = [];
  entries.forEach((a) => values.push(parseFloat(a[0])));
  facetsStats[field] = {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
```

### Filter for numeric fields

I didn't implement filter for numeric fields, like `price >= 40 AND price <= 100`. Price slider doesn't work in the deme

## Status

After I realized that it is not practical to use as general faceted search engine I gave up and didn't finish code for schema transformation.

**This code is not recomended for prodcution use**.

## Development

```sh
pnpm i
pnpm run dev
```

## TODO

- CLI to covert JSON to pagefind index
  - maybe cosmiconfig to pass configuration
    - it can use the same schema as [`facets`](/packages/pagefind-instantsearch/src/Facets.ts)
    - input
    - output
- adapter for instantsearch
  - filtering for numeric facets
