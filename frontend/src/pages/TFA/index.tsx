import { useEffect, useState } from "react";
import { useAuth } from "../../modules/auth";
import { useMessage } from "../../modules/alert/MessageContext";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

const TwoFAPage = () => {
	const { setToken, setToken2fa} = useAuth();
	const [tfaCode, setTfaCode] = useState<string>("");
	const [tfaError, setTfaError] = useState<string | null>(null);
	const [token2fa, setStateToken2fa] = useState();
	const {customError} = useMessage();
	const navigation = useNavigate();
	useEffect(() => {
		const storedToken = localStorage.getItem("token2fa");
		if (!storedToken)
		{
			customError("Unexpected error, try again!");
			navigation('/');
			return;
		}
		setStateToken2fa(JSON.parse(storedToken));
		return (() => {
			setToken2fa(null);
		})
	}, []);
	const submitTfa = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const options = {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/x-www-form-urlencoded',
			  Authorization: `Bearer ${token2fa}`
			},
			body: new URLSearchParams({twoFactorAuthenticationCode: tfaCode})
		  };
		  fetch('/api/auth/2fa/authenticate', options)
		  .then(response => response.json())
			.then(response => {
				if (response.error) {
					
					throw {
					  message: response.message || 'API returned an error',
					  status: response.status || 400
					};
				  }
				setToken2fa(null);
				setToken(response.access_token);
			})
			.catch(err => {
				if (err.message && err.statusCode) {
					setTfaError(`Error ${err.statusCode}: ${err.message}`);
				  } else {
					setTfaError(err.message);
				  }
			});
	}
	return (
		<div className="text-center flex flex-col items-stretch gap-4">
			
				<form onSubmit={submitTfa} className="text-center flex flex-col items-center justify-start gap-8">
				<h1 className="text-4xl font-bold ">2FA Auth</h1>
				<input
					required
					type="text"
					name="tfaCode"
					placeholder="Code for 2FA auth"
					value={tfaCode}
					onChange={(e) => setTfaCode(e.target.value)}
					className={`input input-bordered w-full max-w-xs text-center ${tfaError && "input-error text-error"}`}
					/>
					<input type="submit" className={`btn ${tfaError ? "btn-error" : "btn-success"}`} name="submit" value="submit"/>
			</form>
			<BackButton/>
		</div>
	);
}

export default TwoFAPage;