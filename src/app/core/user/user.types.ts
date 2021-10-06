import { UserRole } from "./user.roles";

export interface User
{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
    role: UserRole
}
