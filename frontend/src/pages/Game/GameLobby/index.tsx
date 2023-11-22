import { useEffect, useState } from "react";

import { NavLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../modules/auth";
import { gameSocket as socket } from "../../../socket";

const GameLobbyPage = ({toggleIsGhost, isGhostGame}: {toggleIsGhost: () => void; isGhostGame: boolean}) => {
	const { token, user } = useAuth();
	const navigation = useNavigate();

	const [message, setMessage] = useState("Waiting for your opponent");
	const [isLoading, setIsLoading] = useState(true);

	const { invitation } = useParams();

	useEffect(() => {
		socket.emit("joinLobby", {
			token: token,
			invitation: invitation,
		});

		function onMatchedEvent(value: any) {
			if (value && value.game && value.game.id) {
				setIsLoading(false);
				const opponent =
					value.game.player1Id === user?.id
						? value.game.player2.username
						: value.game.player1.username;
				setMessage(`You will play against ${opponent}. Have Fun!`);
				setTimeout(() => {
					navigation(`/game/game-room/${value.game.id}`);
				}, 2000);
			}
		}

		socket.on("matched", onMatchedEvent);
	}, []);

	return (
		<div className="flex flex-col items-center justify-center h-screen max-h-screen">
			<h1 className="text-4xl font-bold text-neutral-content ">
				Game Lobby
			</h1>
			<p className="text-info text-2xl ">{message}</p>

			{isLoading && (
				<span className="loading loading-spinner loading-lg m-2"></span>
			)}
			{isLoading && (
					<div className="form-control">
					<label className="label cursor-pointer flex flex-col gap-2">
					  <span className="label-text text-primary-focus">Ghost Mode</span>
					  
							  <input type="checkbox" className="toggle toggle-lg" name="ghost" checked={isGhostGame} onChange={toggleIsGhost} disabled={!isLoading}/>
				  </label>
				  </div>
			)}
			<NavLink className="btn btn-outline glass text-primary btn-wide" to="/">
				Back
			</NavLink>
		</div>
	);
};

export default GameLobbyPage;
