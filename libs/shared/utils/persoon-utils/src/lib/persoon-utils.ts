export function getVolledigeNaam(persoon: {
    voornaam?: string | undefined | null;
    tussenvoegsels?: string | undefined | null;
    achternaam?: string | undefined | null;
}) {
    const volledigeNaam = [persoon.voornaam, persoon.tussenvoegsels, persoon.achternaam].filter(Boolean).join(' ');
    return volledigeNaam.length > 0 ? volledigeNaam : 'Onbekend';
}

export function sortLeerlingByAchternaamVoornaam(a: { voornaam: string; achternaam: string }, b: { voornaam: string; achternaam: string }) {
    const achternaamA = a.achternaam;
    const achternaamB = b.achternaam;
    const voornaamA = a.voornaam;
    const voornaamB = b.voornaam;
    if (achternaamA < achternaamB) {
        return -1;
    }
    if (achternaamA > achternaamB) {
        return 1;
    }
    if (voornaamA < voornaamB) {
        return -1;
    }
    if (voornaamA > voornaamB) {
        return 1;
    }
    return 0;
}
