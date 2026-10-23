export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data: T;
  pagination?: ApiPagination;
}
