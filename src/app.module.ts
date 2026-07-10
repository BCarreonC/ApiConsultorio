import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { MongoModule } from './database/mongo.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),

    MongoModule,

    AuthModule,

    UsersModule,

    DoctorsModule,

    PatientsModule,

    AppointmentsModule,

    ConsultationsModule,

    NotificationsModule,

    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
