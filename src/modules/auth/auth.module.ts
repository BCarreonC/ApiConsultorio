import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { JwtStrategy } from './jwt.strategy';

import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    PassportModule,

    ConfigModule,

    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),

        signOptions: {
          expiresIn: parseInt(config.get<string>('jwt.expires', '3600'), 10),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
