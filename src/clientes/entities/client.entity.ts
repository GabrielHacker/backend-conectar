import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Informações Cadastrais
  @Column()
  nomeNaFachada: string;

  @Column({ unique: true })
  cnpj: string;

  @Column()
  razaoSocial: string;

  @Column({ nullable: true })
  inscricaoEstadual: string;

  @Column({ nullable: true })
  inscricaoMunicipal: string;

  // Endereço
  @Column()
  cep: string;

  @Column()
  rua: string;

  @Column()
  numero: string;

  @Column({ nullable: true })
  complemento: string;

  @Column()
  bairro: string;

  @Column()
  cidade: string;

  @Column()
  estado: string;

  @Column({ default: 'Brasil' })
  pais: string;

  // Contato
  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  // Status
  @Column({ default: 'ativo' })
  status: string; // ativo, inativo, suspenso

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  // Relacionamento com usuário responsável
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}