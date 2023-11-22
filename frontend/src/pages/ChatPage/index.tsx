import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../socket";
import { useUser } from "../../modules/user/UserHooks";
import moment from "moment";
import { useMessage } from "../../modules/alert/MessageContext";
import { Swords, User, AlignLeft, Ban } from "lucide-react";
import { useRoom } from "../../modules/room/RoomContext";
import { ChatInvitationSection } from "../../sections/InvitationSection";
import LoadingPage from "../../components/Loading";

const ChatPage = () => {

	const {customError, customAlert} = useMessage();
	const [blocksId, setBlocksId] = useState<Array<number>>([]);
	const { user, token } = useUser();
	const [messageEvents, setMessageEvents] = useState<Array<messageEventInterface>>([]);
	const { chatId } = useParams();
	const [messageValue, setMessageValue] = useState("");

	const [isLoading, setIsLoading] = useState(true);

	const { roomInfo, setRoomInfo, pass, setPass } = useRoom();
	const navigation = useNavigate();
	const [isAdmin, setIsAdmin] = useState(false);

	const fetchMyPermissions = async () => {
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		try {
			const response = await fetch(`/api/chats/me/permission/id/${chatId}`, {
				headers,
			});
			const data = await response.json();
			setIsAdmin(data.admin);
		} catch (error) {
			customError("An error occured. Try again!");
			navigation(`/chat/${chatId}`);
		}
	};

	const onKicked = (value) => {
		if (value.id === user.id)
		{
			customAlert("You have been kicked");
			navigation("/all-rooms");
		}
	}

	useEffect(() => {
		
		setIsLoading(true);

		function onMessageEvent(value: messageEventInterface) {
			setMessageEvents((previous) => [
				...previous,
				{ ...value, time: moment(value.time).format("h:mm a") },
			]);
		}

		socket.on("message", onMessageEvent);
		socket.on("kicked", onKicked);

		fetch(`/api/users/me/blocksIds`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				setBlocksId(response);
			})
			.catch((error) => {
				customError("Something happen. Try again!");
				navigation(`/chat-rooms`);
			});

		return () => {
			socket.emit("leaveRoom", {
				token: token,
				room: parseInt(chatId!, 10),
			});
			socket.off("message", onMessageEvent);
		};
	}, []);



	useEffect(() => {

		if (!roomInfo)
		{
			if (chatId)
			{
				navigation(`/chat/${chatId}`);
			}
			customError("An error occured. Try again!");
			navigation(`/chat/${chatId}`);
		}
		const roomIdInt = roomInfo.id;

		socket.emit("joinRoom", {
			token: token,
			room: roomIdInt,
			password: pass,
		});
		fetchMyPermissions();
		
		fetch(`/api/chats/id/${chatId}/messages`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Password: pass,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				const formattedData: messageEventInterface[] = response.map(
					(item: any) => ({
						senderId: item.senderId,
						username: item.sender.username,
						text: item.text,
						time: moment(item.createdAt).format("h:mm a"),
					})
				);
				setMessageEvents(formattedData);
				setIsLoading(false);
			})
			.catch((error) => {
				customError("Something happen. Try again!");
				navigation(`/chat-rooms`);
			});
	}, [roomInfo]);

	const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		socket.timeout(5000).emit("chatMessage", messageValue, () => {});
		setMessageValue("");
	};

	const mainRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (mainRef.current) {
			mainRef.current.scrollTop = mainRef.current.scrollHeight;
		}
	}, [messageEvents]);

	const sendInvitation = () => {
		fetch(`/api/games/invite/group/${roomInfo.id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				socket.emit('invitationGroupSend', {id: response.id, group: roomInfo.id});
				navigation(`/game/game-lobby/${response.id}`);
			})
			.catch((error) => {
				customAlert("Error inviting user to play!");
			});
		
	};

	return isLoading ? (
		<LoadingPage/>
	) : (
		<>
			<div className="drawer">
				<input
					id="my-drawer"
					type="checkbox"
					className="drawer-toggle"
				/>
				<div className="drawer-content flex flex-row items-center justify-center">
					
		<div className="bg-base-200 flex flex-col items-stretch justify-between h-screen w-[700px] max-w-full max-h-screen">
		<header className="bg-neutral w-100 p-4 flex flex-row items-center justify-between">
			<label
				htmlFor="my-drawer"
				className="btn btn-circle btn-outline"
				>
				<AlignLeft />
			</label>
			<div className="grow text-center">
			<h1 className="text-4xl font-bold text-neutral-content ">
					{roomInfo && roomInfo.name}
			</h1>
			</div>
				<div className="">
								<button
									className="btn btn-circle btn-outline"
									onClick={sendInvitation}
								>
									<Swords />
								</button>
							</div>
			</header>

			<main style={{ flexGrow: "1" }} ref={mainRef} className="p-4 overflow-auto">
				{messageEvents.map((event, index) => {
					if (blocksId.includes(event.senderId))
					{
						return null;
					}
					return (
						<div className={`chat ${event.username === user?.username ? "chat-end" : "chat-start"}`} key={index}>
							<div className="chat-header">
								<NavLink to={`/user/${event.username}`} className={"link-primary inline-block"}>
									{event.username}
								</NavLink>
								{
									(event.username !== user?.username && isAdmin && roomInfo.owner.username !== event.username) &&
								<div className="tooltip cursor-pointer" data-tip="Kick" onClick={() => socket.emit('kick', {kickedId: event.senderId})}>
									<Ban className="inline link-error ml-1" size={12}/>
								</div>
								}
	
							</div>
							<div className="chat-bubble">{event.text}</div>
							<time className="chat-footer opacity-50">
								{event.time}
							</time>
						</div>
					)
				})}
			</main>

			<footer className="bg-base-300 p-4 flex flex-col items-stretch gap-4">
				<form onSubmit={sendMessage} className=" flex items-center gap-2">
					<input className="input input-bordered w-full" type="text" name="message" value={messageValue} onChange={(e) => setMessageValue(e.target.value)} placeholder="Type here" required />
					<input type="submit" name="send" value="Send" className="btn btn-primary text-primary-content " />
				</form>
				<div className="flex items-center gap-4 flex-grow-2 flex-shrink-2">
					<NavLink className="btn btn-neutral flex-basis-50 flex-grow flex-shrink-2" to={"/chat-rooms"}>All rooms</NavLink>
					{user!.id === roomInfo!.ownerId ? (
						<NavLink className="btn btn-neutral flex-basis-50 flex-grow flex-shrink-2" to={`/chat/${roomInfo!.id}/edit`}>Edit chat room</NavLink>
					) : (
						isAdmin && (
							<NavLink className="btn btn-neutral flex-basis-50 flex-grow flex-shrink-2" to={`/edit-chat/${roomInfo!.id}/members`}>Members</NavLink>
						)
					)}
				</div>
			</footer>
		</div>
		</div>
				<div className="drawer-side">
					<label
						htmlFor="my-drawer"
						className="drawer-overlay"
					></label>
					<ul className="menu mt-20 p-4 w-80 bg-base-200 min-h-full gap-4 text-base-content">
			
						<ChatInvitationSection chatId={roomInfo.id} blocks={blocksId}/>
						
					</ul>
				</div>
			</div>
		</>
	);
};
export default ChatPage;
