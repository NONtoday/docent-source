
      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "Boodschap": [
      "InboxBericht",
      "InleveringBericht"
    ],
    "IToetskolom": [
      "Deeltoetskolom",
      "RapportToetskolom",
      "SamengesteldeToetskolom",
      "Toetskolom"
    ],
    "Inleveraar": [
      "Leerling",
      "Projectgroep"
    ],
    "InleveropdrachtToekenning": [
      "AfspraakToekenning",
      "DagToekenning"
    ],
    "LeerlingoverzichtVakSamenvatting": [
      "LeerlingoverzichtExamenVakSamenvattingResponse",
      "LeerlingoverzichtVakSamenvattingResponse"
    ],
    "MentordashboardOverzichtRegistratieCategorie": [
      "MentordashboardOverzichtRegistratieKolomCategorie",
      "MentordashboardOverzichtRegistratieVrijVeldCategorie"
    ],
    "NotitieboekMenuItem": [
      "NotitieboekMenuLeerlingItem",
      "NotitieboekMenuLesgroepItem",
      "NotitieboekMenuStamgroepItem"
    ],
    "Persoon": [
      "Leerling",
      "Medewerker"
    ],
    "Publicatie": [
      "Methode",
      "MethodeHoofdstuk",
      "MethodeInhoud",
      "MethodeSubHoofdstuk"
    ],
    "Resultaatkolom": [
      "Advieskolom",
      "Deeltoetskolom",
      "PeriodeGemiddeldekolom",
      "RapportCijferkolom",
      "RapportGemiddeldekolom",
      "RapportToetskolom",
      "SamengesteldeToetskolom",
      "Toetskolom"
    ],
    "Toekenning": [
      "AfspraakToekenning",
      "DagToekenning",
      "WeekToekenning"
    ]
  }
};
      export default result;
    