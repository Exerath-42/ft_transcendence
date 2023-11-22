import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../modules/auth";
import { formatDate } from "../../modules/date";
import BackButton from "../../components/BackButton";
import { useMessage } from "../../modules/alert/MessageContext";
import LoadingPage from "../../components/Loading";

const EndGamePage = () => {
    const [gameInfo, setGameInfo] = useState<Game>();
    const {gameId} = useParams();
    const {token} = useAuth();
	const {customError} = useMessage();
	const navigation = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
			try {
				const response = await fetch(
					`/api/games/${gameId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				if (!response.ok) {
					throw response;
				} else {
					const data = await response.json();
                    setGameInfo(data);
				}
			} catch (error) {
				customError("Error fetching user info!");
				navigation("/");
			}
		};

		fetchData();
    }, [gameId])

    return gameInfo ? (<>
	<div className="text-center flex flex-col items-stretch gap-4 h-screen max-h-screen">
	<h1 className="text-4xl font-bold text-neutral-content ">
					Game: {gameInfo && gameInfo.id}
				</h1>
				<h2>Date: {formatDate(gameInfo.createdAt)}</h2>
	<div className="flex flex-row items-stretch justify-center gap-5 text-center w-[500px]">
					<div className="flex flex-row items-stretch justify-center gap-5 basis-2/4">
						<div className="avatar self-center">
							<div className={`w-24 rounded-full ring ${gameInfo.winner === "PLAYER1" ? 'ring-success' : 'ring-error'} ring-offset-base-100 ring-offset-2`}>
								<img src={gameInfo && gameInfo.player1.image_url} />
							</div>
						</div>
						<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content flex-grow">
							<h5 className="countdown font-mono text-5xl  text-center">
								<h5 style={{"--value": gameInfo.score1} as React.CSSProperties} className="m-auto"></h5>
							</h5>
							{gameInfo && gameInfo.player1.username}
						</div>
					</div>
					<div  className="flex flex-row items-stretch justify-center gap-5 basis-2/4">
						<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content flex-grow">
							<h5 className="countdown font-mono text-5xl text-center">
								<h5 style={{"--value": gameInfo.score2} as React.CSSProperties} className="m-auto"></h5>
							</h5>
							{gameInfo && gameInfo.player2.username}
						</div>
						
						<div className="avatar self-center">
						<div className={`w-24 rounded-full ring ${gameInfo.winner === "PLAYER2" ? 'ring-success' : 'ring-error'} ring-offset-base-100 ring-offset-2`}>
							<img src={gameInfo && gameInfo.player2.image_url} />
							</div>
						</div>
					</div>
				</div>
			<BackButton/>
	</div>
	</>) : (
       <LoadingPage/>
    );
}

export default EndGamePage;