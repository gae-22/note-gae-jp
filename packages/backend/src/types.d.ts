declare module 'ulid' {
    export function ulid(seed?: number): string;
}

declare module 'argon2id' {
    export function hash(password: string): Promise<string>;
    export function verify(hash: string, password: string): Promise<boolean>;
}
