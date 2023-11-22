import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth";
import { useMessage } from "../../modules/alert/MessageContext";
import avatar from "./../../assets/pingpong.jpg";
function useQuery() {
	return new URLSearchParams(useLocation().search);
}

function LoginPage({newConn}: {newConn: (boolean) => void;}): JSX.Element {
	const { setToken, setToken2fa } = useAuth();
	const navigate = useNavigate();
	const {customError} = useMessage();
	const query = useQuery();
	const code = query.get("code");
	const state = query.get("state");
	const loginWithCode = async (code: string, state: string) => {
		
		const response = await fetch("/api/auth/signin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ code, state }),
		});
		let isNewUser = false;

		if (response.status === 201) {
			isNewUser = true;
			newConn(true);
		} else if (response.status !== 200){
			customError("Error while login in!");
		}

		try{
			const data = await response.json();
			if (data.tfa) {
				setToken2fa(data.access_token);
				navigate("/2fa-auth");
			} else {
				setToken(data.access_token);
				if (isNewUser)
				{
					navigate("/edit-profile");
				}
				else
					navigate("/");
			}
		}catch(error)
		{
			customError("Error while login!");
		}
	};

	useEffect(() => {
		if (code && state) {
			navigate('/', { replace: true, state: { code: '', state: '' } });
			loginWithCode(code, state);
		}
	}, [code, state]);
	const loginBtn = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		fetch("/api/auth/currState").then((response) => {
			return response.json();
		}).then(response => {
			window.location.href = `${import.meta.env.VITE_FT_ENPOINT}&state=${response.state}`;
		}).catch(err => customError('Ops something happened,try again!'));
	};
	return (
		<>
			<div className="avatar">
				<div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
					<img src={avatar} />
				</div>
			</div>
			<h1 className="text-4xl font-bold texError sending messaget-neutral-content ">
				WELCOME TO PONG
			</h1>
			{code ? (
				<>
					<span className="loading loading-spinner loading-lg"></span>
				</>
			) : (
				<>
					<button
						className="btn btn-primary btn-outline btn-wide"
						onClick={loginBtn}
					>
						42 Login
					</button>
				</>
			)}
		</>
	);
}

export default LoginPage;
