import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth";
import { useMessage } from "../alert/MessageContext";

export const useUser = () => {
	const { token } = useAuth();
	const { user, setUser } = useAuth();
	const [loading, setLoading] = useState(true);
	const {customError} = useMessage();
	const fetchUser = useCallback(async () => {
		try {
			const response = await fetch("/api/users/me", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await response.json();

			if (response.ok) {
				setUser(data);
			} else {
			
				throw new Error(data.message);
			}
		} catch (error) {
			customError("Failed to fetch user!");
			window.location.href = "/";
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		if (token) {
			fetchUser();
		} else {
			setUser(null);
			setLoading(false);
		}
	}, [token, fetchUser]);

	const updateUser = async (updatedUserData: Partial<User>) => {
		try {
			const response = await fetch("/api/users/me", {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedUserData),
			});
			const data = await response.json();

			if (response.ok) {
				setUser({ ...data });
				await refresh();
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			throw error;
		}
	};

	const refresh = () => {
		fetchUser();
	};

	return { user, loading, updateUser, refresh, token };
};
