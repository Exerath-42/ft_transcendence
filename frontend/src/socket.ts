import { io } from "socket.io-client";

const URL = ":3001";

export const socket = io(URL, {
	autoConnect: false,
});


const GAMEURL = ":3002";

export const gameSocket = io(GAMEURL, {
	autoConnect: false
})