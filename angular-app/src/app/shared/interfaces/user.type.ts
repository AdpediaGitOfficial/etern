export interface User {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    token?: string;
    [key: string]: any;
}
