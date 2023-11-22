type SortDirection = "asc" | "desc";
type SupportedFieldTypesTypes = "string" | "number" | "boolean";

type FieldConfig = SortConfig & {
  type: SupportedFieldTypesTypes;
  /**
   * **Not sure about this one**.
   * For now affects only sorting. If it is array it would be converted to string before sorting
   */
  isArray?: boolean;
  /**
   * **Not sure about this one**.
   * if field name should be treated as path e.g.
   * `some.thing` would expect shape like this `[{ some: { thing: ... } }]`
   */
  isObject?: boolean;
  /**
   * if field used for faceting
   */
  facet?: boolean | FacetConfig;
  /**
   * if field used for text search
   */
  text?: boolean;
};

export type Schema = Record<string, FieldConfig>;

export type FacetsConfig<S extends Schema> = {
  schema: S;
  sortConfig?: SortConfig;
  idKey?: string;
};

export type Item<S extends Schema> = {
  [K in keyof S]?: S[K]["type"] extends "string"
    ? string | null | Array<string | null>
    : S[K]["type"] extends "number"
    ? number | null | Array<number | null>
    : S[K]["type"] extends "boolean"
    ? boolean | null | Array<boolean | null>
    : never;
};

type SortConfig = {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale
   */
  locale?: string | string[];
  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options
   */
  options?: Intl.CollatorOptions;
};

type FacetSort = ["value" | "frequency", SortDirection];

type FacetConfig = {
  perPage?: number;
  /**
   * @default ["frequency", "desc"]
   */
  sort?: FacetSort;
  /**
   * @default true
   */
  showZeroes?: boolean;
  /**
   * @default false
   */
  selectedFirst?: boolean;
};
