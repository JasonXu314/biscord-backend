import { Body, Controller, Logger, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import WebSocket from 'ws';
import { LoginDTO } from './dtos/login.dto';
import { RTService } from './rt.service';

@Controller()
@WebSocketGateway({ serveClient: false })
export class AppController implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger: Logger;

	constructor(private readonly rtService: RTService) {
		this.logger = new Logger('Main');
	}

	@Post('/login')
	@UsePipes(new ValidationPipe({ whitelist: true }))
	public login(@Body() { name, avatar }: LoginDTO): LoginResponse {
		const newUser = this.rtService.registerUser(name, avatar);

		return {
			type: 'success',
			messages: this.rtService.getMessages(),
			user: newUser,
			users: this.rtService.getUsers()
		};
	}

	public handleConnection(client: WebSocket): void {
		client.once('message', (data: string) => {
			const msg: InboundSocketMsg = JSON.parse(data);

			if (msg.type === 'CONNECT') {
				try {
					this.rtService.connectUser(client, msg.id, msg.name);
					this.logger.log('Client with id ' + msg.id + ' connected');
				} catch (err) {
					this.logger.log(`Client attempting to connect with id ${msg.id} rejected; incorrect name`);
					client.close(undefined, 'error connecting; incorrect name');
				}
			} else {
				this.logger.log(`Client rejected; no connect message`);
				client.close(undefined, 'must send connect message first');
			}
		});
	}

	public handleDisconnect(client: WebSocket): void {
		this.logger.log('Client disconnected');
		this.rtService.disconnectUser(client);
	}
}
