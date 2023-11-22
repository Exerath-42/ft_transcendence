import { useContext } from "react";
import { AuthContext, AuthContextType } from "./AuthContext";

const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	return context;
};

export default useAuth;
