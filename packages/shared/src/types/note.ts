export interface Note {
    id: string;
    title: string;
    content: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NoteListItem {
    id: string;
    title: string;
    content: string;
    isPublic: boolean;
    tags: { id: string; name: string; color: string }[];
    commentCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteInput {
    title?: string;
    content?: string;
    isPublic?: boolean;
    tagIds?: string[];
}

export interface UpdateNoteInput {
    title?: string;
    content?: string;
    isPublic?: boolean;
    tagIds?: string[];
}
