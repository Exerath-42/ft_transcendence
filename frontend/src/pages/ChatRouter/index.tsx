import {useState, useEffect} from 'react';
import ChatMembersPage from '../EditChat/ChatMembers';
import {
	Routes,
	Route,
	BrowserRouter as Router,
	useParams,
	useNavigate,
	useLocation
} from "react-router-dom";

import { useUser } from "../../modules/user/UserHooks";
import ChatLoginPage from '../ChatLogin';
import EditChat from '../EditChat';
import ChatPage from '../ChatPage';
import { useMessage } from '../../modules/alert/MessageContext';
import { useRoom } from '../../modules/room/RoomContext';
import LoadingPage from '../../components/Loading';

const ChatRouter = () => {
	const { user, token } = useUser();
	const { chatId } = useParams();
	const navigation = useNavigate();
	const { roomInfo, setRoomInfo, pass, setPass } = useRoom();
	const {customError} = useMessage();
	const [isLoading, setIsLoading] = useState(false);
	const location = useLocation();

	const fetchRoomInfo = async (password = "") => {
		const headers = {
			Authorization: `Bearer ${token}`,
			Password: password,
		};
		

		try {
			const response = await fetch(`/api/chats/info/id/${chatId}`, {
				headers,
			});
			if (!response.ok)
			{
				throw response;
			}
			const data = await response.json();
			setRoomInfo(data);
			setIsLoading(false);
			navigation(`/chat/${data.id}/room`)
		} catch (error) {
			setIsLoading(false);
			if ((error as Response).status === 401) {
				navigation(`/chat/${chatId}/login`);
			} else {
				customError("An error occured. Try again!");
				
				navigation("/all-rooms")
			}
		}
	};
	const loginChat = (password: string) => {
		
		fetch(`/api/chats/info/id/${chatId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Password: password,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				if (response.statusCode === 401)
				{
					customError("Wrong Pass!");
					navigation("/all-rooms");
					return;
				}
				setPass(password);
				setRoomInfo(response);
				navigation(`/chat/${response.id}/room`)
			})
			.catch((err) => {
				customError("An error occured. Try again!");
				
				navigation("/all-rooms");
				return;
			});
	}
	useEffect(() => {
		if (location.pathname !== `/chat/${chatId}/login` && !roomInfo) {
			fetchRoomInfo();
		}

	}, [location, chatId, roomInfo]);

    return( isLoading ? <LoadingPage/> : (<Routes>
		<Route path="/login" element={<ChatLoginPage onLogin={loginChat}/>} />
		{
			roomInfo && (
				<>
					<Route path='/room' element={<ChatPage/>}/>
					<Route path='/edit' element={<EditChat/>}/>
					<Route path='/members' element={<ChatMembersPage/>}/>
					
				</>
			)
		}
	</Routes>)
	)
}
export default ChatRouter;