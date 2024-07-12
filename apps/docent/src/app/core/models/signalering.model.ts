export function getSignaleringId(periodeStart: Date, periodeEind: Date, leerlingId: string, veldId: string): string {
    periodeStart = new Date(periodeStart);
    periodeEind = new Date(periodeEind);
    return `${String(periodeStart.getTime())}:${String(periodeEind.getTime())}:${leerlingId}:${veldId}`;
}
