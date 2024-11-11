/**
 * Query params for sorting without validation of the `sortBy` field.
 */
export interface SortingParams {
  readonly sortBy?: string;
  readonly sortDesc?: boolean;
}

/**
 * Provides an array of valid options for the {@link SortingParams#sortBy}` field.
 */
export interface SortingOptionsProvider {
  readonly sortOptions?: readonly string[];
}
