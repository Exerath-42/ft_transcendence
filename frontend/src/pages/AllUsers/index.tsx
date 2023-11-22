import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMessage } from "../../modules/alert/MessageContext";
import { useUser } from "../../modules/user/UserHooks";
import LoadingPage from "../../components/Loading";

export default function AllUsers(): JSX.Element {
	const [allUsers, setAllUsers] = useState<Array<User>>([]);
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [filterText, setFilterText] = useState<string>("");
	const { token } = useUser();
	const { customError} = useMessage();
	const [isLoading, setIsLoading] = useState(true);
	const navigation = useNavigate();
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/users/", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					customError("An error occured!");
					navigation("/");
				} else { 
					const data = await response.json();
					setAllUsers(data);
					setFilteredUsers(data);
					setIsLoading(false);
				}
			} catch (error) {
				customError("An error occured!");
				navigation("/");
			}
		};

		fetchData();
	}, []);

	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setFilterText(text);

		const newFilteredUsers = allUsers.filter((user) =>
			user?.username?.toLowerCase().startsWith(text.toLowerCase())
		);
		setFilteredUsers(newFilteredUsers);
	};
	return (
		isLoading ? <LoadingPage/> : <div  className="flex flex-col items-center justify-start gap-4 h-screen max-h-screen p-4">
		<header className="text-center flex flex-col items-center justify-center gap-4">
			<h1 className="text-4xl font-bold ">All Users</h1>
			<input
				value={filterText}
				onChange={handleFilterChange}
				type="text"
				placeholder="Filter by username"
				className="input input-bordered"
			/>
		</header>
		<main className="flex flex-row items-baseline justify-center gap-4 flex-grow-2 flex-wrap align-top overflow-y-auto ">
			{allUsers &&
				filteredUsers.map((user: User) =>{
					return (
						<NavLink
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
						</NavLink>
					);
				})}
		</main>

		<footer className="text-center">
			<NavLink className="btn btn-outline btn-wide" to="/">
				Back
			</NavLink>
		</footer>
	</div>
	);
}
