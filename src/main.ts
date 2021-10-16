declare const module: any;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const cors = {
    origin: [/^(https?:\/\/localhost:8000)$/i, /https?:\/\/(([^/]+\.)?hatandbeyond\.cloud)$/i]
  }

  const app = await NestFactory.create(AppModule, { cors });
  await app.listen(process.env.PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
