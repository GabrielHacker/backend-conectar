import { Controller, Post, Body, Get, Query, UseGuards, Param, Put, Delete, Req } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';  
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.usersService.findAllWithFilters({ name, email, role, sortBy, order });
  }

  @Get('inactive')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findInactiveUsers() {
    return this.usersService.findInactiveUsers();
  }

  @Get('notifications')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getNotifications() {
    const inactiveUsers = await this.usersService.findInactiveUsers();
    const totalUsers = await this.usersService.countUsers();
    
    return {
      inactiveUsers: {
        count: inactiveUsers.length,
        users: inactiveUsers,
      },
      totalUsers,
      lastUpdate: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: string;
      email?: string;
      role?: UserRole;
    },
    @Req() req: Request & { user: any },
  ) {
    // Usuários regulares só podem editar a si mesmos
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return { message: 'Você só pode editar seu próprio perfil' };
    }

    // Usuários regulares não podem alterar role
    if (req.user.role !== 'admin' && updateData.role) {
      delete updateData.role;
    }

    return this.usersService.update(id, updateData);
  }
    @Put(':id/password')
    async updatePassword(
      @Param('id') id: string,
      @Body() passwordData: { 
        currentPassword: string; 
        newPassword: string 
      },
      @Req() req: Request & { user: any },
    ) {
      try {
        // Usuários só podem alterar sua própria senha
        if (req.user.sub !== id) {
          return { message: 'Você só pode alterar sua própria senha' };
        }

        await this.usersService.updatePassword(id, passwordData);
        return { message: 'Senha atualizada com sucesso' };
      } catch (error: any) {
        return { message: error.message };
      }
    }
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Req() req: Request & { user: any }) {
    // Administradores não podem excluir a si mesmos
    if (req.user.sub === id) {
      return { message: 'Você não pode excluir sua própria conta' };
    }

    return this.usersService.remove(id);
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    try {
      const user = await this.usersService.create(registerDto);
      return { message: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    } catch (error) {
      return { message: 'Error creating user', error: error.message };
    }
  }
}