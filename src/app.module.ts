import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { RTService } from './rt.service';

@Module({
	imports: [ServeStaticModule.forRoot({ rootPath: join(__dirname, 'static'), serveStaticOptions: { index: false } })],
	controllers: [AppController],
	providers: [RTService, AppController]
})
export class AppModule {}
