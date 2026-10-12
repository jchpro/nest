import { type PaginationParams } from '../params/pagination.params.js';
import { type SortingOptionsProvider, type SortingParams } from '../params/sorting.params.js';

/**
 * Data for automatic handling of queries with pagination and sorting.
 */
export type QueryData = PaginationParams & SortingParams & SortingOptionsProvider;