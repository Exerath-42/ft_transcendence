import { createContext } from "react";

export type AuthContextType = {
	token: string | null;
	token2fa: string | null;
	user: User | null;
	setToken: (token: string | null) => void;
	setToken2fa: (token: string | null) => void;
	setUser: (user: User | null) => void;
	logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
	token: null,
	token2fa: null,
	user: null,
	setToken: () => {
	},
	setToken2fa: () => {
	},
	setUser: () => {
	},
	logout: () => {
	},
});
