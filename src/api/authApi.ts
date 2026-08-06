import apiClient from './client.ts';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface AuthResponse {
    userId: string;
    email: string;
    fullName: string;
    accessToken: string;
    refreshToken: string;
}

export const authApi = {
    login: (data: LoginRequest) =>
        apiClient.post<AuthResponse>('/auth/login', data),

    register: (data: RegisterRequest) =>
        apiClient.post<AuthResponse>('/auth/register', data),

    refresh: (refreshToken: string) =>
        apiClient.post<AuthResponse>('/auth/refresh', null, {
            headers: {Authorization: `Bearer ${refreshToken}`},
        }),
};