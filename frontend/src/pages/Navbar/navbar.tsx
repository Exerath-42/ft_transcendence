import { NavLink } from "react-router-dom";
import avatar from "./../../assets/pingpong.jpg";
import { useAuth } from "../../modules/auth";
import { useState, useEffect } from "react";

const NavbarPage = () => {
	const { logout } = useAuth();
	const [isDropdownVisible, setDropdownVisible] = useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	useEffect(() => {
		const handleWindowResize = () => {
		setWindowWidth(window.innerWidth);
	};
	window.addEventListener("resize", handleWindowResize);
	return () => {
		window.removeEventListener("resize", handleWindowResize);
	};
	}, []);
	const toggleDropdown = () => {
	setDropdownVisible(!isDropdownVisible);
	};

	return (
	<>
	<div className="navbar sticky top-0 left-0 right-0 z-50 bg-white shadow-lg border-none mb-5">
		<div className="navbar bg-base-100">
			<div className="navbar-start">
				<div className="dropdown">
					{windowWidth <= 1023 && (
					<label
						tabIndex={0}
						className={`btn btn-ghost btn-circle ${
						isDropdownVisible ? "active" : ""
								}`}
						onClick={toggleDropdown}
					>
					<svg
					xmlns="http://www.w3.org/2000/svg"
					className="max-[1023px]:block h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					>
					<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M4 6h16M4 12h16M4 18h7"
					/>
					</svg>
					</label>
					)}
					<ul
						tabIndex={0}
						className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 ${
						isDropdownVisible ? "block" : ""
						}`}
					>
						<li>
							<NavLink to={"/game/game-lobby/random"}>Game</NavLink>
						</li>
						<li>
							<NavLink to={"/all-users"}>All users</NavLink>
						</li>
						<li>
							<NavLink to={"/chat-rooms"}>Chat</NavLink>
						</li>
						<li>
							<NavLink to={"/edit-profile"}>Edit profile</NavLink>
						</li>
						<li>
							<NavLink to={"/history"}>History</NavLink>
						</li>
						<li>
							<NavLink to={"/leaderboard"}>Leaderboard</NavLink>
						</li>
					</ul>
				</div>
			</div>
			<div className="hidden lg:flex navbar-center">
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/game/game-lobby/random"}>Game</NavLink>
				</li>
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/all-users"}>All users</NavLink>
				</li>
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/chat-rooms"}>Chat</NavLink>
				</li>
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/edit-profile"}>Edit profile</NavLink>
				</li>
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/history"}>History</NavLink>
				</li>
				<li className="btn btn-ghost normal-case text-xl">
					<NavLink to={"/leaderboard"}>Leaderboard</NavLink>
				</li>
			</div>
			<div className="navbar-end">
				<button
					className="btn btn-outline btn-warning btn-sm mr-2"
					onClick={logout}
				>
						Logout
				</button>
				<div className="w-10 rounded-full mr-4">
					<img src={avatar} alt="User Avatar" />
				</div>
			</div>
		</div>
	</div>
	</>
	);
};

export default NavbarPage;
