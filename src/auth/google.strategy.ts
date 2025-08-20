import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const email = emails[0].value;
    const displayName = name.givenName + ' ' + name.familyName;

    try {
      // Verificar se usuário já existe
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Criar novo usuário se não existir
        user = await this.usersService.createFromGoogle({
          email,
          name: displayName,
          googleId: id,
          photo: photos[0].value,
          role: UserRole.USER, // Usuários do Google começam como USER
        });
      } else {
        // Atualizar dados do Google se usuário já existe
        await this.usersService.updateGoogleInfo(user.id, {
          googleId: id,
          photo: photos[0].value,
        });
      }

      // Atualizar último login
      await this.usersService.updateLastLogin(user.id);

      const result = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: photos[0].value,
        provider: 'google',
      };

      done(null, result);
    } catch (error) {
      done(error, false);
    }
  }
}