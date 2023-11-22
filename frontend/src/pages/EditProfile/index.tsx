import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../modules/user/UserHooks";
import { useAuth } from "../../modules/auth";
import { useMessage } from "../../modules/alert/MessageContext";
import BackButton from "../../components/BackButton";
import LoadingPage from "../../components/Loading";
import { socket } from "../../socket";

const EditProfile = () => {

	const { customSuccess, customAlert, customError } = useMessage();
	const { token } = useAuth();
	const { user, refresh } = useUser();
	const navigation = useNavigate();
	const [newUsername, setNewUsername] = useState<string>("");
	const [newPicture, setNewPicture] = useState<File | null>();
	const [newImageSrc, setNewImageSrc] = useState<string | null>();
	const [isTfaSet, setIsTfaSet] = useState<boolean>(false);
	const [tfaCode, setTfaCode] = useState<string>("");
	const [tfaError, setTfaError] = useState<string | null>(null);
	const [qrCode, setQrCode] = useState("");
	const [isLoadingTfa, setIsLoadingTfa] = useState(false);

	useEffect(() => {
		if (user)
		{
			setIsTfaSet(user.isTwoFactorAuthenticationEnabled);
		}
	}, []);

	useEffect(() => {
		if (user)
		{
			setIsTfaSet(user.isTwoFactorAuthenticationEnabled);
		}
	}, [user]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newFile = event.target.files && event.target.files[0];
		if (newFile) {
			setNewPicture(newFile);
			if (newImageSrc) URL.revokeObjectURL(newImageSrc);
			const newImageUrl = URL.createObjectURL(newFile);
			setNewImageSrc(newImageUrl);
		} else {
			setNewPicture(null);
			setNewImageSrc(null);
		}
	};
	const uploadImage = async () => {
		const formData = new FormData();
		formData.append("file", newPicture!);
		try {
			const response = await fetch("/api/users/upload", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});
			if (!response.ok) {
				throw new Error("Upload Failed");
			} else {
				const data = await response.json();
				return data.imagePath;
			}
		} catch (error) {
			customAlert("Error updating profile!");
		}
	};
	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		let imagePath = "";
		if (newPicture) {
			imagePath = await uploadImage();
		}
		const payload: { username?: string; image_url?: string } = {};
		if (newUsername !== "") payload.username = newUsername;
		if (imagePath !== "") payload.image_url = imagePath;
		try {
			const response = await fetch("/api/users/me", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error("Update Failed");
			} else {
				const data = await response.json();
				
				socket.emit("updateName", { token: token, oldName: user.username, newUsername: newUsername });
				
				customSuccess('Upload success!')
				refresh();
				navigation("/");
			}
		} catch (error) {
			customError("Update Error!");
			navigation("/");
		}
	};
	const onChangeTFA = (isChecked: boolean) => {
		if (isChecked)
		{
			setTimeout(() => {
				(window as { my_modal_5?: any }).my_modal_5?.showModal();
			}, 100);

			async function fetchImage() {
				const response = await fetch('/api/auth/2fa/generate', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					}
				});
				const data = await response.json(); 
				
				setQrCode(data); 
			}
	
			fetchImage();
		}else{
			async function delete2fa() {
				fetch('/api/auth/2fa/turn-on', {
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					}
				}).then(response => response.json())
				.then(() => {
					customSuccess("2fa disabled!");
				})
				.catch(() => {
					customError("Error turning off 2fa");
				});
				
			}
	
			delete2fa();
		}
		setIsTfaSet(isChecked);
	}
	const submitTfa = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoadingTfa(true);
		setTfaError(null);
		
		const options = {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/x-www-form-urlencoded',
			  Authorization: `Bearer ${token}`
			},
			body: new URLSearchParams({twoFactorAuthenticationCode: tfaCode})
		  };
		  fetch('/api/auth/2fa/turn-on', options)
			.then(response => response.json())
			.then(response => {
				if (response.error) {
					throw {
					  message: response.message || 'API returned an error',
					  status: response.status || 400
					};
				  }
				setIsLoadingTfa(false);
				(window as { my_modal_5?: any }).my_modal_5?.close();
			})
			.catch(err => {
				setTimeout(() => {
					if (err.message && err.statusCode) {
						setTfaError(`Error ${err.statusCode}: ${err.message}`);
					  } else {
						setTfaError(err.message);
					  }
					setIsTfaSet(false);
					setIsLoadingTfa(false);
				}, 1000);
			});
	}
	const cancelBtn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.preventDefault();
		(window as { my_modal_5?: any }).my_modal_5?.close();
		if (tfaCode === "")
		{
			setTimeout(() => {
				setIsTfaSet(false);
			}, 100);
			
		}
		setTfaCode("");
		setTfaError(null);
	}
	return (
		user ? (
			<>
			<div className="text-center flex flex-col items-stretch gap-4 h-screen max-h-screen">
				<header>
					<div className="avatar">
						<div className="w-24 rounded-full  ring ring-primary ring-offset-base-100 ring-offset-2">
							<img src={newImageSrc || user?.image_url!} alt="" />
						</div>
					</div>

					<h1 className="text-4xl font-bold ">Edit Profile</h1>
				</header>
				<form onSubmit={onSubmit} className="flex flex-col items-stretch gap-4">
					<input
						type="file"
						className="file-input file-input-bordered w-full max-w-xs"
						name="Avatar"
						accept="image/png, image/jpeg"
						onChange={handleFileChange}
					/>
					<input
						type="text"
						name="username"
						placeholder={user?.username || user?.student_username}
						value={newUsername}
						onChange={(e) => setNewUsername(e.target.value)}
						className="input input-bordered w-full max-w-xs"
					/>
					<input
						className="btn btn-primary"
						name="Submit"
						value="Submit"
						type="submit"
					/>
					<div className="form-control">
						<label className="label cursor-pointer">
							<span className="label-text">Use 2FA</span>
							<input
								type="checkbox"
								name="private"
								checked={isTfaSet}
								className="toggle"
								onChange={(e) => onChangeTFA(e.target.checked)}
							/>
						</label>
					</div>
					
						
				</form>
				<BackButton/>
			</div>
			<dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle p-4">
			<form onSubmit={submitTfa} method="dialog" className="modal-box text-center flex flex-col items-center justify-start gap-8">
				<h1 className="text-4xl font-bold ">Setup 2FA</h1>
				{qrCode && <img src={qrCode} alt="Description" className="d-block m-auto"/>}
				<input
					required
					type="text"
					name="tfaCode"
					placeholder="Code for 2FA auth"
					value={tfaCode}
					onChange={(e) => setTfaCode(e.target.value)}
					className={`input input-bordered w-full max-w-xs text-center ${tfaError && "input-error text-error"}`}
					/>
				<div className="modal-action mt-0">
					{
						isLoadingTfa ? <button className="btn btn-success btn-wide cursor-default"><span className="loading loading-spinner"></span></button> : 
						<>
							<input type="submit" className={`btn ${tfaError ? "btn-error" : "btn-success"}`} name="submit" value="submit"/>
							<button className="btn" onClick={(e) => cancelBtn(e)}>Cancel</button>
						</>
					}
					
				</div>
			</form>
			</dialog>
		</>
		) : (<LoadingPage/>)
	);
};

export default EditProfile;
