import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../modules/user/UserHooks";
import { UserPlus } from "lucide-react";
import { useMessage } from "../../../modules/alert/MessageContext";
import BackButton from "../../../components/BackButton";
import { useRoom } from "../../../modules/room/RoomContext";
import LoadingPage from "../../../components/Loading";
import "../../Leaderboard/leaderboard.css"


const ChatMembersPage = () => {

	const { roomInfo, setRoomInfo, pass, setPass } = useRoom();
	const navigation = useNavigate();
	const { token } = useUser();
	const { room } = useParams();
	const [members, setMembers] = useState<Array<RoomMember>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [allUsers, setAllUsers] = useState<Array<User>>([]);
	

	const {customError, customAlert} = useMessage();

	const fetchMyPermissions = async () => {
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		try {
			const response = await fetch(
				`/api/chats/me/permission/id/${room}`,
				{
					headers,
				}
			);
			if (!response.ok) {
				throw response;
			}

			const data = await response.json();
			if (!data.admin) {
				navigation("/");
			}
		} catch (error) {
			customError("Error fetching users permissions");
		}
	};
	const fetchAllUsers = async () => {
		try {
			const response = await fetch("/api/users/", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw response;
			} else {
				const data = await response.json();
				setAllUsers(data);
			}
		} catch (error) {
			customError("Error getting list of users!");
			navigation("/");
		}
	};
	const fetchPermission = async () => {
		fetch(`/api/chats/permissions/${roomInfo?.name}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				
				setMembers(response);
			})
			.catch((err) => {
				customError("Error getting list of permissions!");
				navigation("/");
			});
	};

	useEffect(() => {
		if (roomInfo) {
			fetchAllUsers();
			fetchPermission();
			fetchMyPermissions();

			setIsLoading(false);
		} else {
			setTimeout(() => {
				if (!roomInfo)
				{
					customError("Error getting room info!");
					navigation("/");
				}
			},1000)
		}
	}, [roomInfo]);

	const handleChange = async (
		index: number,
		field: "member" | "admin" | "mute"
	) => {
		setMembers(
			members.map((member, i) =>
				i === index ? { ...member, [field]: !member[field] } : member
			)
		);

		const memberToUpdate = members[index];
		const updatedValue = !memberToUpdate[field];


		try {
			const response = await fetch(
				`/api/chats/permissions/${memberToUpdate.chatId}/${memberToUpdate.userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						newMemberStatus:
							field === "member"
								? updatedValue
								: memberToUpdate.member,
						newAdminStatus:
							field === "admin"
								? updatedValue
								: memberToUpdate.admin,
						newMuteStatus:
							field === "mute"
								? updatedValue
								: memberToUpdate.mute,
					}),
				}
			);

			if (!response.ok) {
				throw response;
			} else {
			
				if (field === "member" && !updatedValue) {
					setMembers((prevUsers) => {
						const filteredUsers = prevUsers.filter((prevUser) => {
							return prevUser.userId !== memberToUpdate.userId;
						});
						return [...filteredUsers];
					});
				}
			}
		} catch (error) {
			customAlert("Error modifing user from chat!");
		}
	};
	const addMember = async (userId: number) => {
		if (!roomInfo) return;
		try {
			const response = await fetch(
				`/api/chats/permissions/${roomInfo?.id}/${userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						newMemberStatus: true,
						newAdminStatus: false,
						newMuteStatus: false,
					}),
				}
			);
			if (!response.ok) {
				throw response;
			} else {
				const newMember = await response.json();

				setMembers((prevMembers) => [...prevMembers, newMember]);
			}
		} catch (error) {
			customAlert("Error adding user to channel");
		}
	};
	return isLoading || !roomInfo ? (
		<LoadingPage/>
	) : (
		<>
		<div className="flex flex-col items-center justify-center p-4">
			<header className="text-center">
				<h1 className="text-4xl font-bold text-neutral-content ">
					{roomInfo.name}'s Members
				</h1>
				<div className="avatar">
					<div className="w-24 m-3 rounded-full">
						<img src={roomInfo.owner.image_url} />
					</div>
				</div>
				<p className="text-4xl font-bold text-neutral-content ">
					Owner: {roomInfo.owner.username}
				</p>
			</header>
		</div>
		<div id="lead" className="h-screen max-h-screen">
			<main>
				<div id="header">
					<h1 id="h1">All users</h1>
				</div>
				<div id="leaderboard">
					<div className="ribbon"></div>
					<table>
						<tr>
							<td className="name">Username</td>
							<td className="name">Member</td>
							<td className="name">Admin</td>
							<td className="name">Mute</td>
						</tr>
							{members.map((member, i) => {
								return (
									member.userId !== roomInfo.ownerId && (
										<tr key={member.userId}>
											<td className="name">{member.user.username}</td>
											<td className="text-center text-info">
												<input
													type="checkbox"
													className="checkbox checkbox-info btn btn-outline btn-success"
													checked={member.member}
													onChange={() =>
														handleChange(
															i,
															"member"
															)
														}
														/>
											</td>
											<td className="text-center">
												<input
													type="checkbox"
													className="checkbox checkbox-info btn btn-outline btn-success"
													checked={member.admin}
													onChange={() =>
														handleChange(i, "admin")
													}
													/>
											</td>
											<td className="text-center">
												<input
													type="checkbox"
													className="checkbox checkbox-info btn btn-outline btn-success"
													checked={member.mute}
													onChange={() =>
														handleChange(i, "mute")
													}
													/>
											</td>
										</tr>
									)
									);
								})}
					</table>
					<ul>
						{allUsers
							.filter(
								(user) =>
								!members.some(
									(member) => member.userId === user.id
									)
									)
									.map((user) => {
										return (
											<li
											key={user.id}
											className="btn btn-ghost normal-case text-xl my-4 flex justify-between text-center "
											>
										<NavLink
											to={`/user/${user.username}`}
											className="btn btn-ghost normal-case text-xl"
											>
											{user.username}
										</NavLink>
										<button
											onClick={() => addMember(user.id)}
											className="btn btn-ghost normal-case text-xl"
											>
											<UserPlus />
										</button>
									</li>
								);
							})}
					</ul>
				</div>
			</main>
			<div id="buttons">
				<BackButton />
			</div>
		</div>
	</>
);
};

export default ChatMembersPage;
