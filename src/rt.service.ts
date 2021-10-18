import { BadRequestException, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import WebSocket from 'ws';
import { randomColor } from './utils/utils';

@Injectable()
export class RTService {
	private readonly users: Map<string, User>;
	private readonly socketsToIds: Map<WebSocket, string>;
	private readonly idsToSockets: Map<string, WebSocket>;
	private readonly expirations: Map<string, NodeJS.Timeout>;
	private readonly pings: Map<string, NodeJS.Timer>;
	private readonly names: Set<string>;
	private readonly messages: Message[];
	private readonly GOD: User;

	constructor() {
		this.users = new Map();
		this.names = new Set();
		this.expirations = new Map();
		this.socketsToIds = new Map();
		this.idsToSockets = new Map();
		this.pings = new Map();
		this.messages = [];
		this.GOD = { name: 'God', avatar: `${process.env.BACKEND_URL}/god.jpg`, id: '' };

		this.users.set('', this.GOD);
		this.names.add('God');
	}

	public registerUser(name: string, avatar: string | undefined): User {
		if (this.names.has(name)) {
			throw new BadRequestException({ type: 'failure', reason: 'That name is already taken!' });
		}

		const newUser: User = {
			name,
			avatar: avatar || `${process.env.BACKEND_URL}/${randomColor()}.png`,
			id: nanoid()
		};

		this.names.add(name);
		this.users.set(newUser.id, newUser);
		this.expirations.set(
			newUser.id,
			setTimeout(() => {
				this.users.delete(newUser.id);
				this.names.delete(name);
				this.expirations.delete(newUser.id);
			}, 10000)
		);

		return newUser;
	}

	public connectUser(socket: WebSocket, id: string, name: string): void {
		if (this.users.get(id)?.name === name) {
			this.socketsToIds.set(socket, id);
			this.idsToSockets.set(id, socket);
			clearTimeout(this.expirations.get(id)!);

			let timeout: NodeJS.Timeout;
			this.pings.set(
				id,
				setInterval(() => {
					socket.send(JSON.stringify({ type: 'PING' }));
					timeout = setTimeout(() => {
						this.disconnectUser(socket);
					}, 10000);
				}, 30_000)
			);

			const thisId = id;
			const thisUser = this.users.get(id)!;

			this.idsToSockets.forEach((thisSocket) => {
				if (thisSocket !== socket) {
					thisSocket.send(JSON.stringify({ type: 'USER_JOIN', user: thisUser } as OutboundSocketMsg));
				}
				const joinMsg = { author: '', id: nanoid(), rawContent: `${thisUser.name} has joined the chat` };
				this.messages.push(joinMsg);
				thisSocket.send(
					JSON.stringify({
						type: 'MESSAGE',
						message: joinMsg
					} as OutboundSocketMsg)
				);
			});

			socket.on('message', (data: string) => {
				const msg: InboundSocketMsg = JSON.parse(data);

				switch (msg.type) {
					case 'MESSAGE': {
						const message = { id: nanoid(), rawContent: msg.message, author: thisUser.id };
						this.messages.push(message);
						this.idsToSockets.forEach((socket) => {
							socket.send(JSON.stringify({ type: 'MESSAGE', message } as OutboundSocketMsg));
						});
						break;
					}
					case 'PONG': {
						if (msg.id === thisId && msg.name === thisUser.name) {
							clearTimeout(timeout);
						} else {
							clearTimeout(timeout);
							this.disconnectUser(socket);
						}
						break;
					}
				}
			});
		} else {
			throw new Error();
		}
	}

	public disconnectUser(socket: WebSocket): void {
		const id = this.socketsToIds.get(socket);

		if (id) {
			const user = this.users.get(id)!;

			this.socketsToIds.delete(socket);
			this.idsToSockets.delete(id);
			this.users.delete(id);

			this.names.delete(user.name);
			clearInterval(this.pings.get(id)!);
			this.pings.delete(id);

			this.idsToSockets.forEach((socket) => {
				socket.send(JSON.stringify({ type: 'USER_LEAVE', id: user.id } as OutboundSocketMsg));
				const leaveMsg = { author: '', id: nanoid(), rawContent: `${user.name} has left the chat` };
				socket.send(
					JSON.stringify({
						type: 'MESSAGE',
						message: leaveMsg
					} as OutboundSocketMsg)
				);
			});

			if (this.users.size === 1) {
				this.messages.splice(0);
			}
		}
	}

	public getUsers(): User[] {
		return [...this.users.values()];
	}

	public getMessages(): Message[] {
		return this.messages;
	}
}
