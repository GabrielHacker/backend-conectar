import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole, User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Inicia o fluxo OAuth do Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request & { user: any }, @Res() res: Response) {
    try {
      const token = await this.authService.googleLogin(req.user);
      
      // Redirecionar para o frontend com o token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/error`);
    }
  }

  @Post('seed')
  async seedUsers() {
    const users = [
      {
        name: 'João Silva',
        email: 'joao@conectar.com',
        password: '123456',
        role: UserRole.USER,
      },
      {
        name: 'Maria Santos',
        email: 'maria@conectar.com',
        password: '123456',
        role: UserRole.USER,
      },
      {
        name: 'Pedro Admin',
        email: 'pedro@conectar.com',
        password: '123456',
        role: UserRole.ADMIN,
      },
      {
        name: 'Ana Costa',
        email: 'ana@conectar.com',
        password: '123456',
        role: UserRole.USER,
      },
    ];

    const createdUsers: User[] = [];
    for (const userData of users) {
      try {
        const existingUser = await this.usersService.findByEmail(userData.email);
        if (!existingUser) {
          const user = await this.usersService.create(userData);
          createdUsers.push(user);
        }
      } catch (error) {
        console.log(`Usuário ${userData.email} já existe ou erro:`, error.message);
      }
    }

    return { message: 'Usuários de teste criados', users: createdUsers };
  }
}