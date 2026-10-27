/** A configuration as `GET /tables/config` serves it (ISO dates, issuer, audit numbers). */
export const API_CONFIG = {
  spaces: [
    { id: "salon", name: "Salón", icon: "store", tone: "brand" },
    { id: "terraza", name: "Terraza", icon: "sun", tone: "warning" },
  ],
  tables: [
    {
      id: "tbl_07",
      number: 7,
      label: "Mesa 07",
      spaceId: "salon",
      capacity: 4,
      description: "Ventana",
      enabled: true,
      version: 18,
      layout: { x: 222, y: 64, width: 150, height: 132, shape: "rect" },
      qr: { token: "4pX9kR2mL7", issuedAt: "2026-10-21T12:00:00.000Z", issuedBy: { id: "staff-1", name: "Sofía M." } },
      revokedQrs: [
        {
          token: "Old07abcde",
          issuedAt: "2026-09-02T12:00:00.000Z",
          issuedBy: { id: "staff-1", name: "Sofía M." },
          revokedAt: "2026-10-21T12:00:00.000Z",
          auditNumber: 118,
        },
      ],
    },
    {
      id: "tbl_08",
      number: 8,
      label: "Mesa 08",
      spaceId: "terraza",
      capacity: 2,
      description: "",
      enabled: false,
      version: 1,
      layout: { x: 38, y: 64, width: 150, height: 132, shape: "round" },
      qr: null,
      revokedQrs: [],
    },
  ],
};
