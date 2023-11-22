import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AuthProvider from "./modules/auth/AuthProvider.tsx";
import { MessageProvider } from "./modules/alert/MessageContext.tsx";
import { RoomProvider } from "./modules/room/RoomContext.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<AuthProvider>
		<MessageProvider>
			<RoomProvider>
				<App />
			</RoomProvider>
		</MessageProvider>
	</AuthProvider>
);
