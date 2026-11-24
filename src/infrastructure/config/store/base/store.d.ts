export interface PersistenceStore<T> {
    set: (payload: any) => Promise<boolean>,
    get: (key: string) => Promise<T>,
    remove: (key: string) => Promise<number>,
    getAll: () => Promise<T[]>
}
