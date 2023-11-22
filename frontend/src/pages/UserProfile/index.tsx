import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../modules/user/UserHooks";
import {
	UserPlus,
	UserCheck,
	Lock,
	Unlock,
	MessagesSquare,
} from "lucide-react";
import BackButton from "../../components/BackButton";
import { useMessage } from "../../modules/alert/MessageContext";
import {socket} from "./../../socket";
import LoadingPage from "../../components/Loading";

function findClosestLowerMultipleOf5(n: number) {
	return Math.floor(n / 5) * 5;
}
const FriendButton = ({
	user,
	friend,
	addFriend,
	removeFriend,
}: {
	user: User;
	friend: User;
	addFriend: () => void;
	removeFriend: () => void;
}) => {
	const areFriends = user.friends?.some((f) => f.id === friend.id) ?? false;
	return areFriends ? (
		<button
			className="btn btn-secondary lg:tooltip lg:tooltip-bottom"
			data-tip="Remove Friend"
			onClick={removeFriend}
		>
			<UserCheck />
		</button>
	) : (
		<button
			className="btn btn-secondary btn-outline lg:tooltip lg:tooltip-bottom"
			data-tip="Add Friend"
			onClick={addFriend}
		>
			<UserPlus />
		</button>
	);
};

const BlockButton = ({
	user,
	block,
	addBlock,
	removeBlock,
}: {
	user: User;
	block: User;
	addBlock: () => void;
	removeBlock: () => void;
}) => {
	const areBlocked = user.blocks?.some((f) => f.id === block.id) ?? false;
	return areBlocked ? (
		<button
			className="btn btn-secondary  lg:tooltip lg:tooltip-bottom"
			data-tip="Remove Block"
			onClick={removeBlock}
		>
			<Lock />
		</button>
	) : (
		<button
			className="btn btn-secondary btn-outline lg:tooltip lg:tooltip-bottom"
			data-tip="Add Block"
			onClick={addBlock}
		>
			<Unlock />
		</button>
	);
};

