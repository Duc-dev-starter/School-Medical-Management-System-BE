import { CacheKey, CacheTTL, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  @CacheKey('some_route')
  @CacheTTL(30)
  async getHello() {
    return this.appService.getHello();
  }
}