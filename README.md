# Facets monorepo

It is the monorepo repository:

- [InstantSearch adapter for pagefind](/packages/pagefind-instantsearch/) ![npm version](https://img.shields.io/npm/v/%40stereobooster/pagefind-instantsearch)
- and [demo site](/packages/demo/README.md)

## Development

```sh
pnpm i
pnpm run dev
```

## TODO

> [!WARNING]  
> Appearantly pagefind also supports [faceted search](https://pagefind.app/docs/js-api-filtering/) and [loading data from json](https://pagefind.app/docs/node-api/). I found out it only after implemented this library. I want to try it out

- CLI to covert JSON to pagefind index
  - https://pagefind.app/docs/node-api/
  - it can use the same schema as [`facets`](/packages/pagefind-instantsearch/src/Facets.ts)
    - id → url
    - text → content
    - facets → filters
    - other → meta
  - maybe cosmiconfig to pass configuration
- adapter for instantsearch
  - can reuse schema to recognize numeric facets to calculate `min` and `max` of facet