const getRankPosition = async (userId: number, token: string, customError: (string) => void) => {
	try {
		const response = await fetch(`/api/users/leaderboard/${userId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		if (!response.ok) {
			throw response;
		} else {
			const data = await response.json();
			return data;
		}
	} catch (error) {
		customError("Erro trying to fetch user data!");
		return 0;
	}
};

const FriendCard = ({friend} : {friend: User}) => {
	const [friendStatus, setFriendStatus] = useState<String>(friend.status === "ONLINE" ? "Online" : "Offline");
	useEffect(() => {
		socket.on("someoneOnline", (data) => {
			if (data.id === friend.id)
			{
				setFriendStatus("Online");
			}
		});
		socket.on("someoneOffline", (data) => {
			if (data.id === friend.id)
			{
				setFriendStatus("Offline");
			}
		});
		socket.on("gameStatus", (data) => {
			if (data.id === friend.id)
			{
				setFriendStatus(data.status === "start" ? "Playing" : "Online");
			}
		});
		return(() => {
			socket.off("someoneOnline");
			socket.off("someoneOffline");
			socket.off("gameStatus");
		});
	}, []);
	const statusColor = (
		() => 
	{
		if (friendStatus === "Online")
			return "link-success";
		if (friendStatus === "Offline")
			return "link-error";
		if (friendStatus === "Playing")
			return "link-info";
		return "";
	}
	)();
	return (<NavLink
		key={friend.id}
		to={`/user/${friend.username}`}
		className="card w-56 bg-base-200 shadow-xl overflow-hidden"
	>
		<figure>
			<img src={friend.image_url} alt="Shoes" />
		</figure>
		<div className="card-body items-center text-center">
			<h2 className="card-title ">
				{friend.username}
			</h2>
			<p className={statusColor}>{friendStatus}</p>
		</div>
	</NavLink>);
}

const ProfileCard = ({user} : {user: User}) => {
	return (<NavLink
		key={user.id}
		to={`/user/${user.username}`}
		className="card w-56 bg-base-200 shadow-xl overflow-hidden"
	>
		<figure>
			<img src={user.image_url} />
		</figure>
		<div className="card-body items-center text-center">
			<h2 className="card-title ">{user.username}</h2>
			
		</div>
	</NavLink>)
}

export default function UserProfile(): JSX.Element {
	const { user, token, refresh } = useUser();
	const [profileInfo, setProfileInfo] = useState<User>();
	const [ranking, setRanking] = useState(0);
	const { username } = useParams();
	const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
	const [filterText, setFilterText] = useState<string>("");
	const navigation = useNavigate();
	const {customError, customAlert} = useMessage();
	useEffect(() => {
		return (() => {
			socket.off("changeName");
		})

	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`/api/users/profile/${username}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw(response);
				} else {
					const data = await response.json();
					const ranking = await getRankPosition(data.id, token!, customError);
					setRanking(ranking);
					setProfileInfo(data);
					
					setFilteredFriends(data.friends);
				}
			} catch (error) {
				customError("Error fetching user information!");
			}
		};
		socket.on("changeName", (data) => {
			if (data.oldName === username)
			{
				customAlert("This user changed his name!");
				navigation(`/user/${data.newUsername}`);
			}
		});
		fetchData();
	}, [username]);
	const addFriend = async () => {
		try {
			const response = await fetch(
				`/api/users/me/friends/${profileInfo?.username}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				throw response;
			} else {
				const data = await response.json();
				await refresh();
			}
		} catch (error) {
			customAlert("Error adding friend");
		}
	};
	const removeFriend = async () => {
		try {
			const response = await fetch(
				`/api/users/me/friends/${profileInfo?.username}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				throw response;
			} else {
				const data = await response.json();
				refresh();
			}
		} catch (error) {
			customAlert("Error removing friend!");
		}
	};
	const addBlock = async () => {
		try {
			const response = await fetch(
				`/api/users/me/blocks/${profileInfo?.username}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				throw response;
			} else {
				const data = await response.json();
				await refresh();
			}
		} catch (error) {
			customAlert("Error blocking user!");
		}
	};
	const removeBlock = async () => {
		try {
			const response = await fetch(
				`/api/users/me/blocks/${profileInfo?.username}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				throw response;
			} else {
				const data = await response.json();
				refresh();
			}
		} catch (error) {
			customAlert("Error removing block");
		}
	};
	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setFilterText(text);
		if (!profileInfo?.friends) return;
		const newFilteredFriends = profileInfo?.friends.filter((friend) =>
			friend?.username?.toLowerCase().startsWith(text.toLowerCase())
		);
		setFilteredFriends(newFilteredFriends);
	};
	return profileInfo && user ? (
		<div
			id="profile-info"
			className="flex flex-col items-center justify-start gap-y-4 py-4 min-h-screen  w-100"
		>
			<header className="text-center flex flex-col items-center justify-center gap-4">
				<div className={`avatar`}>
					<div className="w-24 rounded-full">
						<img src={profileInfo?.image_url} />
					</div>
				</div>
				<h1 className="text-4xl font-bold ">{profileInfo?.username}</h1>
				<div className="grid grid-flow-col gap-5 text-center auto-cols-max">
					<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
						<h5 className="countdown font-mono text-5xl">
							<h5 style={{ "--value": ranking } as React.CSSProperties}></h5>
						</h5>
						Ranking
					</div>
					<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
						<h5 className="countdown font-mono text-5xl">
							<h5
								style={{ "--value": profileInfo.wins } as React.CSSProperties}
							></h5>
						</h5>
						Wins
					</div>
					<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
						<h5 className="countdown font-mono text-5xl">
							<h5
								style={{ "--value": profileInfo.losses } as React.CSSProperties}
							></h5>
						</h5>
						Losses
					</div>
				</div>
				<h3>Achievements:</h3>
				<ul>
					<li>{ranking <= 5 && "TOP 5 Players"}</li>
					<li>
						{findClosestLowerMultipleOf5(
							profileInfo.wins + profileInfo.losses
						) > 0 &&
							findClosestLowerMultipleOf5(
								profileInfo.wins + profileInfo.losses
							) + " Games"}
					</li>
					<li>
						{findClosestLowerMultipleOf5(profileInfo.wins) > 0 &&
							findClosestLowerMultipleOf5(profileInfo.wins) +
								" Wins"}
					</li>
				</ul>
				{user?.id !== profileInfo.id ? (
					<div className="btn-group ">
						<FriendButton
							user={user}
							friend={profileInfo}
							addFriend={addFriend}
							removeFriend={removeFriend}
						/>
						<BlockButton
							user={user}
							block={profileInfo}
							addBlock={addBlock}
							removeBlock={removeBlock}
						/>
						<button
							className="btn btn-secondary btn-outline lg:tooltip lg:tooltip-bottom"
							
							onClick={() =>
								navigation(`/messages/${profileInfo.username}`)
							}
							data-tip="Message"
						>
							<MessagesSquare />
						</button>
					</div>
				) : (
					<NavLink
						to={"/edit-profile"}
						className="btn btn-primary btn-wide"
					>
						Edit profile
					</NavLink>
				)}
				<NavLink
					to={`/history/${profileInfo.id}`}
					className="link-primary"
				>
					Game History
				</NavLink>
				<h2 className="text-2xl font-bold ">Friends</h2>
				<input
					value={filterText}
					onChange={handleFilterChange}
					type="text"
					placeholder="Filter by username"
					className="input input-bordered"
				/>
			</header>
			<main className="flex flex-row items-baseline justify-center gap-4 flex-grow-2 flex-wrap align-top overflow-y-auto">
				{filteredFriends && filteredFriends.length > 0 ? (
					filteredFriends.map((friend) => (user?.id !== profileInfo.id) ? (
						<ProfileCard user={friend} key={friend.id}/>
					) : (
						<FriendCard friend={friend} key={friend.id}/>
					))
				) : (
					<li>No friends available</li>
				)}
			</main>

			<footer className="text-center">
				<BackButton/>
			</footer>
		</div>
	) : (
		<LoadingPage/>
	);
}
