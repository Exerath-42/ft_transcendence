import { NavLink, useNavigate, useParams } from "react-router-dom";
import Sketch from "react-p5";
import p5Types from "p5";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../modules/auth";

import Player from "./../Classes/Player";
import Ball from "./../Classes/Ball";

import { gameSocket as socket } from "../../../socket";
import { useMessage } from "../../../modules/alert/MessageContext";
import { Ghost } from "lucide-react";
import LoadingPage from "../../../components/Loading";

let player1: Player;
let player2: Player;
let ball: Ball;
let lastTime: number;
let p5Obj: p5Types;

const GameRoom = ({isGhostGame}: {isGhostGame: boolean}) => {
	const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
	const [gameState, setGameState] = useState<any>();

	const moveUpFlag = useRef<boolean>(false);
	const moveDownFlag = useRef<boolean>(false);

	const moveUpFlag2 = useRef<boolean>(false);
	const moveDownFlag2 = useRef<boolean>(false);

	const { gameId } = useParams();
	const { token, user } = useAuth();
	const [gameInfo, setGameInfo] = useState<Game>();

	const [myPlayer, setMyPlayer] = useState<number>(0);
	const [player1Score, setPlayer1Score] = useState(0);
	const [player2Score, setPlayer2Score] = useState(0);

	const navigation = useNavigate();
	const {customError} = useMessage();


	const [isGameGhost, setIsGameGhost] = useState(false);
	const [hasSendGhost, setHasSendGhost] = useState(false);
	const [isGhost, setIsGhost] = useState(false);

	const fetchGameInfo = async () => {
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		try {
			const response = await fetch(`/api/games/${gameId}`, {
				headers,
			});
			if (!response.ok) {
				throw response;
			}

			const data = await response.json();

			setGameInfo(data);
			if (data.winner !== "NOTFINISHED") {
				navigation("/");
			}

			if (data.player1Id === user?.id) {
				setMyPlayer(1);
			} else if (data.player2Id === user?.id) {
				setMyPlayer(2);
			}else {
				customError("You're not in this game!")
				navigation("/");
			}
		} catch (error) {
			customError("Something weird happened!")
			navigation("/");
		}
	};
	const opponentDisconnected = () => {
		customError("Your opponent disconnected, we dont care why but you won!")
	}

	useEffect(() => {
		fetchGameInfo();

		{
			socket.on("start", (data) => {
				if (!data)
					return;
				setGameState(data);
				ball.vx = data.ballVx;
				ball.vy = data.ballVy;
				const startTimestamp = data.start;
				const timeRemainingInMilliseconds = startTimestamp - Date.now();
				const timeRemainingInSeconds = Math.max(
					0,
					Math.floor(timeRemainingInMilliseconds / 1000)
				);

				setPlayer1Score(data.p1Score);
				setPlayer2Score(data.p2Score);

				setSecondsRemaining(timeRemainingInSeconds);
			});

			socket.on("ArrowUpP", (data) => {
				if (data.player === 1) {
					if (myPlayer === 2)
					{
						player1.y = data.player1Obj.y;
					}

					moveDownFlag.current = false;
					moveUpFlag.current = true;
				} else if (data.player === 2) {
					moveDownFlag2.current = false;
					moveUpFlag2.current = true;
				}
			});

			socket.on("ArrowDownP", (data) => {
				if (data.player === 1) {
					if (myPlayer === 2)
					{
						player1.y = data.player1Obj.y;
					}

					moveUpFlag.current = false;
					moveDownFlag.current = true;
				} else if (data.player === 2) {
					moveUpFlag2.current = false;
					moveDownFlag2.current = true;
				}
			});

			socket.on("ArrowUpR", (data) => {
				if (data.player === 1) {
					if (myPlayer === 2)
						player1.y = data.player1Obj.y;
					moveUpFlag.current = false;
				} else if (data.player === 2) {
					player2.y = data.player2Obj.y					
					moveUpFlag2.current = false;
				}
			});

			socket.on("ArrowDownR", (data) => {
				if (data.player === 1) {
					if (myPlayer === 2)
						player1.y = data.player1Obj.y;
					moveDownFlag.current = false;

				
				} else if (data.player === 2) {
					player2.y = data.player2Obj.y;
					moveDownFlag2.current = false;
				}
			});

			socket.on("updateBall", (data) => {
					lastTime = data.time;
					ball.x = data.x;
					ball.y = data.y;
					ball.vx = data.vx;
					ball.vy = data.vy;
			})
			
			
			socket.on("opponentDisconnected", opponentDisconnected);
			socket.on("updateScore", (data) => {
				const newGameState = { ...gameState, start: data.start };
				setGameState(newGameState);
				lastTime = data.start;
				setPlayer1Score(data.p1Score);
				setPlayer2Score(data.p2Score);
				moveDownFlag.current = false;
				moveUpFlag.current = false;
				moveDownFlag2.current = false;
				moveUpFlag2.current = false;
				
				sincronizeBall();
				ball.restart();
			});

			socket.on("endGame", (data) => {
				navigation(`/end-game/${data.id}`);
				
			});

			socket.on("ghost", () => {
				setIsGhost(true);
				
			});

			socket.on("isGameGhost", (data) => {
				setIsGameGhost(data.isGhost);
				
			});
		}

		return () => {
			socket.off("ArrowUpP");
			socket.off("ArrowDownP");
			socket.off("ArrowUpR");
			socket.off("ArrowDownR");
			socket.off("opponentDisconnected");
			socket.off("updateScore");
			socket.off("endGame");
			socket.off("ghost");
			socket.off("isGameGhost");
		};
	}, []);

	useEffect(() => {
		socket.emit("startGame", { room: gameInfo?.id, player: myPlayer });
		lastTime = Date.now();

		if (myPlayer === 1)
		{
			socket.emit("isGhost", { room: gameInfo?.id, player: myPlayer, isGhost: isGhostGame });
		}
	}, [gameInfo]);

	useEffect(() => {
		const interval = setInterval(() => {
			const startTimestamp = gameState?.start!;
			const timeRemainingInMilliseconds = startTimestamp - Date.now();
			const timeRemainingInSeconds = Math.max(
				0,
				Math.floor(timeRemainingInMilliseconds / 1000)
			);

			setSecondsRemaining(timeRemainingInSeconds);

			if (timeRemainingInSeconds === 0) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [gameState]);

	const keyPressed = (p5: p5Types, myPlayerId: number) => {
		if (myPlayerId === 0) return;
		if (p5.key === "w") {
			socket.emit("ArrowUpPressed", {
				room: gameInfo?.id,
				player: myPlayer,
				player1Obj: player1.getInfo(),
				player2Obj: player2.getInfo(),
				time: Date.now(),
			});
		} else if (p5.key === "s") {
			socket.emit("ArrowDownPressed", {
				room: gameInfo?.id,
				player: myPlayer,
				player1Obj: player1.getInfo(),
				player2Obj: player2.getInfo(),
				time: Date.now(),
			});
		}
	};

	const keyReleased = (p5: p5Types, myPlayerId: number) => {
		if (myPlayerId === 0) return;
		if (p5.key === "w") {
			socket.emit("ArrowUpReleased", {
				room: gameInfo?.id,
				player: myPlayer,
				player1Obj: player1.getInfo(),
				player2Obj: player2.getInfo(),
				time: Date.now(),
			});
		} else if (p5.key === "s") {
			socket.emit("ArrowDownReleased", {
				room: gameInfo?.id,
				player: myPlayer,
				player1Obj: player1.getInfo(),
				player2Obj: player2.getInfo(),
				time: Date.now(),
			});
		}
	};

	function handleBlur(e: FocusEvent, p5: p5Types) {
		e.preventDefault();
		keyReleased(p5, myPlayer);
	}

	function sincronizeBall()
	{
		if (myPlayer === 1) {
			socket.emit('updateBall', { room: gameInfo?.id,time: Date.now(), ...ball.getInfo()});
		}
	}

	const setup = (p5: p5Types, canvasParentRef: Element) => {
		p5Obj = p5;
		p5.createCanvas(600, 400).parent(canvasParentRef);

		player1 = new Player(p5, 1);
		player2 = new Player(p5, 2);
		ball = new Ball(p5);
		
		window.addEventListener("blur", (e) => handleBlur(e, p5));
		p5.keyPressed = () => keyPressed(p5, myPlayer);
		p5.keyReleased = () => keyReleased(p5, myPlayer);
		p5.frameRate(60);
		setInterval(() => {
			
			sincronizeBall();
		}, 300);
	};

	function increaseScore1() {
		if (myPlayer === 1) {
			socket.emit("score", { room: gameInfo?.id, player: 1 });
			ball.vx = Math.random() > 0.5 ? 1.5 : -1.5;

			do {
				ball.vy = Math.random() * 6 - 3;
			  } while (Math.abs(ball.vy) < 1.5);

			sincronizeBall();
		};
	}

	function increaseScore2() {
		if (myPlayer === 1) {
			socket.emit("score", { room: gameInfo?.id, player: 2 });
			ball.vx = Math.random() > 0.5 ? 1.5 : -1.5;

			do {
				ball.vy = Math.random() * 6 - 3;
			  } while (Math.abs(ball.vy) < 1.5);
			sincronizeBall();
		}
	}

	const draw = (p5: p5Types) => {
		p5.background(0);
		const time = Date.now();
		const delta = time - lastTime;
		if (moveUpFlag.current) {
			player1.moveUp(delta);
		}
		if (moveDownFlag.current) {
			player1.moveDown(delta);
		}
		if (moveUpFlag2.current) {
			player2.moveUp(delta);
		}
		if (moveDownFlag2.current) {
			player2.moveDown(delta);
		}

		ball.show();
		player1.show(p5);
		player2.show(p5);
		if (Date.now() >= gameState.start) {
			ball.move(delta);
		} else {
			ball.x = p5.width / 2;
			ball.y = p5.height / 2;
		}
		if (ball.collision(player1)) {
			ball.vx = Math.abs(ball.vx);
			sincronizeBall();
		}
		if (ball.collision(player2)) {
			ball.vx = -1 * Math.abs(ball.vx);
			sincronizeBall();
		}
		lastTime = time;
		if (ball.x < 0) {
			ball.restart();
			increaseScore2();
			sincronizeBall();
			setGameState((curr) => ({ ...curr, start: time + 5000 }));
		}
		if (ball.x > p5.width) {
			ball.restart();
			increaseScore1();
			sincronizeBall();
			setGameState((curr) => ({ ...curr, start: time + 5000 }));
		}

		if (isGhost)
		{
			if ((ball.x <= 150 && ball.vx < 0 )|| (ball.x >= p5.width - 150 && ball.vx > 0))
			{
				setIsGhost(false);
			}
		}
		
	};

	const sendGhostMode = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.preventDefault();
		if ((ball.x <= 150 && ball.vx < 0 )|| (ball.x >= p5Obj.width - 150 && ball.vx > 0))
		{
			return;
		}
		setHasSendGhost(true);
		socket.emit("ghost", { room: gameInfo?.id, player: myPlayer });
	}

	const windowResized = (p5: p5Types) => {
		p5.resizeCanvas(600, 400);
	};
	return gameInfo ? (
		<div className="flex flex-col items-center justify-center gap-4 " style={{'maxWidth': '100%', 'overflowX': 'hidden'}}>
			<h1 className="text-4xl font-bold text-neutral-content ">
				Game Room {gameInfo && gameInfo.id}
			</h1>
			<h2>Starts in: {secondsRemaining} seconds</h2>
			<div className="flex flex-row items-stretch justify-center gap-5 text-center w-full flex-wrap">
				<div className="flex flex-row items-stretch justify-center gap-5 basis-2/4">
					<div className="avatar self-center">
						<div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
							<img src={gameInfo && gameInfo.player1.image_url} />
						</div>
					</div>
					<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content flex-grow">
						<span className="countdown font-mono text-5xl  text-center">
							<span
								style={{ "--value": player1Score } as React.CSSProperties}
								className="m-auto"
							></span>
						</span>
						{gameInfo && gameInfo.player1.username}
					</div>
				</div>

				<div className="flex flex-row items-stretch justify-center gap-5 basis-2/4">
					<div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content flex-grow">
						<span className="countdown font-mono text-5xl text-center">
							<span
								style={{ "--value": player2Score } as React.CSSProperties}
								className="m-auto"
							></span>
						</span>
						{gameInfo && gameInfo.player2.username}
					</div>

					<div className="avatar self-center">
						<div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
							<img src={gameInfo && gameInfo.player2.image_url} />
						</div>
					</div>
				</div>
			</div>
			<div className={isGhost? "opacity-0" : ""}>
				<Sketch setup={setup} draw={draw} windowResized={windowResized} />
			</div>
			{isGameGhost && <button className={`btn ${isGhost ? "btn-ghost" : ''} ${(hasSendGhost && !isGhost) ? "btn-ghost" : ''} ${(!hasSendGhost && !isGhost) ? "btn-primary": ''}`} onClick={(e) => sendGhostMode(e)} disabled={hasSendGhost}>
				<Ghost />
				Ghost Mode
			</button>}
			<NavLink className="btn btn-ghost btn-wide" to="/">
				Back
			</NavLink>
		</div>
	) : (
		<LoadingPage/>
	);
};

export default GameRoom;
