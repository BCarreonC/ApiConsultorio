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
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Agendar una cita' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar citas por paciente, médico, fecha, estado o próximas citas',
  })
  findAll(@Query() query: ListAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Consultar disponibilidad de un médico' })
  findAvailability(@Query() query: AppointmentAvailabilityDto) {
    return this.appointmentsService.findAvailability(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una cita por ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar motivo o notas de una cita' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una cita sin eliminar su historial' })
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, dto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({
    summary: 'Reprogramar una cita y liberar el horario anterior',
  })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirmar una cita' })
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar una cita como atendida' })
  complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Marcar que el paciente no se presentó' })
  noShow(@Param('id') id: string) {
    return this.appointmentsService.markNoShow(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar físicamente una cita (uso administrativo excepcional)',
  })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
