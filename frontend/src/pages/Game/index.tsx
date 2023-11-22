import {useState, useEffect} from 'react';

import {
	Routes,
	Route,
	BrowserRouter as Router,
	useNavigate,

} from "react-router-dom";

import { gameSocket as socket, socket as chatSocket} from "../../socket";
import GameRoomPage from "./GameRoom";
import GameLobbyPage from "./GameLobby";
import { useAuth } from '../../modules/auth';
import { useMessage } from '../../modules/alert/MessageContext';


const GameRouter = () => {
	const {token} = useAuth();
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [isGhostGame, setIsGhostGame] = useState(true);
	const {customError} = useMessage();
	const navigation = useNavigate();
	const onGameError = (data) => 
	{
		customError(data.message || "Something weird happen, try again later!");
		navigation('/');
	}
	const toggleIsGhost = () => {
		setIsGhostGame(!isGhostGame);
	}
	useEffect(() => {
		socket.connect();
		function onConnect() {
			setIsConnected(true);
		}

		socket.on("connect", onConnect);

		socket.on("gameError", onGameError);

		chatSocket.emit("gameRoom", { token: token, status: "start"});

		return () => {
			socket.off("connect");
			socket.off("gameError");
			chatSocket.emit("gameRoom", { token: token, status: "end"});
			socket.disconnect();
		};
	},[]);




	return(
		<Routes>
			<Route path="/game-lobby/:invitation" element={<GameLobbyPage toggleIsGhost={() => toggleIsGhost()} isGhostGame={isGhostGame}/>} />
			<Route path="/game-room/:gameId" element={<GameRoomPage isGhostGame={isGhostGame}/>} />
		</Routes>
	)
}

export default GameRouter;
