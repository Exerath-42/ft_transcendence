import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../socket";
import { useUser } from "../../modules/user/UserHooks";
import { Swords, User, AlignLeft } from "lucide-react";
import moment from "moment";
import BackButton from "../../components/BackButton";
import InvitationSection from "../../sections/InvitationSection";
import { useMessage } from "../../modules/alert/MessageContext";
import LoadingPage from "../../components/Loading";

const DirectMessagePage: React.FC = () => {
	const { user, token } = useUser();
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [messageEvents, setMessageEvents] = useState<
		Array<messageEventInterface>
	>([]);
	const { recipient } = useParams();
	const [messageValue, setMessageValue] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [recipientInfo, setRecipientInfo] = useState<User>();
	const {customError, customAlert} = useMessage();
	const navigation = useNavigate();

	const fetchRecipientInfo = async () => {
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		try {
			const response = await fetch(`/api/users/profile/${recipient}`, {
				headers,
			});
			if (!response.ok) {
				throw response;
			}

			const data = await response.json();

			setRecipientInfo(data);
			
		} catch (error) {
			customError("Error geting recipient")
			navigation("/");
		}
	};

	useEffect(() => {
		if (socket.active)
		{
			setIsConnected(true);
		}
		setIsLoading(true);
		fetchRecipientInfo();

		function onConnect() {
			setIsConnected(true);
			socket.emit("joinDirect", {
				token: token,
			});
		}

		function onDisconnect() {
		
			setIsConnected(false);
			setTimeout(() => {
				if(!isConnected)
				{
					customError("Socket Disconnected")
					navigation("/");
				}
			}, 3000)
		}
		function onMessageEvent(value: messageEventInterface) {
			
			setMessageEvents((previous) => [
				...previous,
				{ ...value, time: moment(value.time).format("h:mm a") },
			]);
		}
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("messageSent", onMessageEvent);
		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("messageSent", onMessageEvent);
		};
	}, []);

	useEffect(() => {
		if (!recipientInfo)
		{
			return;
		}
		socket.emit("joinDirect", {
			token: token,
		});
		fetch(`/api/direct-messages/${recipient}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
		.then((response) => response.json())
		.then((response) => {
			const formattedData: messageEventInterface[] = response.map(
				(item: any) => ({
					username: item.sender.username,
					text: item.text,
					time: moment(item.createdAt).format("h:mm a"),
				})
			);
			setMessageEvents(formattedData);
			setIsLoading(false);
		})
		.catch((err) => {
			customError("Error fetching messages. Try again!")
			navigation("/");
		});
	}, [recipientInfo]);

	const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const data = {
			message: messageValue,
			recipient: recipient,
		};

		socket.timeout(5000).emit("directMessage", data);
		setMessageValue("");
	};
	const mainRef = useRef<HTMLDivElement>(null);
	const sendInvitation = () => {
		fetch(`/api/games/invite/user/${recipientInfo?.id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				socket.emit('invitationSend', {id: response.id, recipient: recipientInfo?.id});
				navigation(`/game/game-lobby/${response.id}`);
			})
			.catch((error) => {
				customAlert("Error inviting user to play!");
			});
		
	};
	return isLoading && recipientInfo && recipientInfo.id ? (
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
					<div
						className="bg-base-200 flex flex-col items-stretch justify-between h-screen w-[700px] max-w-full max-h-screen"
						id="ChatPage"
					>
						<header className="bg-neutral w-100 p-4 flex flex-row items-center justify-between">
							<label
								htmlFor="my-drawer"
								className="btn btn-circle btn-outline"
							>
								<AlignLeft />
							</label>


							<div className="grow text-center">
								<h1 className="text-4xl font-bold text-neutral-content ">
									{recipient}
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
						<main
							style={{ flexGrow: "1" }}
							ref={mainRef}
							className="p-4 overflow-auto"
						>
							{messageEvents.map((event, index) => (
								<div
									className={`chat ${
										event.username === user?.username
											? "chat-end"
											: "chat-start"
									}`}
									key={index}
								>
									<div className="chat-header">
										<NavLink
											to={`/user/${event.username}`}
											className={"link-primary"}
										>
											{event.username}
										</NavLink>
									</div>
									<div className="chat-bubble">
										{event.text}
									</div>
									<time className="chat-footer opacity-50">
										{event.time}
									</time>
								</div>
							))}
						</main>
						<footer className="bg-base-300 p-4 flex flex-col items-stretch gap-4">
							<form
								onSubmit={sendMessage}
								className="flex items-center gap-2"
							>
								<input
									className="input input-bordered w-full"
									type="text"
									name="message"
									value={messageValue}
									onChange={(e) =>
										setMessageValue(e.target.value)
									}
									placeholder="Type here"
									disabled={isSending}
									required
								/>
								<input
									type="submit"
									name="send"
									value="Send"
									className="btn btn-primary text-primary-content "
								/>
							</form>
							<div className="flex items-center gap-4 flex-grow-2 flex-shrink-2">
								<BackButton className="btn btn-neutral flex-basis-50 flex-grow flex-shrink-2" />
							</div>
						</footer>
					</div>

				</div>
				<div className="drawer-side">
					<label
						htmlFor="my-drawer"
						className="drawer-overlay"
					></label>
					<ul className="menu p-4 w-80 bg-base-200 min-h-full gap-4 text-base-content">
			
						<InvitationSection dmUserId={recipientInfo?.id!}/>
						
					</ul>
				</div>
			</div>
		</>
	);
};
export default DirectMessagePage;
