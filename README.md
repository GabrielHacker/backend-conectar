# 🚀 Conectar Backend

Sistema de gerenciamento de usuários e clientes desenvolvido em NestJS para o desafio técnico da Conéctar.

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [API Endpoints](#-api-endpoints)
- [Autenticação](#-autenticação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Testes](#-testes)
- [Collection Postman](#-collection-postman)
- [Deploy](#-deploy)
- [Contribuição](#-contribuição)

## 📖 Sobre o Projeto

O Conectar Backend é uma API REST desenvolvida para gerenciar usuários e clientes de forma eficiente e segura. O sistema possui dois níveis de acesso (Admin e Usuário) com funcionalidades específicas para cada perfil.

### Principais características:
- 🔐 Autenticação JWT com roles (Admin/User)
- 👥 Gerenciamento completo de usuários
- 🏢 Sistema de clientes com relacionamentos
- 📊 Notificações de usuários inativos
- 🔒 Criptografia de senhas com bcrypt
- 📱 API RESTful com validações robustas

## 🛠 Tecnologias

- **Framework:** NestJS 10.x
- **Linguagem:** TypeScript 5.x
- **Banco de Dados:** SQLite
- **ORM:** TypeORM
- **Autenticação:** JWT + bcrypt
- **Validação:** class-validator + class-transformer
- **Documentação:** Postman Collection
- **Testes:** Jest (unitários e e2e)
- **Deploy:** Railway/Heroku

## ⚡ Funcionalidades

### 🔐 Autenticação
- [x] Login com email/senha
- [x] Registro de novos usuários
- [x] JWT tokens com expiração
- [x] Middleware de autenticação
- [x] Controle de acesso por roles

### 👥 Gestão de Usuários
- [x] CRUD completo de usuários
- [x] Filtros avançados (nome, email, role)
- [x] Alteração de senha segura
- [x] Detecção de usuários inativos
- [x] Soft delete com validações

### 🏢 Gestão de Clientes
- [x] CRUD completo de clientes
- [x] Relacionamento com usuários
- [x] Filtros por múltiplos campos
- [x] Validação de CNPJ
- [x] Deleção em cascata

### 📊 Notificações
- [x] Usuários inativos (+30 dias)
- [x] Estatísticas do sistema
- [x] Dashboard administrativo

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm 8+
- Git

### Clone e Instale
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/conectar-backend.git
cd conectar-backend

# Instale as dependências
npm install
```

## ⚙️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# JWT Configuration
JWT_SECRET=conectar-super-secret-key-2024
JWT_EXPIRES_IN=1d

# Database
DATABASE_PATH=./database.sqlite

# Application
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3001
```

### Banco de Dados
O banco SQLite será criado automaticamente na primeira execução:
```bash
# O arquivo database.sqlite será gerado automaticamente
# Localização: ./database.sqlite
```

### Seed de Dados (Opcional)
```bash
# Após a primeira execução, você pode popular o banco:
# POST http://localhost:3000/auth/seed
```

## 🚀 Execução

### Desenvolvimento
```bash
# Modo desenvolvimento (hot reload)
npm run start:dev

# Modo debug
npm run start:debug

# Limpar cache e restart
npm run start:dev -- --watch
```

### Produção
```bash
# Build da aplicação
npm run build

# Executar build
npm run start:prod
```

A API estará disponível em: `http://localhost:3000`

## 📡 API Endpoints

### 🔐 Autenticação (`/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Realizar login | ❌ |
| POST | `/auth/register` | Registrar usuário | ❌ |
| POST | `/auth/seed` | Criar dados de teste | ❌ |

#### POST `/auth/login`
```json
// Request
{
  "email": "admin@conectar.com",
  "password": "123456"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@conectar.com",
    "role": "admin",
    "createdAt": "2024-08-21T10:00:00.000Z",
    "updatedAt": "2024-08-21T10:00:00.000Z"
  }
}
```

#### POST `/auth/register`
```json
// Request
{
  "name": "João Silva",
  "email": "joao@conectar.com",
  "password": "123456",
  "role": "user"
}

// Response
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@conectar.com",
    "role": "user"
  }
}
```

### 👥 Usuários (`/users`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/users` | Listar usuários | ✅ | ALL |
| GET | `/users/:id` | Buscar usuário | ✅ | ALL |
| PUT | `/users/:id` | Atualizar usuário | ✅ | OWNER/ADMIN |
| PUT | `/users/:id/password` | Alterar senha | ✅ | OWNER |
| DELETE | `/users/:id` | Excluir usuário | ✅ | ADMIN |
| GET | `/users/inactive` | Usuários inativos | ✅ | ADMIN |
| GET | `/users/notifications` | Notificações | ✅ | ADMIN |

#### GET `/users?name=João&role=user&sortBy=name&order=asc`
```json
// Response
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@conectar.com",
    "role": "user",
    "createdAt": "2024-08-21T10:00:00.000Z",
    "updatedAt": "2024-08-21T10:00:00.000Z",
    "lastLogin": "2024-08-21T15:30:00.000Z"
  }
]
```

#### PUT `/users/:id/password`
```json
// Request
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha_123"
}

// Response
{
  "message": "Senha atualizada com sucesso"
}
```

#### GET `/users/notifications`
```json
// Response
{
  "inactiveUsers": {
    "count": 5,
    "users": [
      {
        "id": "uuid",
        "name": "Usuário Inativo",
        "email": "inativo@test.com",
        "role": "user",
        "lastLogin": "2024-07-01T10:00:00.000Z"
      }
    ]
  },
  "totalUsers": 15,
  "lastUpdate": "2024-08-21T10:30:00.000Z"
}
```

### 🏢 Clientes (`/clients`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/clients` | Listar clientes | ✅ | ALL |
| GET | `/clients/:id` | Buscar cliente | ✅ | ALL |
| POST | `/clients` | Criar cliente | ✅ | ALL |
| PUT | `/clients/:id` | Atualizar cliente | ✅ | OWNER/ADMIN |
| DELETE | `/clients/:id` | Excluir cliente | ✅ | OWNER/ADMIN |
| GET | `/clients/my-stats` | Estatísticas | ✅ | ALL |

#### POST `/clients`
```json
// Request
{
  "razaoSocial": "Empresa LTDA",
  "cnpj": "12.345.678/0001-90",
  "nomeNaFachada": "Loja da Esquina",
  "inscricaoEstadual": "123456789",
  "inscricaoMunicipal": "987654321",
  "cep": "01234-567",
  "rua": "Rua das Flores, 123",
  "numero": "123",
  "complemento": "Sala 101",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "telefone": "(11) 99999-9999",
  "email": "contato@empresa.com",
  "website": "https://empresa.com",
  "status": "ativo",
  "observacoes": "Cliente VIP"
}

// Response
{
  "id": "uuid",
  "razaoSocial": "Empresa LTDA",
  "cnpj": "12.345.678/0001-90",
  "nomeNaFachada": "Loja da Esquina",
  "userId": "user-uuid",
  "status": "ativo",
  "createdAt": "2024-08-21T10:00:00.000Z",
  "updatedAt": "2024-08-21T10:00:00.000Z"
}
```

## 🔐 Autenticação

### JWT Token
Todas as rotas protegidas requerem autenticação via JWT:

```bash
# Header obrigatório
Authorization: Bearer <seu-jwt-token>

# Exemplo
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles e Permissões

#### 👑 Admin
- ✅ Visualizar todos os usuários
- ✅ Criar/editar/excluir usuários
- ✅ Visualizar todos os clientes
- ✅ Acessar notificações do sistema
- ✅ Gerenciar roles de outros usuários

#### 👤 User
- ✅ Visualizar próprio perfil
- ✅ Editar próprios dados
- ✅ Alterar própria senha
- ✅ Visualizar/gerenciar próprios clientes
- ❌ Não pode alterar própria role
- ❌ Não pode acessar dados de outros usuários

### Middleware de Segurança
- **JwtAuthGuard:** Validação de token JWT
- **RolesGuard:** Controle de acesso por função
- **Password Hash:** bcrypt com salt rounds 10
- **CORS:** Configurado para frontend específico

## 📁 Estrutura do Projeto

```
src/
├── auth/                       # Módulo de autenticação
│   ├── auth.controller.ts      # Endpoints login/register
│   ├── auth.service.ts         # Lógica de autenticação
│   ├── auth.module.ts          # Configuração do módulo
│   ├── jwt-auth.guard.ts       # Guard JWT
│   ├── roles.guard.ts          # Guard de roles
│   ├── roles.decorator.ts      # Decorator @Roles
│   ├── auth.controller.spec.ts # Testes do controller
│   └── auth.service.spec.ts    # Testes do service
├── users/                      # Módulo de usuários
│   ├── entities/
│   │   ├── user.entity.ts      # Entidade User
│   │   └── user.entity.spec.ts # Testes da entidade
│   ├── dto/
│   │   ├── create-user.dto.ts  # DTO de criação
│   │   └── update-user.dto.ts  # DTO de atualização
│   ├── users.controller.ts     # Endpoints de usuários
│   ├── users.service.ts        # Lógica de negócio
│   ├── users.module.ts         # Configuração do módulo
│   ├── users.controller.spec.ts # Testes do controller
│   └── users.service.spec.ts   # Testes do service
├── clients/                    # Módulo de clientes
│   ├── entities/
│   │   ├── client.entity.ts    # Entidade Client
│   │   └── client.entity.spec.ts # Testes da entidade
│   ├── dto/
│   │   ├── create-client.dto.ts # DTO de criação
│   │   └── update-client.dto.ts # DTO de atualização
│   ├── clients.controller.ts   # Endpoints de clientes
│   ├── clients.service.ts      # Lógica de negócio
│   ├── clients.module.ts       # Configuração do módulo
│   ├── clients.controller.spec.ts # Testes do controller
│   └── clients.service.spec.ts # Testes do service
├── app.module.ts               # Módulo principal
├── main.ts                     # Bootstrap da aplicação
└── database.sqlite             # Banco SQLite (auto-gerado)
```

## 🧪 Testes

### Scripts Disponíveis
```bash
# Testes unitários
npm run test                    # Executar todos os testes
npm run test:watch             # Modo watch (re-executa ao salvar)
npm run test:cov               # Gerar relatório de cobertura
npm run test:debug             # Modo debug

# Testes E2E
npm run test:e2e               # Testes end-to-end
npm run test:e2e:watch         # E2E em modo watch

# Testes específicos
npm test users.service.spec.ts # Testar arquivo específico
npm test -- --testNamePattern="create" # Testar métodos específicos
```

### Estrutura de Testes

#### 🧪 Testes Unitários (.spec.ts)
```typescript
// Exemplo: users.service.spec.ts
describe('UsersService', () => {
  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange, Act, Assert
    });
    
    it('should throw error if email exists', async () => {
      // Test error scenarios
    });
  });
});
```

#### 🔄 Testes E2E (test/*.e2e-spec.ts)
```typescript
// Exemplo: auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});
```

### Cobertura de Testes
```bash
# Gerar relatório de cobertura
npm run test:cov

# Relatório será gerado em:
coverage/
├── lcov-report/
│   └── index.html              # Abrir no navegador
└── lcov.info                   # Dados para CI/CD
```

### Mocks e Fixtures
```typescript
// Exemplo de mock para testes
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Dados de teste reutilizáveis
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@test.com',
  role: UserRole.USER,
};
```
## 🏗️ Decisões de Arquitetura

### Framework e Tecnologias

#### NestJS + TypeScript
**Decisão:** Escolha do NestJS como framework principal
**Justificativa:**
- **Escalabilidade:** Arquitetura modular inspirada no Angular
- **TypeScript nativo:** Type safety e melhor desenvolvimento
- **Decorators:** Código mais limpo e declarativo (@Controller, @Injectable)
- **Ecosystem maduro:** Integração nativa com TypeORM, JWT, validações
- **Enterprise-ready:** Padrões bem definidos para projetos profissionais

#### SQLite como Banco de Dados
**Decisão:** SQLite ao invés de PostgreSQL/MySQL
**Justificativa:**
- **Simplicidade de setup:** Zero configuração para desenvolvimento e testes
- **Portabilidade:** Arquivo único, fácil backup e deploy
- **Performance adequada:** Suficiente para o volume esperado do sistema
- **Desenvolvimento ágil:** Não requer instalação de servidor de banco
- **Facilidade de migração:** Pode ser facilmente migrado para PostgreSQL em produção

### Padrões de Arquitetura

#### Arquitetura em Camadas
```
Controllers → Services → Repositories → Database
```
**Justificativa:**
- **Separação de responsabilidades:** Cada camada tem função específica
- **Testabilidade:** Fácil mock das dependências entre camadas
- **Manutenibilidade:** Mudanças isoladas em cada camada
- **Reutilização:** Services podem ser usados por múltiplos controllers

#### Injeção de Dependência
**Decisão:** Uso extensivo do DI container do NestJS
**Justificativa:**
- **Baixo acoplamento:** Componentes não dependem de implementações concretas
- **Testabilidade:** Fácil substituição por mocks em testes
- **Configurabilidade:** Troca de implementações via configuração
- **Manutenibilidade:** Mudanças centralizadas no módulo

### Segurança

#### JWT + bcrypt
**Decisão:** JWT para autenticação + bcrypt para hash de senhas
**Justificativa:**
- **Stateless:** JWT permite escalabilidade horizontal
- **Segurança:** bcrypt com salt rounds 10 previne rainbow tables
- **Performance:** Validação local do token sem consulta ao banco
- **Flexibilidade:** Fácil integração com frontend SPA

#### Guards e Decorators
**Decisão:** Sistema de autorização baseado em Guards
**Justificativa:**
- **Declarativo:** @UseGuards() torna intenções explícitas
- **Reutilizável:** Mesmo guard usado em múltiplos endpoints
- **Interceptação precoce:** Bloqueia requisições antes do controller
- **Composabilidade:** Combinação de múltiplos guards (@Roles + @JwtAuth)

### Validação e DTOs

#### class-validator + class-transformer
**Decisão:** Validação declarativa com decorators
**Justificativa:**
- **Type safety:** Validação em tempo de compilação e execução
- **Documentação viva:** Validações servem como documentação
- **Reutilização:** DTOs reutilizáveis entre endpoints
- **Feedback claro:** Mensagens de erro específicas para o frontend

#### DTOs separados por operação
```typescript
CreateUserDto, UpdateUserDto, LoginDto
```
**Justificativa:**
- **Princípio da responsabilidade única:** Cada DTO tem propósito específico
- **Validações específicas:** Campos obrigatórios diferentes por operação
- **Evolução independente:** Mudanças em create não afetam update
- **Clareza de API:** Documentação mais precisa para cada endpoint

### Estrutura de Módulos

#### Módulos por Domínio
```
auth/, users/, clients/
```
**Justificativa:**
- **Domain-Driven Design:** Organização por contexto de negócio
- **Baixo acoplamento:** Módulos independentes com interfaces bem definidas
- **Escalabilidade:** Fácil adição de novos domínios
- **Time paralelo:** Diferentes desenvolvedores podem trabalhar em módulos distintos

#### Barrel Exports
**Decisão:** Exports centralizados via index.ts
**Justificativa:**
- **API limpa:** Controle sobre o que é exportado
- **Refatoração segura:** Mudanças internas não afetam imports externos
- **Performance:** Tree-shaking mais eficiente
- **Organização:** Ponto único de entrada por módulo

### Tratamento de Erros

#### Exception Filters Globais
**Decisão:** Tratamento centralizado de erros
**Justificativa:**
- **Consistência:** Formato padrão de resposta de erro
- **Logging centralizado:** Todos os erros passam pelo mesmo ponto
- **Segurança:** Evita vazamento de informações sensíveis
- **Manutenibilidade:** Mudanças no formato de erro em um local

#### HTTP Status Codes Semânticos
**Decisão:** Uso correto dos códigos HTTP
**Justificativa:**
- **RESTful:** Seguir padrões da web
- **Frontend amigável:** Fácil tratamento de erros no cliente
- **Cache behavior:** Códigos corretos permitem cache apropriado
- **Debugging:** Status codes facilitam troubleshooting

### Testes

#### Estrutura de Testes Organizada
```
src/module/tests/module.spec.ts
```
**Justificativa:**
- **Organização:** Testes próximos ao código testado
- **Convenção:** Padrão reconhecido pela comunidade
- **Tooling:** Melhor suporte de IDEs e ferramentas
- **Manutenibilidade:** Fácil localização e atualização de testes

#### Jest + Mocking Extensivo
**Decisão:** Jest como framework de testes com mocks
**Justificativa:**
- **Isolamento:** Testes unitários realmente unitários
- **Performance:** Testes rápidos sem dependências externas
- **Determinismo:** Resultados previsíveis e repetíveis
- **Coverage:** Métricas precisas de cobertura de código

### Performance e Otimização

#### TypeORM com Query Builder
**Decisão:** ORM com escape hatch para queries complexas
**Justificativa:**
- **Produtividade:** ORM acelera desenvolvimento básico
- **Flexibilidade:** Query builder para casos complexos
- **Type safety:** Queries tipadas em tempo de compilação
- **Migrations:** Controle de versão do schema

#### Eager/Lazy Loading Estratégico
**Decisão:** Carregamento seletivo de relacionamentos
**Justificativa:**
- **Performance:** Evita queries N+1
- **Flexibilidade:** Diferentes estratégias por endpoint
- **Controle fino:** Otimização caso a caso
- **Previsibilidade:** Comportamento explícito e controlado

### Configuração e Deploy

#### Environment Variables
**Decisão:** Configuração via variáveis de ambiente
**Justificativa:**
- **12-Factor App:** Seguir melhores práticas de deploy
- **Segurança:** Secrets fora do código fonte
- **Flexibilidade:** Configuração diferente por ambiente
- **CI/CD friendly:** Fácil automação de deploys

#### Build Otimizado
**Decisão:** Build TypeScript transpilado para produção
**Justificativa:**
- **Performance:** JavaScript nativo é mais rápido
- **Deployment:** Bundle menor e mais eficiente
- **Compatibilidade:** Suporte a diferentes versões do Node
- **Debugging:** Source maps para troubleshooting em produção



## 📮 Collection Postman

### Importar Collection
1. **Opção 1 - URL da Documentação:**
   ```
