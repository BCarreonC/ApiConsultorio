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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un paciente',
  })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los pacientes',
  })
  findAll() {
    return this.patientsService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscar pacientes por nombre o apellidos',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    example: 'Juan Pérez',
  })
  search(@Query() query: SearchPatientsDto) {
    return this.patientsService.searchByName(query.name);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar un paciente por ID',
  })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un paciente',
  })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un paciente',
  })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
