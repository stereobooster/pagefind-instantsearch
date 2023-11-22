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

- CLI to covert JSON to pagefind index
  - maybe cosmiconfig to pass configuration
    - it can use the same schema as [`facets`](/packages/pagefind-instantsearch/src/Facets.ts)
    - input
    - output
- adapter for instantsearch
  - https://pagefind.app/docs/js-api-filtering/
  - filtering for numeric facets
  - sorting
  - search for facets
- update readme
