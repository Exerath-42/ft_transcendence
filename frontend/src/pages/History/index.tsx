import { useEffect, useState } from "react";
import { useAuth } from "../../modules/auth";
import BackButton from "../../components/BackButton";
import { formatDate } from "../../modules/date";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useMessage } from "../../modules/alert/MessageContext";
import LoadingPage from "../../components/Loading";
import "../Leaderboard/leaderboard.css"

const HistoryPage = () => {
	const { userId } = useParams();
	const [userFromId, setUserFromId] = useState<User>();
	const { token } = useAuth();
	const [games, setGames] = useState<Array<Game>>([]);
	const {customError} = useMessage();
	const navigation = useNavigate();

	useEffect(() => {
		const options = {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		if (userId)
		{
			fetch(`/api/users/${userId}`, options)
			.then((response) => response.json())
			.then((response) => setUserFromId(response))
			.catch((err) => {
				customError("Error while fetching users!");
				navigation("/");
			});
		}
		const apiRoute = userId ? `/api/games/user/${userId}` : "/api/games/";
		fetch(apiRoute, options)
			.then((response) => response.json())
			.then((response) => {
			
				setGames(response);
			})
			.catch(() => {
				customError("Error fetching game information!");
				navigation("/");
			});
	}, []);
	return  games ?(
		<>
		<div id="lead" className="h-screen max-h-screen">
			<main>
				<div id="header">
					<h1 id="h1">
						{userId ? userFromId?.username : "Game"} History
					</h1>
				</div>
			<div id="leaderboard">
				<div className="ribbon"></div>
				<table>
					<tr>
						<td className="name">Player 1</td>
						<td className="name">Score</td>
						<td className="name">Player 2</td>
						<td className="name">Score</td>
						<td className="name">Date</td>
						<td className="name">Page</td>
					</tr>
					{games.map((game) => {
						return (
							<tr key={game.id}>
								<td className="name">{game.player1.username}</td>
								<td className="number">{game.score1}</td>
								<td className="name">{game.player2.username}</td>
								<td className="number">{game.score2}</td>
								<td className="number">{formatDate(game.createdAt)}</td>
								<td className="name">
									<NavLink
										to={`/end-game/${game.id}`}
										>
										<button className="exit">Details</button>
									</NavLink>
								</td>
							</tr>
						);
					})}
				</table>
				<div id="buttons">
					<BackButton />
				</div>
			</div>
			</main>
		</div>
		</>
	) : (
		<LoadingPage/>
	);
};

export default HistoryPage;
