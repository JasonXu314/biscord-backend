type InboundSocketMsg = ConnectionMsg | PongMsg | MessageMsg;
type OutboundSocketMsg = PingMsg | MessageSendMsg | UserJoinMsg | UserLeaveMsg;

type User = {
	name: string;
	id: string;
	avatar: string;
};

type Message = {
	rawContent: string;
	id: string;
	author: User;
};

type LoginResponse = {
	type: 'success';
	user: User;
	users: User[];
	messages: Message[];
};

type PingMsg = {
	type: 'PING';
};

type MessageSendMsg = {
	type: 'MESSAGE';
	message: Message;
};

type UserJoinMsg = {
	type: 'USER_JOIN';
	user: User;
};

type UserLeaveMsg = {
	type: 'USER_LEAVE';
	id: string;
};

type PongMsg = {
	type: 'PONG';
	id: string;
	name: string;
};

type ConnectionMsg = {
	type: 'CONNECT';
	id: string;
	name: string;
};

type MessageMsg = {
	type: 'MESSAGE';
	message: string;
};
