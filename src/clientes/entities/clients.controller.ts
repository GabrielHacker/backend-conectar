import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import * as clientsServices from './clients.services';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: clientsServices.ClientsService) {}

  @Post()
  async create(
    @Body() createClientDto: clientsServices.CreateClientDto,
    @Req() req: Request & { user: any }
  ) {
    // Associar o cliente ao usuário logado
    createClientDto.userId = req.user.sub;
    
    try {
      const client = await this.clientsService.create(createClientDto);
      return {
        message: 'Cliente criado com sucesso',
        client,
      };
    } catch (error) {
      return {
        message: 'Erro ao criar cliente',
        error: error.message,
      };
    }
  }

  @Get()
  async findAll(
    @Req() req: Request & { user: any },
    @Query('nomeNaFachada') nomeNaFachada?: string,
    @Query('cnpj') cnpj?: string,
    @Query('status') status?: string,
    @Query('cidade') cidade?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    const userId = req.user.role === 'admin' ? undefined : req.user.sub;
    
    return this.clientsService.findAllWithFilters({
      nomeNaFachada,
      cnpj,
      status,
      cidade,
      userId,
      sortBy,
      order,
    });
  }

  @Get('my-stats')
  async getMyStats(@Req() req: Request & { user: any }) {
    const userId = req.user.sub;
    
    const [
      totalClients,
      activeClients,
      inactiveClients,
    ] = await Promise.all([
      this.clientsService.countByUser(userId),
      this.clientsService.findByStatus('ativo', userId),
      this.clientsService.findByStatus('inativo', userId),
    ]);

    return {
      total: totalClients,
      ativos: activeClients.length,
      inativos: inactiveClients.length,
      percentualAtivos: totalClients > 0 ? Math.round((activeClients.length / totalClients) * 100) : 0,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: any }
  ) {
    const userId = req.user.role === 'admin' ? undefined : req.user.sub;
    const client = await this.clientsService.findOne(id, userId);
    
    if (!client) {
      return { message: 'Cliente não encontrado' };
    }
    
    return client;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: clientsServices.UpdateClientDto,
    @Req() req: Request & { user: any }
  ) {
    const userId = req.user.role === 'admin' ? undefined : req.user.sub;
    
    try {
      const client = await this.clientsService.update(id, updateClientDto, userId);
      
      if (!client) {
        return { message: 'Cliente não encontrado ou sem permissão' };
      }
      
      return {
        message: 'Cliente atualizado com sucesso',
        client,
      };
    } catch (error) {
      return {
        message: 'Erro ao atualizar cliente',
        error: error.message,
      };
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: any }
  ) {
    const userId = req.user.role === 'admin' ? undefined : req.user.sub;
    return this.clientsService.remove(id, userId);
  }
}