


import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole, User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

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
@Post('google/token')
async googleTokenAuth(@Body() body: { credential: string }) {
  try {
    // Verificar o token do Google
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Token inválido');
    }

    // Encontrar ou criar usuário
    let user = await this.usersService.findByEmail(payload.email!);
    
    if (!user) {
      user = await this.usersService.createFromGoogle({
        email: payload.email!,
        name: payload.name!,
        googleId: payload.sub,
        photo: payload.picture,
      });
    } else {
      // Atualizar informações do Google
      await this.usersService.updateGoogleInfo(user.id, {
        googleId: payload.sub,
        photo: payload.picture,
      });
    }

    // Gerar token JWT
    const result = await this.authService.login(user);
    return result;
    
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Falha na autenticação com Google');
  }
}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: express.Request & { user: any }, @Res() res: express.Response) {
    try {
      const token = await this.authService.googleLogin(req.user);
      
      // Redirecionar para o frontend com o token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}?token=${token.access_token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}?error=auth_failed`);
    }
  }

  @Post('seed')
  async seedUsers() {
  const users = [
    // Usuários ativos (fizeram login recentemente)
    {
      name: 'João Silva',
      email: 'joao@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: new Date(), // Login hoje
    },
    {
      name: 'Maria Santos',
      email: 'maria@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Login há 5 dias
    },
    {
      name: 'Pedro Admin',
      email: 'pedro@conectar.com',
      password: '123456',
      role: UserRole.ADMIN,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Login há 2 dias
    },
    
    // Usuários INATIVOS (mais de 30 dias sem login)
    {
      name: 'Ana Costa',
      email: 'ana@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Login há 35 dias
    },
    {
      name: 'Carlos Inativo',
      email: 'carlos@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Login há 45 dias
    },
    {
      name: 'Julia Antiga',
      email: 'julia@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Login há 60 dias
    },
    
    // Usuários que NUNCA fizeram login (criados há mais de 30 dias)
    {
      name: 'Roberto Nunca Logou',
      email: 'roberto@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: null, // Nunca fez login
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Criado há 40 dias
    },
    {
      name: 'Lucia Sem Login',
      email: 'lucia@conectar.com',
      password: '123456',
      role: UserRole.USER,
      lastLogin: null, // Nunca fez login
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // Criado há 50 dias
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