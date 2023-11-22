import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../modules/user/UserHooks";
import BackButton from "../../components/BackButton";
import { useMessage } from "../../modules/alert/MessageContext";
import LoadingPage from "../../components/Loading";
import "./leaderboard.css"

const LeaderboardPage = () => {
	const [allUsers, setAllUsers] = useState<Array<User>>([]);
	const { token } = useUser();
	const {customError} = useMessage();
	const navigation = useNavigate();

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/users/leaderboard", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw response;
				} else {
					const data = await response.json();
					setAllUsers(data);
					setIsLoading(false);
					
				}
			} catch (error) {
				customError("Error fetching leaderboard info!");
				navigation("/");
			}
		};
		fetchData();
	}, []);
	return (
		isLoading ? <LoadingPage/> :
		 <>
		<div id="lead" className="h-screen max-h-screen">
			<main>
				<div id="header">
					<h1 id="h1">
						Leaderboard
					</h1>
				</div>
			<div id="leaderboard">
			<div className="ribbon"></div>
				<table>
					<tr>
						<td className="name" >User No.</td>
						<td className="name">Name</td>
						<td className="name">Games</td>
						<td className="name">Wins</td>
						<td className="name">Losses</td>
						<td className="name">Profile</td>
					</tr>
					{allUsers.map((user, idx) => {
					return (
					<tr key={user.id}>
						<td className="number">{idx + 1}</td>
						<td className="name">{user.username}</td>
						<td className="number">{user.wins + user.losses}</td>
						<td className="number">{user.wins}</td>
						<td className="number">{user.losses}</td>
						<td className="name">
							<NavLink
								to={`/user/${user.username}`}
								>
								<button className="exit">Profile</button>
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
	);
};

export default LeaderboardPage;
