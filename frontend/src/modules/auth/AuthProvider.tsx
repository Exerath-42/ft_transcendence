import { useCallback, useMemo, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({
	children,
}: {
	children: JSX.Element;
}): JSX.Element {
	const storedToken = localStorage.getItem("token");
	const [token, setToken] = useState<string | null>(
		storedToken ? JSON.parse(storedToken) : null
	);

	const [token2fa, setToken2fa] = useState<string | null>(null);

	const [user, setUser] = useState<User | null>(null);

	const logout = useCallback(() => {
		setToken(null);
		localStorage.removeItem("token");
		window.location.href = "/";
	}, []);

	const setTokenAndSave = useCallback(
		(newToken: string | null) => {
			if (JSON.stringify(newToken) !== JSON.stringify(token)) {
				setToken(newToken);

				if (newToken) {
					localStorage.setItem("token", JSON.stringify(newToken));
				} else {
					localStorage.removeItem("token");
				}
			}
		},
		[setToken, token]
	);

	const setToken2faAndSave = useCallback(
		(newToken2fa: string | null) => {
			if (JSON.stringify(newToken2fa) !== JSON.stringify(token2fa)) {
				setToken2fa(newToken2fa);

				if (newToken2fa) {
					localStorage.setItem(
						"token2fa",
						JSON.stringify(newToken2fa)
					);
				} else {
					localStorage.removeItem("token2fa");
				}
			}
		},
		[setToken2fa, token2fa]
	);

	useEffect(() => {
	
	
		const fetchUser = async () => {
			if (token) {
				try {
					const response = await fetch("/api/users/me", {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (!response.ok) {
						throw response;
					} else {
						const data = await response.json();
					}
				} catch (error) {
					logout();
					throw error;
					
				}
			}
		};

		fetchUser();
	}, [token, setTokenAndSave, logout]);

	const value = useMemo(
		() => ({
			token,
			token2fa,
			setToken: setTokenAndSave,
			logout,
			user,
			setUser,
			setToken2fa: setToken2faAndSave,
		}),
		[
			token,
			token2fa,
			setTokenAndSave,
			logout,
			user,
			setUser,
			setToken2faAndSave,
		]
	);
	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
