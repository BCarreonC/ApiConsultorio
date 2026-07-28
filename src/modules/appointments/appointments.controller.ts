import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentAvailabilityDto } from './dto/appointment-availability.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Agendar una cita',
  })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar citas',
  })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Consultar disponibilidad de un médico',
  })
  findAvailability(
    @Query()
    query: AppointmentAvailabilityDto,
  ) {
    return this.appointmentsService.findAvailability(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar una cita por ID',
  })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una cita',
  })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una cita',
  })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
