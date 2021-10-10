import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { config } from 'dotenv';
import { AppModule } from './app.module';

config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({ origin: [/localhost:3000$/, /biscord.vercel.app$/] });
	app.useWebSocketAdapter(new WsAdapter(app));

	await app.listen(process.env.PORT || 5000);
}
bootstrap();
