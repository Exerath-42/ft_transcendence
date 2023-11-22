import { useAuth } from "../../modules/auth";
import { useUser } from "../../modules/user/UserHooks";
import LoadingPage from "../../components/Loading";

const DashboardPage = () => {
	const { user } = useUser();
	const { logout } = useAuth();
	return (
		user && user.id ? (
			<>
		<div className="flex flex-col items-center justify-center h-screen max-h-screen">
			<div className="avatar">
				<div className="w-24 rounded-full">
					<img src={user?.image_url} />
				</div>
			</div>
			<h1 className="text-4xl mb-5 font-bold tracking-tightsm:text-6xl">
				Hello {user?.username}
			</h1>
			<button className="btn btn-wide" onClick={logout}>
				Logout
			</button>
		</div>
		</>
		): (<LoadingPage/>)
	);
};

export default DashboardPage;