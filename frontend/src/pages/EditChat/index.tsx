import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../modules/user/UserHooks";
import { Users } from "lucide-react";
import { useMessage } from "../../modules/alert/MessageContext";
import { useRoom } from "../../modules/room/RoomContext";
import BackButton from "../../components/BackButton";
import LoadingPage from "../../components/Loading";


const EditChat = () => {

	const { roomInfo, setRoomInfo, pass, setPass } = useRoom();

	const { token, user } = useUser();
	const navigation = useNavigate();
	const [newRoomName, setNewRoomName] = useState("");
	const [hasPassword, setHasPassword] = useState(false);
	const { chatId } = useParams();
	const [currentRoomPassword, setCurrentRoomPassword] = useState("");
	const [newRoomPassword, setNewRoomPassword] = useState("");
	const [newIsPrivate, setNewIsPrivate] = useState<boolean>(false);

	const {customError, customAlert, customSuccess} = useMessage();

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const payload: {
			name?: string;
			isPrivate: boolean;
			password?: string;
		} = {
			isPrivate: newIsPrivate,
		};
		if (newRoomName != "") payload.name = newRoomName;
		
		if (newRoomPassword !== currentRoomPassword && currentRoomPassword === pass)
		{
			payload.password = newRoomPassword;
		}else if (currentRoomPassword != ""){
			customError("Error: problem with passwords inputs");
			return;
		}

		fetch(`/api/chats/id/${roomInfo.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				setPass("");
				setRoomInfo(null);
				navigation(`/chat-rooms`);
				customSuccess("Chat updated!");
			})
			.catch((error) => {
				customError('Error fetching room id');
				navigation('/');
			});
	};
	const leaveRoom = async () => {
		if (!roomInfo) return;
		const headers = {
			Authorization: `Bearer ${token}`,
			password: pass || "",
		};
		const response = await fetch(`/api/chats/owner/leave/${roomInfo.id}`, {
			headers,
		});
		if (!response.ok) {
			customError('Error while leaving chat');
		} else {
			navigation("/all-rooms");
		}
	};
	useEffect(() => {
		if (!roomInfo)
		{
			if (chatId)
			{
				navigation(`/chat/${chatId}`);
			}
			customError("An error occured. Try again!");
			navigation(`/chat-rooms`);
		}
		setNewIsPrivate(roomInfo.isPrivate);
		setNewRoomName(roomInfo.name);
	}, [roomInfo]);
	return  !roomInfo ? (
		<LoadingPage/>
	) : (
		<div
			id="EditChatPage"
			className="flex flex-col items-center justify-center gap-12 h-screen max-h-screen p-4"
		>
			<h1 className="text-4xl font-bold ">Edit {roomInfo?.name}</h1>
			<form
				onSubmit={onSubmit}
				className="flex flex-col items-stretch gap-4"
			>
				<input
					className="input input-bordered"
					type="text"
					name="name"
					value={newRoomName}
					onChange={(e) => setNewRoomName(e.target.value)}
					placeholder="Room name"
				/>
				{roomInfo.hasPassword && <input
					type="password"
					name="password"
					className="input input-bordered"
					onChange={(e) => setCurrentRoomPassword(e.target.value)}
					value={currentRoomPassword}
					placeholder="Current password"
				/>}
				
				<input
					type="password"
					name="password"
					className="input input-bordered"
					onChange={(e) => setNewRoomPassword(e.target.value)}
					value={newRoomPassword}
					placeholder="New password"
				/>

				<div className="form-control">
					<label className="label cursor-pointer">
						<span className="label-text">Is private?</span>
						<input
							type="checkbox"
							name="private"
							checked={newIsPrivate}
							className="toggle"
							onChange={(e) => setNewIsPrivate(e.target.checked)}
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
			<footer className="text-center flex flex-col items-stretch gap-4 ">
				<NavLink
					to={`/edit-chat/${roomInfo.id}/members`}
					className="btn btn-outline btn-wide"
				>
					<Users />
					Members
				</NavLink>

				<BackButton/>
				<button className="btn btn-error btn-wide" onClick={leaveRoom}>
					Leave Room
				</button>
			</footer>
		</div>
	);
};

export default EditChat;
