import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAuthDeps,
  staffUser,
  STRONG_PASSWORD,
  VALID_TOTP_CODE,
} from '../../../../test/support/in-memory-auth.js';
import {
  InvalidCredentialsError,
  InvalidMfaCodeError,
  InvalidResetTokenError,
  InvalidSessionError,
  WeakPasswordError,
} from '../domain/auth-errors.js';
import { AuthenticateSession } from './authenticate-session.js';
import { Login } from './login.js';
import { Logout } from './logout.js';
import { RequestPasswordReset } from './request-password-reset.js';
import { ResetPassword } from './reset-password.js';
import { VerifyMfa } from './verify-mfa.js';

describe('auth use cases', () => {
  let deps: ReturnType<typeof createAuthDeps>;
  let login: Login;
  let verifyMfa: VerifyMfa;
  let authenticate: AuthenticateSession;
  let logout: Logout;
  let requestReset: RequestPasswordReset;
  let resetPassword: ResetPassword;

  beforeEach(() => {
    deps = createAuthDeps();
    deps.users.add(staffUser());
    login = new Login(deps);
    verifyMfa = new VerifyMfa(deps);
    authenticate = new AuthenticateSession(deps);
    logout = new Logout(deps);
    requestReset = new RequestPasswordReset(deps);
    resetPassword = new ResetPassword(deps);
  });

  const signIn = (remember = false) =>
    login.execute({ email: ' Turno@CafeCentral.com ', password: STRONG_PASSWORD, remember });

  describe('login', () => {
    it('opens an authenticated session and stores only the token hash', async () => {
      const result = await signIn(true);

      expect(result.stage).toBe('authenticated');
      expect(result.staff).toEqual({ id: 'staff-1', email: 'turno@cafecentral.com', name: 'Sofía M.', role: 'OWNER' });
      expect(result.expiresAt).toEqual(new Date(deps.clock.now().getTime() + deps.config.sessionTtlMs));
      expect(deps.sessions.items[0]).toMatchObject({ tokenHash: `sha:${result.token}`, remember: true });
      await expect(authenticate.execute(result.token)).resolves.toMatchObject({ staff: { id: 'staff-1' } });
    });

    it('answers a wrong password and an unknown email with the same error', async () => {
      await expect(login.execute({ email: 'turno@cafecentral.com', password: 'nope', remember: false })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
      await expect(login.execute({ email: 'ghost@cafecentral.com', password: STRONG_PASSWORD, remember: false })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
      expect(deps.sessions.items).toHaveLength(0);
    });

    it('returns a short-lived pending session when the user has MFA enrolled', async () => {
      deps.users.add(staffUser({ mfaSecret: 'SECRET' }));

      const result = await signIn();

      expect(result.stage).toBe('mfa_pending');
      expect(result.expiresAt).toEqual(new Date(deps.clock.now().getTime() + deps.config.mfaPendingTtlMs));
      await expect(authenticate.execute(result.token)).rejects.toBeInstanceOf(InvalidSessionError);
    });
  });

  describe('verify MFA', () => {
    beforeEach(() => deps.users.add(staffUser({ mfaSecret: 'SECRET' })));

    it('rotates the pending session into an authenticated one', async () => {
      const pending = await signIn(true);

      const result = await verifyMfa.execute({ token: pending.token, code: VALID_TOTP_CODE });

      expect(result.stage).toBe('authenticated');
      expect(result.remember).toBe(true);
      expect(result.token).not.toBe(pending.token);
      await expect(authenticate.execute(result.token)).resolves.toMatchObject({ staff: { id: 'staff-1' } });
      await expect(verifyMfa.execute({ token: pending.token, code: VALID_TOTP_CODE })).rejects.toBeInstanceOf(InvalidSessionError);
    });

    it('rejects a wrong code and a replayed code', async () => {
      const pending = await signIn();
      await expect(verifyMfa.execute({ token: pending.token, code: '000000' })).rejects.toBeInstanceOf(InvalidMfaCodeError);

      await verifyMfa.execute({ token: pending.token, code: VALID_TOTP_CODE });
      const second = await signIn();
      await expect(verifyMfa.execute({ token: second.token, code: VALID_TOTP_CODE })).rejects.toBeInstanceOf(InvalidMfaCodeError);
    });

    it('rejects an expired pending session', async () => {
      const pending = await signIn();
      deps.clock.advance(deps.config.mfaPendingTtlMs + 1);

      await expect(verifyMfa.execute({ token: pending.token, code: VALID_TOTP_CODE })).rejects.toBeInstanceOf(InvalidSessionError);
    });
  });

  describe('sessions', () => {
    it('logout revokes the session', async () => {
      const { token } = await signIn();

      await logout.execute(token);

      await expect(authenticate.execute(token)).rejects.toBeInstanceOf(InvalidSessionError);
    });

    it('rejects expired and unknown sessions', async () => {
      const { token } = await signIn();
      deps.clock.advance(deps.config.sessionTtlMs);

      await expect(authenticate.execute(token)).rejects.toBeInstanceOf(InvalidSessionError);
      await expect(authenticate.execute('token-unknown')).rejects.toBeInstanceOf(InvalidSessionError);
    });
  });

  describe('password reset', () => {
    const NEW_PASSWORD = 'Una frase larga para la barra';

    const resetTokenFromMail = async () => {
      await requestReset.execute('turno@cafecentral.com');
      const url = new URL(deps.mailer.sent[0]!.resetUrl);
      return url.searchParams.get('token')!;
    };

    it('is silent for an unknown email', async () => {
      await expect(requestReset.execute('ghost@cafecentral.com')).resolves.toBeUndefined();
      expect(deps.mailer.sent).toHaveLength(0);
      expect(deps.resetTokens.items).toHaveLength(0);
    });

    it('mails a one-time link and stores only the token hash', async () => {
      const token = await resetTokenFromMail();

      expect(deps.mailer.sent[0]).toMatchObject({ to: 'turno@cafecentral.com', name: 'Sofía M.' });
      expect(deps.resetTokens.items[0]?.tokenHash).toBe(`sha:${token}`);
    });

    it('changes the password, revokes every session and burns the token', async () => {
      const { token: sessionToken } = await signIn();
      const token = await resetTokenFromMail();

      await resetPassword.execute({ token, password: NEW_PASSWORD });

      await expect(authenticate.execute(sessionToken)).rejects.toBeInstanceOf(InvalidSessionError);
      await expect(login.execute({ email: 'turno@cafecentral.com', password: NEW_PASSWORD, remember: false })).resolves.toBeDefined();
      await expect(resetPassword.execute({ token, password: NEW_PASSWORD })).rejects.toBeInstanceOf(InvalidResetTokenError);
    });

    it('rejects an expired token', async () => {
      const token = await resetTokenFromMail();
      deps.clock.advance(deps.config.resetTokenTtlMs);

      await expect(resetPassword.execute({ token, password: NEW_PASSWORD })).rejects.toBeInstanceOf(InvalidResetTokenError);
    });

    it('rejects a weak password without consuming the token', async () => {
      const token = await resetTokenFromMail();

      const error = await resetPassword.execute({ token, password: 'corta' }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WeakPasswordError);
      expect((error as WeakPasswordError).unmet).toEqual(['length']);
      expect(deps.resetTokens.items[0]?.usedAt).toBeNull();
    });
  });
});