[Acesse a documentação da API](https://documenter.getpostman.com/view/47723610/2sB3BKGU6H#38cef34e-9c63-4d3c-b977-271b576b5196)
```


### Variáveis de Ambiente
Configure no Postman Environment:

```json
{
  "baseUrl": "http://localhost:3000",
  "token": "{{authToken}}",
}
```

### Folders da Collection
- 📁 **Auth** - Login, Register, Seed
- 📁 **Users** - CRUD, Password, Inactive, Notifications
- 📁 **Clients** - CRUD, Filters, Stats
- 📁 **Tests** - Scripts de teste automatizados

### Scripts de Teste Automatizados
```javascript
// Exemplo: Auto-set token após login
pm.test("Login successful", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.environment.set("authToken", response.access_token);
});
```




### Variáveis de Produção
```env
# Essenciais para produção
JWT_SECRET=use-um-secret-super-seguro-aqui
NODE_ENV=production
PORT=3000

# Database (SQLite funciona em produção)
DATABASE_PATH=./database.sqlite

# CORS para frontend
FRONTEND_URL=https://seu-frontend.vercel.app

# Opcional: Logging
LOG_LEVEL=info
```



## Desenvolvedor

**Gabriel** - Desenvolvedor Full Stack


---

## Status do Projeto

✅ **Funcionalidades Implementadas:**
- Autenticação JWT completa
- CRUD de usuários com validações
- CRUD de clientes com relacionamentos
- Sistema de notificações
- Alteração de senhas segura
- Filtros avançados
- Testes unitários e E2E
- Documentação Postman
- Deploy em produção

---

**Desenvolvido para o desafio técnico da Conéctar** 



## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
>>>>>>> 4cfdc68 (primeiro commit)
