import { useState, useEffect } from 'react';
import { createContext } from 'react';
import axios from 'axios';

interface IAppContext {
	appTitle: string;
	loginAsAdmin: (callback: () => void) => void;
	logoutAsAdmin: () => void;
	password: string;
	setPassword: (password: string) => void;
	appMessage: string;
	deleteAppMessage: () => void;
	adminIsLoggedIn: boolean;
	welcomeMessage: string;
	turnOnWelcomeMessageEditMode: () => void;
	isEditingWelcomeMessage: boolean;
	setWelcomeMessage: (message: string) => void;
	handleSaveWelcomeMessage: () => void;
}

interface IAppProvider {
	children: React.ReactNode;
}

const backendUrl = 'http://localhost:3512';

export const AppContext = createContext<IAppContext>({} as IAppContext);

export const AppProvider: React.FC<IAppProvider> = ({ children }) => {
	const appTitle = 'Info Site';
	const [password, setPassword] = useState('');
	const [adminIsLoggedIn, setAdminIsLoggedIn] = useState(false);
	const [appMessage, setAppMessage] = useState('');
	const [welcomeMessage, setWelcomeMessage] = useState('');
	const [isEditingWelcomeMessage, setIsEditingWelcomeMessage] =
		useState(false);

	const loadWelcomeMessage = async () => {
		const _welcomeMessage = (
			await axios.get(`${backendUrl}/welcomemessage`)
		).data;
		setWelcomeMessage(_welcomeMessage);
	};

	useEffect(() => {
		(async () => {
			const response = await fetch(`${backendUrl}/currentuser`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: 'Bearer ' + localStorage.getItem('token'),
				},
			});
			if (response.ok) {
				const data = await response.json();
				setAdminIsLoggedIn(true);
			}
		})();
	}, []);

	useEffect(() => {
		loadWelcomeMessage();
	}, []);

	const loginAsAdmin = async (callback: () => void) => {
		let _appMessage = '';
		try {
			const response = await axios.post(
				`${backendUrl}/login`,
				{
					password,
				},
				{
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				}
			);
			localStorage.setItem('token', response.data.token);
			setAdminIsLoggedIn(true);
			callback();
		} catch (e: any) {
			switch (e.code) {
				case 'ERR_BAD_REQUEST':
					_appMessage =
						'Sorry, credentials were incorrect, please attempt login again.';
					break;
				case 'ERR_NETWORK':
					_appMessage =
						"Sorry, we aren't able to process your request at this time.";
					break;
				default:
					_appMessage = `Sorry, there was an unknown error (${e.code}).`;
					break;
			}
			setAdminIsLoggedIn(false);
		}
		setAppMessage(_appMessage);
		setPassword('');
	};

	const deleteAppMessage = () => {
		setAppMessage('');
	};

	const logoutAsAdmin = () => {
		localStorage.removeItem('token');
		setAdminIsLoggedIn(false);
	};

	const turnOnWelcomeMessageEditMode = () => {
		setIsEditingWelcomeMessage(true);
	};

	const handleSaveWelcomeMessage = async () => {
		let _appMessage = '';
		try {
			await axios.post(
				`${backendUrl}/welcomeMessage`,
				{
					welcomeMessage,
				},
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						authorization:
							'Bearer ' + localStorage.getItem('token'),
					},
				}
			);
			setIsEditingWelcomeMessage(false);
		} catch (e: any) {
			switch (e.code) {
				case 'ERR_BAD_REQUEST':
					_appMessage =
						'Sorry, you had been logged out when you tried to save the welcome message. Please log in again.';
					break;
				case 'ERR_NETWORK':
					_appMessage =
						"Sorry, we aren't able to process your request at this time.";
					break;
				default:
					_appMessage = `Sorry, there was an unknown error (${e.code}).`;
					break;
			}
			setAppMessage(_appMessage);
			setAdminIsLoggedIn(false);
			loadWelcomeMessage();
			setIsEditingWelcomeMessage(false);
		}
	};

	return (
		<AppContext.Provider
			value={{
				appTitle,
				loginAsAdmin,
				logoutAsAdmin,
				password,
				setPassword,
				appMessage,
				deleteAppMessage,
				adminIsLoggedIn,
				welcomeMessage,
				turnOnWelcomeMessageEditMode,
				isEditingWelcomeMessage,
				setWelcomeMessage,
				handleSaveWelcomeMessage,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};
