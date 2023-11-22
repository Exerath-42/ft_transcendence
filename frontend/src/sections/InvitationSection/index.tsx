import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth";
import { useEffect, useState } from "react";
import { socket } from "../../socket";
import { useMessage } from "../../modules/alert/MessageContext";

const InvitationSection = ({
	dmUserId
}: {
	dmUserId: number
}) => {

	const {token} = useAuth();
	const [invitations, setInvitations] = useState<Array<GameInvitation>>([]);
	const {customError, customAlert} = useMessage();
	const refuseInvitation = async (invitationId: number) => {

			const headers = {
				Authorization: `Bearer ${token}`,
				
			};
	
			try {
				const response = await fetch(`/api/games/invite/${invitationId}`, {
					headers,
					method: "DELETE",
				});
				if (!response.ok) {
					throw response;
				}
				const updatedInvitations = invitations.filter(inv => inv.id !== invitationId);
      			setInvitations(updatedInvitations);
			} catch (error) {
				customAlert('Error declining invitation!');
			}
	}
	const loadInvitations = () => {
		const dmId = dmUserId;
		if (!dmId) return;
		
		
		fetch(`/api/games/invite/dm/${dmUserId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				const newInvitations = response as Array<GameInvitation>;
				setInvitations(newInvitations);
			})
			.catch(() => {
				customError('Error fetching invitations');
			});
	}
	const onInvitation =  () => {
		loadInvitations();
	}
	useEffect(() => {
		loadInvitations();
		socket.on("invitationRecieved",onInvitation);

		return(() => {
			socket.off("invitationRecieved", onInvitation);
		})
	}, [])
	return invitations && invitations.length > 0 ? (
		<>
			{invitations.map((invitation) => (
				<li key={invitation.id}>
					<div className="card  bg-neutral text-neutral-content">
						<div className="card-body items-center text-center">
							<h2 className="card-title">Let's play!</h2>
							<p>
								{invitation.inviter.username} wants to play Pong
								with you !
							</p>
							<div className="card-actions justify-end">
								<NavLink
									to={`/game/game-lobby/${invitation.id}`}
									className="btn btn-primary"
								>
									Accept
								</NavLink>
								<button className="btn btn-ghost" onClick={() => refuseInvitation(invitation.id)}>Deny</button>
							</div>
						</div>
					</div>
				</li>
			))}
		</>
	) : (
		<li>0 invitations</li>
	);
};

export const ChatInvitationSection = ({chatId, blocks}:{chatId:number, blocks: Array<number>} ) => {
	const {token} = useAuth();
	const [invitations, setInvitations] = useState<Array<GameInvitation>>([]);
	const {customError, customAlert} = useMessage();
	const loadInvitations = () => {
		if (!chatId) return;
		fetch(`/api/games/invite/list/group/${chatId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((response) => {
				const newInvitations = response as Array<GameInvitation>;
				setInvitations(newInvitations);
			})
			.catch(() => {
				customError('Error fetching invitations');
			});
	
	}
	const onInvitation =  () => {
		loadInvitations();
	}
	useEffect(() => {
		loadInvitations();
		socket.on("invitationRecieved",onInvitation);

		return(() => {
			socket.off("invitationRecieved", onInvitation);
		})
	}, [])
	return invitations && invitations.length > 0 ? (
		<>
			{invitations.map((invitation) => {
				if (blocks.includes(invitation.inviterId))
				{
					return <li>Invitation by someone you blocked!</li>;
				}

				return (<li key={invitation.id}>
					<div className="card  bg-neutral text-neutral-content">
						<div className="card-body items-center text-center">
							<h2 className="card-title">Let's play!</h2>
							<p>
								{invitation.inviter.username} wants to play Pong
								with you !
							</p>
							<div className="card-actions justify-end">
								<NavLink
									to={`/game/game-lobby/${invitation.id}`}
									className="btn btn-primary"
								>
									Accept
								</NavLink>
							</div>
						</div>
					</div>
				</li>);
			})}
		</>
	) : (
		<li>0 invitations</li>
	);
}

export default InvitationSection;
