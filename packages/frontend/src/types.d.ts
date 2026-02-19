declare module 'argon2id' {
    const argon2id: {
        hash(password: string): Promise<string>;
        verify(hash: string, password: string): Promise<boolean>;
    };
    export default argon2id;
}
