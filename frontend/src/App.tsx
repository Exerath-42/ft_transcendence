import {
	Routes,
	Route,
	BrowserRouter as Router,
	Navigate,
	useNavigate,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import NavbarPage from "./pages/Navbar/navbar";
import EditProfile from "./pages/EditProfile";
import AllUsers from "./pages/AllUsers";
import UserProfile from "./pages/UserProfile";
import { useUser } from "./modules/user/UserHooks";
import ChatRoomsPage from "./pages/ChatRooms";
import NewRoomPage from "./pages/NewRoom";
import EditChat from "./pages/EditChat";
import ChatNotFoundPage from "./pages/ChatRooms/ChatNotFound";
import ChatMembersPage from "./pages/EditChat/ChatMembers";
import DirectMessagePage from "./pages/DirectMessages";
import { useMessage } from "./modules/alert/MessageContext";
import TwoFAPage from "./pages/TFA";
import GameRouter from "./pages/Game";
import EndGamePage from "./pages/EndGamePage";
import HistoryPage from "./pages/History";
import LeaderboardPage from "./pages/Leaderboard";
import ChatRouter from "./pages/ChatRouter";
import { useEffect, useState } from "react";
import { useAuth } from "./modules/auth";

import { socket } from "./socket";
import LoadingPage from "./components/Loading";


function AuthRoutes({newConn}: {newConn: (boolean) => void;}): JSX.Element {
	return (
		<Routes>
			<Route path="/" element={<LoginPage newConn={newConn}/>} />
			<Route path="/2fa-auth" element={<TwoFAPage />} />
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	);
}

function ProtectedRoutes({isNewConn, setIsNewConn}: {isNewConn: boolean, setIsNewConn: (boolean) => void }): JSX.Element {
	const [isConnect, setIsConnected] = useState<boolean>(false);
	const { token, logout } = useAuth();
	const navigation = useNavigate();
	const {customError} = useMessage();
	useEffect(() => {
		function onChatError(value) {
			if (value.msg === "user already conected")
			{
				alert("User already connected")
				logout();
				return;
			}
			customError(value.msg);
		}

		function onConnect() {
			if (token) {
				socket.emit("online", { token: token });
			}
			setIsConnected(true);
		}

		function onDisconnect() {
			
			setIsConnected(false);
			customError("Connetion closed!");
		}
		socket.connect();
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("error", onChatError);
		if (isNewConn)
		{
			setIsNewConn(false);
			navigation('/edit-profile');
		}
		return () => {
			socket.off("connect", onConnect);
			socket.off("error", onChatError);
			socket.off("disconnect", onDisconnect);
		};
	}, []);
	return (
		<Routes>
			<Route path="/" element={<DashboardPage />} />
			<Route path="/edit-profile" element={<EditProfile />} />
			<Route path="/all-users" element={<AllUsers />} />
			<Route path="/user/:username" element={<UserProfile />} />

			<Route path="/chat-rooms" element={<ChatRoomsPage />} />
			<Route
				path="/messages/:recipient"
				element={<DirectMessagePage />}
			/>
			<Route path="/new-chat-room" element={<NewRoomPage />} />
			<Route path="/edit-chat/:room" element={<EditChat />} />
			<Route
				path="/edit-chat/:room/members"
				element={<ChatMembersPage />}
			/>
			<Route path="/chat-not-found" element={<ChatNotFoundPage />} />
			<Route path="/game/*" element={<GameRouter />} />
			<Route path="/chat/:chatId/*" element={<ChatRouter/>}/>
			<Route path="/end-game/:gameId" element={<EndGamePage />} />
			<Route path="/history" element={<HistoryPage />} />
			<Route path="/leaderboard" element={<LeaderboardPage />} />
			<Route path="/history/:userId" element={<HistoryPage />} />
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	);
}

const NotificationColumn = () => {
	const {messages} = useMessage();
	const statusColor = (type) => {
		if (type === "success")
			return "alert-success";
		if (type === "warning")
			return "alert-warning";
		if (type === "error")
			return "alert-error";
		return "";
	};
	const statusIcon = (type) => {
		if (type === "success")
			return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
		if (type === "warning")
			return  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
		if (type === "error")
			return<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
		return "";
	};
	return (
		<div className="flex flex-col-reverse absolute bottom-4 right-4 gap-4">
			{messages.map(message => {
				return (
					<div key={message.id} className={`alert ${statusColor(message.type)}`}>
					
						{statusIcon(message.type)}
						<span>{message.message}</span>
					</div>
				)
			})}
		</div>
	)
}

function App() {
	const { user, loading } = useUser();
	const [isFirstConnexion, setIsFirstConnexion] = useState(false);
	return (loading ? (
		<LoadingPage/>
		) : user ? (
			<Router>
			<NavbarPage />
			<ProtectedRoutes isNewConn={isFirstConnexion} setIsNewConn={setIsFirstConnexion}/>
			<NotificationColumn/>
		</Router>
	) : (
		<Router>
			<AuthRoutes newConn={setIsFirstConnexion}/>
			<NotificationColumn/>
		</Router>
	))
}

export default App;
