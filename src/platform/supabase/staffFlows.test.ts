/**
 * Flujos de colegio / profesorado con mocks (cliente).
 * No sustituyen E2E contra Auth real; cubren reglas y mensajes del frontend.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcceptedTeacherRow, PendingInviteRow } from "./teachers";

const VALID_PASSWORD = "Docente1!";
const SCHOOL_ID = "11111111-1111-1111-1111-111111111111";
const MEMBERSHIP_ID = "22222222-2222-2222-2222-222222222222";
const TEACHER_USER_ID = "33333333-3333-3333-3333-333333333333";
const OWNER_USER_ID = "44444444-4444-4444-4444-444444444444";
const INVITE_TOKEN = "a".repeat(32);

type MembershipRow = { role: string; is_active: boolean | null; user_id?: string };

const mocks = vi.hoisted(() => {
  const rpc = vi.fn();
  const invoke = vi.fn();
  const signInWithPassword = vi.fn();
  const setSession = vi.fn();
  const signUp = vi.fn();
  const getUser = vi.fn();
  const signOut = vi.fn();
  const updateUser = vi.fn();
  let membershipsForUser: MembershipRow[] = [];

  const from = vi.fn((table: string) => {
    if (table === "school_memberships") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_col: string, userId: string) =>
            Promise.resolve({
              data: membershipsForUser.filter((row) => !row.user_id || row.user_id === userId),
              error: null,
            }),
          ),
        })),
      };
    }
    if (table === "schools") {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    };
  });

  return {
    rpc,
    invoke,
    signInWithPassword,
    setSession,
    signUp,
    getUser,
    signOut,
    updateUser,
    from,
    setMemberships(rows: MembershipRow[]) {
      membershipsForUser = rows;
    },
    reset() {
      rpc.mockReset();
      invoke.mockReset();
      signInWithPassword.mockReset();
      setSession.mockReset();
      setSession.mockResolvedValue({ data: { session: {} }, error: null });
      signUp.mockReset();
      getUser.mockReset();
      signOut.mockReset();
      updateUser.mockReset();
      from.mockClear();
      membershipsForUser = [];
    },
  };
});

vi.mock("./client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    rpc: mocks.rpc,
    from: mocks.from,
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      setSession: mocks.setSession,
      signUp: mocks.signUp,
      getUser: mocks.getUser,
      signOut: mocks.signOut,
      updateUser: mocks.updateUser,
    },
    functions: { invoke: mocks.invoke },
  }),
}));

function pendingRow(partial: Partial<PendingInviteRow> & { id: string }): PendingInviteRow {
  return {
    email: "p@colegio.edu",
    first_name: "Ana",
    last_name_1: "Pérez",
    last_name_2: "",
    sent_at: "2026-10-18T10:00:00Z",
    expires_at: "2026-10-21T10:00:00Z",
    status: "pending",
    ...partial,
  };
}

function acceptedRow(
  partial: Partial<AcceptedTeacherRow> & { membership_id: string },
): AcceptedTeacherRow {
  return {
    user_id: TEACHER_USER_ID,
    email: "docente@colegio.edu",
    first_name: "Luis",
    last_name_1: "García",
    last_name_2: "",
    is_active: true,
    accepted_at: "2026-10-18T12:00:00Z",
    sent_at: "2026-10-18T10:00:00Z",
    ...partial,
  };
}

describe("staffFlows (mocks)", () => {
  beforeEach(() => {
    mocks.reset();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  // —— 1. Alta colegio + entrada owner ——
  describe("1. Alta del colegio y entrada owner", () => {
    it("signUpOwner crea colegio cuando Auth devuelve sesión", async () => {
      mocks.rpc.mockImplementation(async (fn: string) => {
        if (fn === "registration_inputs_unavailable") {
          return { data: false, error: null };
        }
        if (fn === "create_school_as_owner") {
          return {
            data: { id: SCHOOL_ID, name: "CEIP Prueba", slug: "ceip-prueba" },
            error: null,
          };
        }
        return { data: null, error: null };
      });
      mocks.signUp.mockResolvedValue({
        data: {
          user: { id: OWNER_USER_ID, identities: [{ id: "1" }] },
          session: { access_token: "t" },
        },
        error: null,
      });

      const { signUpOwner } = await import("./auth");
      const result = await signUpOwner({
        email: "direccion@colegio.edu",
        password: VALID_PASSWORD,
        displayName: "CEIP Prueba",
        schoolName: "CEIP Prueba",
      });

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.message).toMatch(/colegio creado/i);
      expect(mocks.signUp).toHaveBeenCalled();
      expect(mocks.rpc).toHaveBeenCalledWith(
        "create_school_as_owner",
        expect.objectContaining({ p_name: "CEIP Prueba" }),
      );
    });

    it("signInWithPassword permite owner activo (vía school-login)", async () => {
      mocks.invoke.mockResolvedValue({
        data: { ok: true, access_token: "a", refresh_token: "r" },
        error: null,
      });

      const { signInWithPassword } = await import("./auth");
      const result = await signInWithPassword("direccion@colegio.edu", VALID_PASSWORD);
      expect(result).toEqual({ ok: true });
      expect(mocks.invoke).toHaveBeenCalledWith(
        "school-login",
        expect.objectContaining({
          body: { email: "direccion@colegio.edu", password: VALID_PASSWORD },
        }),
      );
      expect(mocks.setSession).toHaveBeenCalled();
    });
  });

  // —— Lockout + credenciales (D-037; el Edge aplica el contador) ——
  describe("2+5. Acceso denegado / lockout (cliente)", () => {
    it("school-login responde credenciales inválidas", async () => {
      mocks.invoke.mockResolvedValue({
        data: { ok: false, message: "Credenciales inválidas." },
        error: null,
      });
      const { signInWithPassword } = await import("./auth");
      const result = await signInWithPassword("docente@colegio.edu", VALID_PASSWORD);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe("Credenciales inválidas.");
    });

    it("school-login locked → mensaje D-037", async () => {
      mocks.invoke.mockResolvedValue({
        data: {
          ok: false,
          locked: true,
          message: "Demasiadas credenciales inválidas. Espera 15 minutos.",
        },
        error: null,
      });
      const { signInWithPassword, MSG_LOGIN_LOCKOUT } = await import("./auth");
      const result = await signInWithPassword("docente@colegio.edu", VALID_PASSWORD);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe(MSG_LOGIN_LOCKOUT);
    });

    it("requestNewPassword siempre mensaje neutro", async () => {
      mocks.invoke.mockResolvedValue({
        data: {
          ok: true,
          message:
            "Si el email está registrado, recibirás un enlace para definir una contraseña nueva.",
        },
        error: null,
      });
      const { requestNewPassword } = await import("./auth");
      const result = await requestNewPassword("docente@colegio.edu");
      expect(result.ok).toBe(true);
      expect(result.message).toMatch(/Si el email está registrado/i);
      expect(mocks.invoke).toHaveBeenCalledWith(
        "request-new-password",
        expect.objectContaining({ body: { email: "docente@colegio.edu" } }),
      );
    });

    it("sessionHasAppAccess false si teacher is_active=false", async () => {
      mocks.setMemberships([{ role: "teacher", is_active: false, user_id: TEACHER_USER_ID }]);
      const { sessionHasAppAccess } = await import("./auth");
      await expect(sessionHasAppAccess(TEACHER_USER_ID)).resolves.toBe(false);
    });

    it("sessionHasAppAccess true si teacher activo", async () => {
      mocks.setMemberships([{ role: "teacher", is_active: true, user_id: TEACHER_USER_ID }]);
      const { sessionHasAppAccess } = await import("./auth");
      await expect(sessionHasAppAccess(TEACHER_USER_ID)).resolves.toBe(true);
    });
  });

  // —— 2. Invitación ——
  describe("3. Invitación de profesor", () => {
    it("createTeacherInvite devuelve URL con token", async () => {
      mocks.rpc.mockResolvedValue({
        data: { token: INVITE_TOKEN, expires_at: "2026-10-21T10:00:00Z" },
        error: null,
      });

      const { createTeacherInvite } = await import("./teachers");
      const result = await createTeacherInvite({
        schoolId: SCHOOL_ID,
        email: "nuevo@colegio.edu",
        firstName: "María",
        lastName1: "López",
        lastName2: "",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.inviteUrl).toContain(`invite=${encodeURIComponent(INVITE_TOKEN)}`);
      }
      expect(mocks.rpc).toHaveBeenCalledWith(
        "owner_create_teacher_invite",
        expect.objectContaining({
          p_school_id: SCHOOL_ID,
          p_email: "nuevo@colegio.edu",
          p_first_name: "María",
        }),
      );
    });

    it("createTeacherInvite mapea rate limit", async () => {
      mocks.rpc.mockResolvedValue({
        data: null,
        error: { message: "invite rate limit: 18:30" },
      });
      const { createTeacherInvite } = await import("./teachers");
      const result = await createTeacherInvite({
        schoolId: SCHOOL_ID,
        email: "nuevo@colegio.edu",
        firstName: "María",
        lastName1: "López",
        lastName2: "",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/límite de invitaciones/i);
    });
  });

  // —— 3. Contraseña profesor ——
  describe("4. Generación de contraseña (accept invite)", () => {
    it("rechaza contraseña débil sin llamar a la Edge Function", async () => {
      const { acceptTeacherInvite } = await import("./teachers");
      const result = await acceptTeacherInvite(INVITE_TOKEN, "weak");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/contraseña/i);
      expect(mocks.invoke).not.toHaveBeenCalled();
    });

    it("acceptTeacherInvite ok → needsSignIn (popup Entrar al Colegio)", async () => {
      mocks.invoke.mockResolvedValue({
        data: { ok: true, needsSignIn: true, message: "Cuenta creada." },
        error: null,
      });
      const { acceptTeacherInvite } = await import("./teachers");
      const result = await acceptTeacherInvite(INVITE_TOKEN, VALID_PASSWORD);
      expect(result).toEqual({
        ok: true,
        needsSignIn: true,
        message: "Cuenta creada.",
      });
      expect(mocks.invoke).toHaveBeenCalledWith(
        "accept-teacher-invite",
        expect.objectContaining({
          body: { token: INVITE_TOKEN, password: VALID_PASSWORD },
        }),
      );
    });
  });

  // —— 4. Login profesor ——
  describe("5. Login del profesor activo", () => {
    it("signInWithPassword ok vía school-login", async () => {
      mocks.invoke.mockResolvedValue({
        data: { ok: true, access_token: "a", refresh_token: "r" },
        error: null,
      });
      const { signInWithPassword } = await import("./auth");
      await expect(signInWithPassword("docente@colegio.edu", VALID_PASSWORD)).resolves.toEqual({
        ok: true,
      });
    });
  });

  // —— 5. Desactivar / eliminar ——
  describe("6. Desactivar y eliminar (manage-teacher)", () => {
    it("setTeacherActive(false) invoca deactivate", async () => {
      mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
      const { setTeacherActive } = await import("./teachers");
      const result = await setTeacherActive(MEMBERSHIP_ID, false);
      expect(result).toEqual({ ok: true });
      expect(mocks.invoke).toHaveBeenCalledWith(
        "manage-teacher",
        expect.objectContaining({
          body: { membershipId: MEMBERSHIP_ID, action: "deactivate" },
        }),
      );
    });

    it("setTeacherActive(true) invoca activate", async () => {
      mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
      const { setTeacherActive } = await import("./teachers");
      await setTeacherActive(MEMBERSHIP_ID, true);
      expect(mocks.invoke).toHaveBeenCalledWith(
        "manage-teacher",
        expect.objectContaining({
          body: { membershipId: MEMBERSHIP_ID, action: "activate" },
        }),
      );
    });

    it("removeTeacher invoca remove", async () => {
      mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
      const { removeTeacher } = await import("./teachers");
      const result = await removeTeacher(MEMBERSHIP_ID);
      expect(result).toEqual({ ok: true });
      expect(mocks.invoke).toHaveBeenCalledWith(
        "manage-teacher",
        expect.objectContaining({
          body: { membershipId: MEMBERSHIP_ID, action: "remove" },
        }),
      );
    });

    it("propaga mensaje+detalle si manage-teacher falla", async () => {
      mocks.invoke.mockResolvedValue({
        data: {
          ok: false,
          message: "No se encontró al docente en el colegio.",
          detail: "permission denied for table school_memberships",
        },
        error: null,
      });
      const { setTeacherActive } = await import("./teachers");
      const result = await setTeacherActive(MEMBERSHIP_ID, true);
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/No se encontró/);
      expect(result.message).toMatch(/permission denied/);
      expect(result.message).toMatch(/activate/);
    });
  });

  // —— 6. Recuentos ——
  describe("7. Recuentos chips (pendientes / aceptadas / activos / desactivados)", () => {
    it("vacío tras alta de colegio (solo owner, sin invites)", async () => {
      const { staffChipCounts } = await import("./teachers");
      expect(staffChipCounts({ pending: [], accepted: [] })).toEqual({
        pending: 0,
        accepted: 0,
        active: 0,
        inactive: 0,
      });
    });

    it("tras invitar: +1 pendiente", async () => {
      const { staffChipCounts } = await import("./teachers");
      const pending = [pendingRow({ id: "inv-1" })];
      expect(staffChipCounts({ pending, accepted: [] })).toEqual({
        pending: 1,
        accepted: 0,
        active: 0,
        inactive: 0,
      });
    });

    it("tras aceptar invite: pendiente baja, aceptada+activa suben", async () => {
      const { staffChipCounts, listSchoolStaff } = await import("./teachers");
      mocks.rpc.mockResolvedValue({
        data: {
          pending: [],
          accepted: [
            {
              membership_id: MEMBERSHIP_ID,
              user_id: TEACHER_USER_ID,
              email: "docente@colegio.edu",
              first_name: "Luis",
              last_name_1: "García",
              last_name_2: "",
              is_active: true,
              accepted_at: "2026-10-18T12:00:00Z",
              sent_at: "2026-10-18T10:00:00Z",
            },
          ],
        },
        error: null,
      });

      const lists = await listSchoolStaff(SCHOOL_ID);
      expect(lists.ok).toBe(true);
      expect(staffChipCounts(lists)).toEqual({
        pending: 0,
        accepted: 1,
        active: 1,
        inactive: 0,
      });
    });

    it("tras desactivar: aceptadas igual, activos 0, desactivados 1", async () => {
      const { staffChipCounts } = await import("./teachers");
      const accepted = [
        acceptedRow({ membership_id: MEMBERSHIP_ID, is_active: false }),
        acceptedRow({ membership_id: "m-2", user_id: "u-2", is_active: true, email: "b@c.edu" }),
      ];
      expect(staffChipCounts({ pending: [], accepted })).toEqual({
        pending: 0,
        accepted: 2,
        active: 1,
        inactive: 1,
      });
    });

    it("tras eliminar: aceptadas baja (ya no está en el listado)", async () => {
      const { staffChipCounts } = await import("./teachers");
      const before = staffChipCounts({
        pending: [],
        accepted: [acceptedRow({ membership_id: MEMBERSHIP_ID, is_active: true })],
      });
      expect(before.accepted).toBe(1);

      const afterRemove = staffChipCounts({ pending: [], accepted: [] });
      expect(afterRemove).toEqual({
        pending: 0,
        accepted: 0,
        active: 0,
        inactive: 0,
      });
    });

    it("is_active null en RPC se trata como activo en listSchoolStaff", async () => {
      const { listSchoolStaff, staffChipCounts } = await import("./teachers");
      mocks.rpc.mockResolvedValue({
        data: {
          pending: [],
          accepted: [
            {
              membership_id: MEMBERSHIP_ID,
              user_id: TEACHER_USER_ID,
              email: "docente@colegio.edu",
              is_active: null,
            },
          ],
        },
        error: null,
      });
      const lists = await listSchoolStaff(SCHOOL_ID);
      expect(lists.ok).toBe(true);
      expect(lists.accepted[0]?.is_active).toBe(true);
      expect(staffChipCounts(lists).active).toBe(1);
    });

    it("mezcla pending + accepted refleja todos los chips", async () => {
      const { staffChipCounts } = await import("./teachers");
      expect(
        staffChipCounts({
          pending: [pendingRow({ id: "p1" }), pendingRow({ id: "p2", email: "x@y.edu" })],
          accepted: [
            acceptedRow({ membership_id: "a1", is_active: true }),
            acceptedRow({ membership_id: "a2", is_active: false, email: "off@y.edu" }),
            acceptedRow({ membership_id: "a3", is_active: true, email: "on@y.edu" }),
          ],
        }),
      ).toEqual({
        pending: 2,
        accepted: 3,
        active: 2,
        inactive: 1,
      });
    });
  });
});

describe("inviteUrl flash (login tras registro docente)", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("peek no consume; clear sí", async () => {
    const { setInviteSuccessFlash, peekInviteSuccessFlash, clearInviteSuccessFlash } =
      await import("../../features/auth/inviteUrl");

    expect(peekInviteSuccessFlash()).toBe(false);
    setInviteSuccessFlash();
    expect(peekInviteSuccessFlash()).toBe(true);
    expect(peekInviteSuccessFlash()).toBe(true);
    clearInviteSuccessFlash();
    expect(peekInviteSuccessFlash()).toBe(false);
  });
});
