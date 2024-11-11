import { PaginationParams } from '../params/pagination.params';
import { SortingOptionsProvider, SortingParams } from '../params/sorting.params';

/**
 * Data for automatic handling of queries with pagination and sorting.
 */
export type QueryData = PaginationParams & SortingParams & SortingOptionsProvider;