import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Client } from './clientes/entities/client.entity';
import { ClientsModule } from './clientes/entities/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Client],
      synchronize: true, // apenas para desenvolvimento
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret-key-conectar-2024',
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
  ],
})
export class AppModule {}
