import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth";
import { useMessage } from "../../modules/alert/MessageContext";
import LoadingPage from "../../components/Loading";

const ChatRoomsPage = () => {
	const { token } = useAuth();
	const [privateRooms, setPrivateRoom] = useState<Array<Room>>([]);
	const [rooms, setRooms] = useState<Array<Room>>([]);
	const { customError} = useMessage();
	const navigation = useNavigate();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRooms = async () => {
			try {
				const response = await fetch("/api/chats/", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				const data = await response.json();
				setRooms(data);
				setIsLoading(false);
			} catch (error) {
				customError("Error fetching chat rooms!");
				navigation('/')
			}
		};
		

		const fetchPrivateRooms = async () => {
			try {
				const response = await fetch("/api/chats/privates", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				const data = await response.json();
				setPrivateRoom(data);
				fetchRooms();
			} catch (error) {
				customError("Error finding private channels!");
				navigation('/');
			}
		};
		fetchPrivateRooms();
	}, []);

	return (
		isLoading ? <LoadingPage/> :
		<>
		<div className="flex flex-col items-center justify-start gap-4 h-screen max-h-screen">
			<h1 className="text-4xl font-bold tracking-tightsm:text-6xl">
				Chat Rooms:
			</h1>
			<ul className="menu md:menu-horizontal bg-base-200 rounded-box">
				<li>
					<p>Privates:</p>
					<ul>
						{privateRooms.map((room) => (
							<li key={room.id}>
								<NavLink to={room.hasPassword ? `/chat/${room.id}/login` : `/chat/${room.id}/room`}>
									{room.name}
								</NavLink>
							</li>
						))}
					</ul>
				</li>
				<li>
					<p>Publics:</p>
					<ul>
						{rooms.map((room) => (
							<li key={room.id}>
								<NavLink to={room.hasPassword ? `/chat/${room.id}/login` : `/chat/${room.id}/room`}>
									{room.name}
								</NavLink>
							</li>
						))}
					</ul>
				</li>
			</ul>

			<NavLink className="btn btn-primary btn-wide" to="/new-chat-room">
				New Chat
			</NavLink>

			<NavLink className="btn btn-wide" to="/">
				Back
			</NavLink>
		</div>
		</>
	);
};

export default ChatRoomsPage;
