import React, { useState } from "react";
import { useAuth } from "../../modules/auth";
import { NavLink, useNavigate } from "react-router-dom";
import { useMessage } from "../../modules/alert/MessageContext";

const NewRoomPage: React.FC = () => {
	const [roomName, setRoomName] = useState("");
	const { token } = useAuth();
	const [roomPassword, setRoomPassword] = useState("");
	const [isPrivate, setIsPrivate] = useState<boolean>(false);
	const navigation = useNavigate();
	const {customAlert, customError} =  useMessage();
	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = {
			name: roomName,
			password: roomPassword,
			isPrivate: isPrivate,
		};
		fetch("/api/chats", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(formData),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				navigation(`/chat-room/${data.id}`);
			})
			.catch((error) => {
				customAlert("Error creating chat room!");
			});
	};
	return (
		<div
			id="CreateRoomPage"
			className="h-screen flex flex-col items-stretch gap-4"
		>
			<h1 className="text-4xl font-bold ">Create Room</h1>
			<form
				onSubmit={onSubmit}
				className="flex flex-col items-stretch gap-4"
			>
				<input
					type="text"
					name="name"
					value={roomName}
					onChange={(e) => setRoomName(e.target.value)}
					placeholder="Room name"
					className="input input-bordered w-full max-w-xs"
				/>
				<input
					type="password"
					name="password"
					onChange={(e) => setRoomPassword(e.target.value)}
					value={roomPassword}
					placeholder="Password"
					className="input input-bordered w-full max-w-xs"
				/>
				<div className="form-control">
					<label className="label cursor-pointer flex items-center justify-between gap-4">
						<span className="label-text">Is private?</span>
						<input
							type="checkbox"
							name="private"
							checked={isPrivate}
							className="toggle"
							onChange={(e) => setIsPrivate(e.target.checked)}
						/>
					</label>
				</div>
				<input
					type="submit"
					name="submit"
					value="submit"
					className="btn btn-primary btn-wide"
				/>
			</form>
			<NavLink to="/" className="btn btn-wide">
				Back
			</NavLink>
		</div>
	);
};

export default NewRoomPage;
