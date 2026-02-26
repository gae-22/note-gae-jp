export interface CreateTokenInput {
    label?: string;
    expiresIn?: '1h' | '1d' | '7d' | '30d';
}

export interface ShareTokenInfo {
    id: string;
    noteId: string;
    label: string | null;
    expiresAt: string;
    isRevoked: boolean;
    shareUrl: string;
    createdAt: string;
}
