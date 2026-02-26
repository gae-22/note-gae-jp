export interface LoginInput {
    username: string;
    password: string;
}

export interface AuthUser {
    id: string;
    username: string;
}

export interface SessionInfo {
    user: AuthUser;
}
