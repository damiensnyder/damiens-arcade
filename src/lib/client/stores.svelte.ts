// Common stores shared across games
// Using object properties to allow mutation from components

class CommonStore {
	roomCode = $state('');
	roomName = $state('');
	isPublic = $state(false);
	host = $state(0);
	pov = $state(0);
	connected = $state(false);
	eventLog = $state<string[]>([]);
	sendAction: (action: any) => void = () => {
		console.warn('sendAction called before WebSocket connection established');
	};

	appendEventLog(message: string) {
		this.eventLog = [...this.eventLog, message];
	}
}

export const commonStore = new CommonStore();
