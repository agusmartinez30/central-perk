import { Injectable } from '@nestjs/common';
import type { PasswordResetTokenRepository, NewPasswordResetToken, PasswordResetToken } from '../domain/password-reset-token.js';
import type { NewSession, Session, SessionRepository, SessionStage } from '../domain/session.js';
import type { StaffUser, StaffUserRepository } from '../domain/staff-user.js';
import type { Session as SessionRow, SessionStage as SessionStageRow } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';

const STAGE_TO_ROW: Record<SessionStage, SessionStageRow> = { mfa_pending: 'MFA_PENDING', authenticated: 'AUTHENTICATED' };

function toSession({ stage, ...row }: SessionRow): Session {
  return { ...row, stage: stage === 'MFA_PENDING' ? 'mfa_pending' : 'authenticated' };
}

const STAFF_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  passwordHash: true,
  mfaSecret: true,
  mfaLastUsedStep: true,
} as const;

@Injectable()
export class PrismaStaffUserRepository implements StaffUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<StaffUser | null> {
    return this.prisma.staffUser.findUnique({ where: { email }, select: STAFF_USER_FIELDS });
  }

  findById(id: string): Promise<StaffUser | null> {
    return this.prisma.staffUser.findUnique({ where: { id }, select: STAFF_USER_FIELDS });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.staffUser.update({ where: { id }, data: { passwordHash } });
  }

  async recordMfaStep(id: string, step: number): Promise<void> {
    await this.prisma.staffUser.update({ where: { id }, data: { mfaLastUsedStep: step } });
  }
}

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({ stage, ...data }: NewSession): Promise<Session> {
    const row = await this.prisma.session.create({
      data: { ...data, stage: STAGE_TO_ROW[stage], lastUsedAt: data.createdAt },
    });
    return toSession(row);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { tokenHash } });
    return row && toSession(row);
  }

  async touch(id: string, at: Date): Promise<void> {
    await this.prisma.session.update({ where: { id }, data: { lastUsedAt: at } });
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: at } });
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } });
  }
}

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewPasswordResetToken): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data });
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async consume(id: string, at: Date): Promise<boolean> {
    const { count } = await this.prisma.passwordResetToken.updateMany({ where: { id, usedAt: null }, data: { usedAt: at } });
    return count === 1;
  }
}
