export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: unknown[];
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}
