import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import type { CacheModuleAsyncOptions } from '@nestjs/cache-manager';

export const redisCacheConfig = (): CacheModuleAsyncOptions => ({
    isGlobal: true,
    imports: [],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
            socket: {
                host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
                port: configService.get<number>('REDIS_PORT', 6379),
            },
            // password: configService.get<string>('REDIS_PASSWORD'),
            // database: configService.get<number>('REDIS_DB_NUMBER', 0),
            ttl: 5 * 60, // TTL in seconds
        });

        console.log('✅ Redis store created successfully.');
        return { store };
    },
});
