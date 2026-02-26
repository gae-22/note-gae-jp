export interface Tag {
    id: string;
    name: string;
    color: string;
    noteCount?: number;
    createdAt: string;
}

export interface CreateTagInput {
    name: string;
    color?: string;
}

export interface UpdateTagInput {
    name?: string;
    color?: string;
}
