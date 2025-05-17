import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config/swagger.config';
import { initializeFirebaseAdmin } from './config/firebase.config';
import { ConfigService } from '@nestjs/config';
import { CustomExceptionFilter } from './common/exceptions';
// import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new CustomExceptionFilter());
  SwaggerConfig.setupSwagger(app);
  // app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  initializeFirebaseAdmin(app.get(ConfigService));

  // app.useGlobalPipes(new ValidationPipe({
  //   exceptionFactory: (errors) => {
  //     // Trả về lỗi chi tiết từ `class-validator`
  //     return new BadRequestException(errors);
  //   },
  //   transform: true, // Chuyển đổi dữ liệu vào đúng kiểu
  //   whitelist: true, // Tự động loại bỏ các thuộc tính không hợp lệ
  //   forbidNonWhitelisted: true, // Từ chối các thuộc tính không có trong DTO
  // }));

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

