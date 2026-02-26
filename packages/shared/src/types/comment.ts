export interface Comment {
  id: string;
  noteId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  authorName: string;
  body: string;
}
