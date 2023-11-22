import { useState } from "react";
import BackButton from "../../components/BackButton";

const ChatLoginPage = ({onLogin} : {onLogin: (password: string) => void}) => {
	const [chatPass, setChatPass] = useState<string>("");

	const submitChatPass = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onLogin(chatPass);
	};

	return (
		<div className="flex flex-col h-screen max-h-screen text-center items-stretch gap-4">
			<form
				onSubmit={submitChatPass}
				className="text-center flex flex-col gap-4"
			>
				<h1 className="text-4xl font-bold ">Private chat</h1>
				<input
					type="password"
					name="chatPassword"
					placeholder="Chat password"
					value={chatPass}
					onChange={(e) => setChatPass(e.target.value)}
					className={`input input-bordered w-full max-w-xs text-center `}
				/>

				<input
					type="submit"
					className={`btn btn-success`}
					name="submit"
					value="submit"
				/>
			</form>
			<BackButton/>
		</div>
	);
};

export default ChatLoginPage;
