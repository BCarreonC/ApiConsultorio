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

import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un médico',
  })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar médicos',
  })
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscar médicos por nombre',
  })
  search(@Query() query: SearchDoctorsDto) {
    return this.doctorsService.searchByName(query.name);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar médico por ID',
  })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
