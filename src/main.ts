declare const module: any;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const cors = {
    origin: [/localhost\:8000/, /ec2-3-101-54-23\.us-west-1\.compute\.amazonaws\.com\:8000/]
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
