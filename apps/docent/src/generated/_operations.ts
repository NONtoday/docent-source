import gql from 'graphql-tag';
export const baseHerhalendeAfspraak = gql`
    fragment BaseHerhalendeAfspraak on HerhalendeAfspraak {
  id
  beginDatum
  eindDatum
  maxHerhalingen
  type
  afspraakHerhalingDagen
  skip
  cyclus
}
    `;
export const vakFields = gql`
    fragment VakFields on Vak {
  id
  naam
  afkorting
}
    `;
export const baseAfspraak = gql`
    fragment BaseAfspraak on Afspraak {
  id
  titel
  begin
  eind
  jaar
  week
  locatie
  lesuur
  eindLesuur
  omschrijving
  isRoosterAfspraak
  isRoosterToets
  isBlokuur
  presentieRegistratieVerplicht
  presentieRegistratieVerwerkt
  aantalToekomstigeHerhalingen
  vestigingId
  herhalendeAfspraak {
    ...BaseHerhalendeAfspraak
  }
  vak {
    ...VakFields
  }
}
    ${baseHerhalendeAfspraak}
${vakFields}`;
export const baseAfspraakKwt = gql`
    fragment BaseAfspraakKwt on Afspraak {
  ...BaseAfspraak
  isKwt
}
    ${baseAfspraak}`;
export const registratieVerwerkt = gql`
    fragment registratieVerwerkt on Afspraak {
  presentieRegistratieVerwerkt
}
    `;
export const lesgroepFields = gql`
    fragment LesgroepFields on Lesgroep {
  id
  UUID
  naam
  vak {
    ...VakFields
  }
  examendossierOndersteund
  heeftStamgroep
  color @client
  vestigingId
}
    ${vakFields}`;
export const afspraakLesgroepenFields = gql`
    fragment AfspraakLesgroepenFields on Afspraak {
  lesgroepen {
    ...LesgroepFields
  }
  isNu @client
}
    ${lesgroepFields}`;
export const eigenAfspraakFields = gql`
    fragment EigenAfspraakFields on Afspraak {
  participantenEigenAfspraak {
    id
    stamgroep {
      id
      naam
    }
    lesgroep {
      id
      naam
    }
    medewerker {
      id
      voornaam
      tussenvoegsels
      achternaam
      initialen
    }
    leerling {
      id
      voornaam
      tussenvoegsels
      achternaam
      initialen
    }
  }
  auteurEigenAfspraak {
    id
    voornaam
    tussenvoegsels
    achternaam
    initialen
  }
}
    `;
export const afspraakFields = gql`
    fragment AfspraakFields on Afspraak {
  ...BaseAfspraak
  isKwt
  heeftLesgroepen
  isNu @client
  bijlagen {
    id
    uploadContextId
    type
    titel
    url
    contentType
    extensie
    zichtbaarVoorLeerling
    sortering
    methodeId
  }
}
    ${baseAfspraak}`;
export const roosterAfspraakFields = gql`
    fragment RoosterAfspraakFields on Afspraak {
  ...AfspraakFields
  toets
  huiswerk
  groteToets
  lesstof
  heeftZwevendeLesitems
  vestigingId
  lesgroepen {
    ...LesgroepFields
  }
}
    ${afspraakFields}
${lesgroepFields}`;
export const partialLeerling = gql`
    fragment partialLeerling on Leerling {
  id
  uuid
  voornaam
  tussenvoegsels
  achternaam
  initialen
  pasfoto
  leerlingnummer
}
    `;
export const leerlingMetIsJarig = gql`
    fragment leerlingMetIsJarig on Leerling {
  ...partialLeerling
  isJarig
}
    ${partialLeerling}`;
export const differentiatiegroepFields = gql`
    fragment differentiatiegroepFields on Differentiatiegroep {
  id
  naam
  kleur
  leerlingen {
    differentiatiegroepen {
      id
      naam
      kleur
    }
    ...leerlingMetIsJarig
  }
}
    ${leerlingMetIsJarig}`;
export const bijlageFields = gql`
    fragment bijlageFields on Bijlage {
  id
  uploadContextId
  type
  titel
  url
  contentType
  zichtbaarVoorLeerling
  sortering
  extensie
  synchroniseertMet
  isSelected @client
  methodeId
  differentiatiegroepen {
    ...differentiatiegroepFields
  }
  differentiatieleerlingen {
    ...leerlingMetIsJarig
  }
}
    ${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const bijlageMapFields = gql`
    fragment bijlageMapFields on BijlageMap {
  id
  naam
  sortering
  zichtbaarVoorLeerling
  synchroniseertMet
  synchroniseertMetId
  isSelected @client
  isNew @client
  bijlagen {
    ...bijlageFields
  }
  differentiatiegroepen {
    ...differentiatiegroepFields
  }
  differentiatieleerlingen {
    ...leerlingMetIsJarig
  }
}
    ${bijlageFields}
${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const inleveringFields = gql`
    fragment inleveringFields on Inlevering {
  id
  inleverdatum
  wijzigingsDatum
  onderwerp
  mimeType
  inhoud
  extensie
  status
  plagiaatInfo {
    inleveringId
    type
    ephorusDocumentGUID
    submissionId
    percentage
    inVerwerking
    error
  }
  plagiaatControleerbaar
}
    `;
export const inleveringBerichtFields = gql`
    fragment inleveringBerichtFields on InleveringBericht {
  id
  verzendDatum
  onderwerp
  inhoud
  verzender {
    voornaam
    tussenvoegsels
    achternaam
    initialen
    pasfoto
  }
  bijlagen {
    id
    contentType
    titel
    url
    extensie
  }
}
    `;
export const projectgroepFields = gql`
    fragment projectgroepFields on Projectgroep {
  id
  naam
  leerlingen {
    ...partialLeerling
  }
  heeftInlevering
  hoogstePlagiaat
}
    ${partialLeerling}`;
export const inleveraarFields = gql`
    fragment inleveraarFields on Inleveraar {
  ... on Projectgroep {
    ...projectgroepFields
    hoogstePlagiaat
  }
  ... on Leerling {
    ...partialLeerling
    hoogstePlagiaat
  }
}
    ${projectgroepFields}
${partialLeerling}`;
export const bijlageIsSelected = gql`
    fragment bijlageIsSelected on Bijlage {
  __typename
  isSelected
}
    `;
export const bijlageMapIsSelected = gql`
    fragment bijlageMapIsSelected on BijlageMap {
  __typename
  isSelected
}
    `;
export const bijlageMapBijlagen = gql`
    fragment bijlageMapBijlagen on BijlageMap {
  bijlagen {
    ...bijlageFields
  }
}
    ${bijlageFields}`;
export const verjaardagLeerling = gql`
    fragment verjaardagLeerling on Leerling {
  ...partialLeerling
  geboortedatum
  isJarig
  stamgroep
}
    ${partialLeerling}`;
export const leerlingoverzichtInstellingenFields = gql`
    fragment leerlingoverzichtInstellingenFields on LeerlingoverzichtInstellingen {
  weergaves
  tijdspan
}
    `;
export const vrijveldFields = gql`
    fragment vrijveldFields on VrijVeld {
  id
  naam
}
    `;
export const keuzelijstVrijVeldWaardeFields = gql`
    fragment keuzelijstVrijVeldWaardeFields on KeuzelijstWaardeMogelijkheid {
  id
  waarde
}
    `;
export const mentordashboardOverzichtRegistratieCategorieFields = gql`
    fragment mentordashboardOverzichtRegistratieCategorieFields on MentordashboardOverzichtRegistratieCategorie {
  ... on MentordashboardOverzichtRegistratieKolomCategorie {
    __typename
    id
    kolom
  }
  ... on MentordashboardOverzichtRegistratieVrijVeldCategorie {
    __typename
    id
    vrijVeld {
      ...vrijveldFields
    }
    keuzelijstWaarde {
      ...keuzelijstVrijVeldWaardeFields
    }
  }
}
    ${vrijveldFields}
${keuzelijstVrijVeldWaardeFields}`;
export const registratieFields = gql`
    fragment registratieFields on Registratie {
  beginDatumTijd
  eindDatumTijd
  beginLesuur
  eindLesuur
  les
  kwt
  roosterToets
  minutenGemist
  toetsmoment
  absentieReden
  opmerkingen
  vakOfTitel
}
    `;
export const periodeVakRegistratieDetailsFields = gql`
    fragment periodeVakRegistratieDetailsFields on PeriodeVakRegistratieDetails {
  vakOfTitel
  registraties {
    ...registratieFields
  }
  aantalLesmomenten
}
    ${registratieFields}`;
export const periodeRegistratieDetailsFields = gql`
    fragment periodeRegistratieDetailsFields on PeriodeRegistratieDetails {
  aantalRegistraties
  aantalLesRegistraties
  totaalMinuten
  aantalLessen
  vakRegistraties {
    ...periodeVakRegistratieDetailsFields
  }
}
    ${periodeVakRegistratieDetailsFields}`;
export const leerlingoverzichtRegistratieFields = gql`
    fragment leerlingoverzichtRegistratieFields on LeerlingoverzichtRegistratie {
  categorie {
    ...mentordashboardOverzichtRegistratieCategorieFields
  }
  details {
    ...periodeRegistratieDetailsFields
  }
  trend
}
    ${mentordashboardOverzichtRegistratieCategorieFields}
${periodeRegistratieDetailsFields}`;
export const vakRapportCijferFields = gql`
    fragment vakRapportCijferFields on VakRapportCijfer {
  vak {
    ...VakFields
  }
  isAlternatieveNormering
  rapportCijfer
  docenten
}
    ${vakFields}`;
export const periodeRapportCijfersFields = gql`
    fragment periodeRapportCijfersFields on PeriodeRapportCijfers {
  cijferperiode
  periodeTotaalGemiddelde
  vakRapportCijfers {
    ...vakRapportCijferFields
  }
}
    ${vakRapportCijferFields}`;
export const vakToetsTrendFields = gql`
    fragment vakToetsTrendFields on VakToetsTrend {
  vak {
    ...VakFields
  }
  isAlternatieveNormering
  trendindicatie
  aantalResultatenVoorTrendindicatie
}
    ${vakFields}`;
export const geldendVoortgangsdossierResultaatFields = gql`
    fragment geldendVoortgangsdossierResultaatFields on GeldendVoortgangsdossierResultaat {
  id
  cijfer
  label
  labelAfkorting
  isVoldoende
  periode
  formattedResultaat
  formattedEerstePoging
  formattedHerkansing1
  formattedHerkansing2
  volgnummer
  type
  toetscode
  omschrijving
  opmerkingen
  opmerkingenEerstePoging
  opmerkingenHerkansing1
  opmerkingenHerkansing2
  cijferAlternatief
  labelAlternatief
  labelAfkortingAlternatief
  isVoldoendeAlternatief
  formattedResultaatAlternatief
  formattedEerstePogingAlternatief
  formattedHerkansing1Alternatief
  formattedHerkansing2Alternatief
  bijzonderheid
  weging
  toetssoort
  herkansingsnummer
  herkansingsnummerAlternatief
}
    `;
export const vakDetailToetsresultaatFields = gql`
    fragment vakDetailToetsresultaatFields on VakDetailToetsresultaat {
  isAlternatieveNormering
  toetscodeSamengesteldeToets
  omschrijvingSamengesteldeToets
  geplandeDatumToets
  laatstGewijzigdDatum
  resultaat {
    ...geldendVoortgangsdossierResultaatFields
  }
}
    ${geldendVoortgangsdossierResultaatFields}`;
export const leerlingoverzichtVakDetailRegistratieFields = gql`
    fragment leerlingoverzichtVakDetailRegistratieFields on LeerlingoverzichtVakDetailRegistratie {
  categorie {
    ...mentordashboardOverzichtRegistratieCategorieFields
  }
  trend
  totaalMinuten
  registraties {
    ...registratieFields
  }
}
    ${mentordashboardOverzichtRegistratieCategorieFields}
${registratieFields}`;
export const leerlingoverzichtVakDetailRegistratieWrapperFields = gql`
    fragment leerlingoverzichtVakDetailRegistratieWrapperFields on LeerlingoverzichtVakDetailRegistratieWrapper {
  aantalLesmomenten
  voorHeleSchooljaar
  vakDetailRegistraties {
    ...leerlingoverzichtVakDetailRegistratieFields
  }
}
    ${leerlingoverzichtVakDetailRegistratieFields}`;
export const medewerkerFields = gql`
    fragment medewerkerFields on Medewerker {
  id
  uuid
  nummer
  voornaam
  tussenvoegsels
  achternaam
  initialen
  email
  pasfoto
}
    `;
export const rapportvergaderingNotitieFields = gql`
    fragment rapportvergaderingNotitieFields on RapportvergaderingNotitie {
  medewerker {
    ...medewerkerFields
  }
  opmerking
}
    ${medewerkerFields}`;
export const vakgemiddeldeFields = gql`
    fragment vakgemiddeldeFields on Vakgemiddelde {
  vak {
    ...VakFields
  }
  gemiddelde
  isAlternatieveNormering
}
    ${vakFields}`;
export const conceptInleveropdrachtFields = gql`
    fragment conceptInleveropdrachtFields on ConceptInleveropdracht {
  id
  startDag
  eindDag
  startUur
  startMinuut
  eindUur
  eindMinuut
  herinnering
  plagiaatDetectie
  stuurBerichtBijInlevering
  startSortering
  eindSortering
}
    `;
export const itemFields = gql`
    fragment itemFields on Studiewijzeritem {
  id
  huiswerkType
  zichtbaarVoorLeerling
  leerdoelen
  omschrijving
  onderwerp
  tijdsindicatie
  notitie
  notitieZichtbaarVoorLeerling
  bijlagen {
    id
    uploadContextId
    type
    titel
    url
    contentType
    extensie
    zichtbaarVoorLeerling
    sortering
    methodeId
  }
  inleverperiode {
    id
    omschrijving
    begin
    eind
    plagiaatDetectie
    stuurBerichtBijInlevering
    inleveringenAantal
    inleveringenVerwacht
    herinnering
    startSortering
    eindSortering
  }
  conceptInleveropdracht {
    ...conceptInleveropdrachtFields
  }
  projectgroepen {
    ...projectgroepFields
  }
  isNieuw @client
  icon @client
}
    ${conceptInleveropdrachtFields}
${projectgroepFields}`;
export const toekenningFields = gql`
    fragment toekenningFields on Toekenning {
  __typename
  id
  isStartInleverperiode
  sortering
  synchroniseertMet
  studiewijzeritem {
    ...itemFields
  }
  ... on AfspraakToekenning {
    aangemaaktOpDatumTijd
    afgerondOpDatumTijd
  }
  ... on DagToekenning {
    datum
  }
  ... on WeekToekenning {
    startWeek
    eindWeek
  }
  lesgroep {
    ...LesgroepFields
  }
  differentiatiegroepen {
    ...differentiatiegroepFields
  }
  differentiatieleerlingen {
    ...leerlingMetIsJarig
  }
}
    ${itemFields}
${lesgroepFields}
${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const lesplanningFields = gql`
    fragment lesplanningFields on Lesplanning {
  items {
    ...toekenningFields
  }
  toekomendeItems {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const maatregelFields = gql`
    fragment maatregelFields on Maatregel {
  id
  omschrijving
}
    `;
export const maatregelToekenning = gql`
    fragment maatregelToekenning on MaatregelToekenning {
  id
  maatregelDatum
  opmerkingen
  nagekomen
  automatischToegekend
  heeftFormulier
  veroorzaaktDoor
  maatregel {
    ...maatregelFields
  }
  leerlingId
}
    ${maatregelFields}`;
export const afspraakMedewerker = gql`
    fragment afspraakMedewerker on Medewerker {
  id
  voornaam
  tussenvoegsels
  achternaam
  initialen
  pasfoto
}
    `;
export const sorteringFields = gql`
    fragment sorteringFields on Sortering {
  naam
  veld
  order
}
    `;
export const organisatieFields = gql`
    fragment organisatieFields on Organisatie {
  UUID
  naam
}
    `;
export const signaleringenFiltersFields = gql`
    fragment signaleringenFiltersFields on SignaleringenFilters {
  filters {
    kolom
    value
  }
  leerlingFilters {
    leerlingId
    filters {
      kolom
      value
    }
  }
}
    `;
export const adresFields = gql`
    fragment adresFields on Adres {
  straat
  huisnummer
  plaatsnaam
  postcode
  telefoonnummer
  isBuitenlandsAdres
  land
  buitenland1
  buitenland2
  buitenland3
}
    `;
export const verzorgerFields = gql`
    fragment verzorgerFields on Verzorger {
  id
  voorletters
  voorvoegsel
  achternaam
  mobielNummer
  mobielWerkNummer
  email
  geslacht
  initialen
  adres {
    ...adresFields
  }
}
    ${adresFields}`;
export const relatieSoortFields = gql`
    fragment relatieSoortFields on RelatieSoort {
  naam
  mannelijkeNaam
  vrouwelijkeNaam
}
    `;
export const relatieFields = gql`
    fragment relatieFields on Relatie {
  verzorger {
    ...verzorgerFields
  }
  relatieSoort {
    ...relatieSoortFields
  }
}
    ${verzorgerFields}
${relatieSoortFields}`;
export const baseMedischHulpmiddel = gql`
    fragment baseMedischHulpmiddel on MedischHulpmiddel {
  id
  naam
  extraInformatie
}
    `;
export const baseSchoolInterventie = gql`
    fragment baseSchoolInterventie on SchoolInterventie {
  id
  naam
  begindatum
  einddatum
  landelijkeInterventie
  opmerking
  evaluatie
}
    `;
export const baseBeperking = gql`
    fragment baseBeperking on Beperking {
  id
  naam
  medicijnGebruik
  diagnose
  belemmerendeFactoren
  compenserendeFactoren
}
    `;
export const vrijveldRegistratiesFields = gql`
    fragment vrijveldRegistratiesFields on VrijVeldRegistraties {
  vrijVeld {
    ...vrijveldFields
  }
  aantal
  keuzelijstWaarde {
    ...keuzelijstVrijVeldWaardeFields
  }
}
    ${vrijveldFields}
${keuzelijstVrijVeldWaardeFields}`;
export const baseTotaalRegistraties = gql`
    fragment baseTotaalRegistraties on TotaalRegistraties {
  aantalLessen
  aantalRegistraties
  kolom
  totaalMinuten
  vrijVeld {
    ...vrijveldFields
  }
  keuzelijstWaarde {
    ...keuzelijstVrijVeldWaardeFields
  }
}
    ${vrijveldFields}
${keuzelijstVrijVeldWaardeFields}`;
export const totaaloverzichtRegistratiesFields = gql`
    fragment totaaloverzichtRegistratiesFields on TotaaloverzichtRegistraties {
  aantalLessen
  totaalRegistraties {
    ...baseTotaalRegistraties
  }
}
    ${baseTotaalRegistraties}`;
export const registratieDetailFields = gql`
    fragment registratieDetailFields on RegistratieDetail {
  aantal
  aantalLessen
  aantalToetsmomenten
  totaalMinuten
  rapportCijfer
  aantalZiek
  registraties {
    ...registratieFields
  }
}
    ${registratieFields}`;
export const totaalRegistratieMaandDetailsFields = gql`
    fragment totaalRegistratieMaandDetailsFields on TotaalRegistratieMaandDetails {
  maand
  jaar
  aantalRegistraties
  aantalToetsmomenten
  totaalMinuten
  registraties {
    ...registratieFields
  }
}
    ${registratieFields}`;
export const registratiesCijferperiodeFields = gql`
    fragment registratiesCijferperiodeFields on RegistratiesCijferperiode {
  isHuidig
  naam
}
    `;
export const groepsoverzichtRegistratiesWrapperFields = gql`
    fragment groepsoverzichtRegistratiesWrapperFields on GroepsoverzichtRegistratiesWrapper {
  cijferperiode {
    ...registratiesCijferperiodeFields
  }
  registraties {
    categorie {
      ...mentordashboardOverzichtRegistratieCategorieFields
    }
    leerlingRegistratieTellingen {
      leerling {
        ...partialLeerling
      }
      aantalRegistraties
      trend
    }
  }
  vanafDatum
  totDatum
}
    ${registratiesCijferperiodeFields}
${mentordashboardOverzichtRegistratieCategorieFields}
${partialLeerling}`;
export const mentordashboardOverzichtPeriodeOptieFields = gql`
    fragment mentordashboardOverzichtPeriodeOptieFields on MentordashboardOverzichtPeriodeOptie {
  periode
  naam
  vanafDatum
  totDatum
  isHuidig
}
    `;
export const mentordashboardOverzichtPeriodeOptiesFields = gql`
    fragment mentordashboardOverzichtPeriodeOptiesFields on MentordashboardOverzichtPeriodeOpties {
  zevenDagenOpties {
    ...mentordashboardOverzichtPeriodeOptieFields
  }
  dertigDagenOpties {
    ...mentordashboardOverzichtPeriodeOptieFields
  }
  cijferPeriodeOpties {
    ...mentordashboardOverzichtPeriodeOptieFields
  }
  schooljaarOptie {
    ...mentordashboardOverzichtPeriodeOptieFields
  }
}
    ${mentordashboardOverzichtPeriodeOptieFields}`;
export const geldendAdviesResultaatFields = gql`
    fragment geldendAdviesResultaatFields on GeldendAdviesResultaat {
  adviesCategorieNaam
  adviesCategorieAfkorting
  adviesKolomNaam
  adviesKolomAfkorting
  geldendResultaat {
    ...geldendVoortgangsdossierResultaatFields
  }
}
    ${geldendVoortgangsdossierResultaatFields}`;
export const groepsoverzichtVakRapportResultaatTrendFields = gql`
    fragment groepsoverzichtVakRapportResultaatTrendFields on GroepsoverzichtVakRapportResultaatTrend {
  vak {
    ...VakFields
  }
  isAlternatieveNormering
  rapportCijferkolom {
    ...geldendVoortgangsdossierResultaatFields
  }
  trendindicatie
  advieskolommen {
    ...geldendAdviesResultaatFields
  }
  aantalResultatenVoorTrendindicatie
}
    ${vakFields}
${geldendVoortgangsdossierResultaatFields}
${geldendAdviesResultaatFields}`;
export const groepsoverzichtRegistratiesInstellingenFields = gql`
    fragment groepsoverzichtRegistratiesInstellingenFields on GroepsoverzichtRegistratiesInstellingen {
  weergaves {
    categorie
    grenswaarde
  }
  tijdspan
}
    `;
export const groepsoverzichtResultatenSorteringenFields = gql`
    fragment groepsoverzichtResultatenSorteringenFields on GroepsoverzichtResultatenSorteringen {
  groepsoverzicht {
    aandacht
    extraAandacht
    opNiveau
  }
  resultatenSidebar {
    rWaarde
    actieveKolom
    trendWaarde
  }
  examenSidebar {
    CE
    EIND
    SE
    trendWaarde
    actieveKolom
  }
}
    `;
export const groepsoverzichtResultatenInstellingenFields = gql`
    fragment groepsoverzichtResultatenInstellingenFields on MentordashboardResultatenInstellingen {
  aantalVakkenOnvoldoende
  aantalVakkenZwaarOnvoldoende
  grenswaardeOnvoldoende
  grenswaardeZwaarOnvoldoende
  sorteringen {
    ...groepsoverzichtResultatenSorteringenFields
  }
}
    ${groepsoverzichtResultatenSorteringenFields}`;
export const leerlingRapportCijferOverzichtFields = gql`
    fragment leerlingRapportCijferOverzichtFields on LeerlingRapportCijferOverzicht {
  leerling {
    ...partialLeerling
  }
  rapportCijfers
  totaalgemiddelde
  trendindicatie
  aantalResultatenVoorTrendindicatie
}
    ${partialLeerling}`;
export const leerlingExamenCijferOverzichtFields = gql`
    fragment leerlingExamenCijferOverzichtFields on LeerlingExamenCijferOverzicht {
  leerling {
    ...partialLeerling
  }
  seCijfers
  ceCijfers
  eindCijfers
  totaalgemiddeldeSe
  totaalgemiddeldeCe
  totaalgemiddeldeEind
  trendindicatie
  aantalResultatenVoorTrendindicatie
}
    ${partialLeerling}`;
export const geldendResultaatFields = gql`
    fragment geldendResultaatFields on GeldendResultaat {
  id
  cijfer
  label
  labelAfkorting
  isVoldoende
  periode
  formattedResultaat
  formattedEerstePoging
  formattedHerkansing1
  formattedHerkansing2
  volgnummer
  type
  toetscode
  omschrijving
  opmerkingen
  opmerkingenEerstePoging
  opmerkingenHerkansing1
  opmerkingenHerkansing2
  bijzonderheid
  weging
  toetssoort
  herkansingsnummer
}
    `;
export const gemistResultaatFields = gql`
    fragment GemistResultaatFields on GemistResultaat {
  vakNaam
  geplandeDatumToets
  laatstGewijzigdDatum
  toetscodeSamengesteldeToets
  omschrijvingSamengesteldeToets
  resultaat {
    ...geldendResultaatFields
  }
}
    ${geldendResultaatFields}`;
export const recentResultaatFields = gql`
    fragment RecentResultaatFields on RecentResultaat {
  vakNaam
  laatstGewijzigdDatum
  isAlternatieveNormering
  resultaat {
    ...geldendVoortgangsdossierResultaatFields
  }
}
    ${geldendVoortgangsdossierResultaatFields}`;
export const recenteResultatenMetTrendWrapperFields = gql`
    fragment RecenteResultatenMetTrendWrapperFields on RecenteResultatenMetTrendWrapper {
  recenteResultaten {
    ...RecentResultaatFields
  }
  trendindicatie
  aantalResultatenVoorTrendindicatie
}
    ${recentResultaatFields}`;
export const notitieLeerlingBetrokkeneFields = gql`
    fragment notitieLeerlingBetrokkeneFields on NotitieLeerlingBetrokkene {
  id
  leerling {
    ...partialLeerling
  }
  geschrevenInMentorContext
}
    ${partialLeerling}`;
export const notitieBetrokkeneToegangFields = gql`
    fragment notitieBetrokkeneToegangFields on NotitieBetrokkeneToegang {
  betrokkeneId
  notitieboekToegankelijk
}
    `;
export const notitieboekMenuLeerlingItemFields = gql`
    fragment notitieboekMenuLeerlingItemFields on NotitieboekMenuLeerlingItem {
  __typename
  id
  leerling {
    ...partialLeerling
  }
  ongelezenNotitieAanwezig
  leerlingGroepNamen
  leerlingStamgroepNaam
}
    ${partialLeerling}`;
export const notitieboekMenuGroepFields = gql`
    fragment notitieboekMenuGroepFields on NotitieboekMenuGroep {
  id
  ongelezenGroepsnotitieAanwezig
  leerlingMenuItems {
    ...notitieboekMenuLeerlingItemFields
  }
}
    ${notitieboekMenuLeerlingItemFields}`;
export const notitieboekMenuLesgroepItemFields = gql`
    fragment notitieboekMenuLesgroepItemFields on NotitieboekMenuLesgroepItem {
  __typename
  id
  lesgroep {
    ...LesgroepFields
  }
  ongelezenNotitieAanwezig
}
    ${lesgroepFields}`;
export const stamgroepFields = gql`
    fragment stamgroepFields on Stamgroep {
  id
  naam
  vestigingId
  color @client
}
    `;
export const notitieboekMenuStamgroepItemFields = gql`
    fragment notitieboekMenuStamgroepItemFields on NotitieboekMenuStamgroepItem {
  __typename
  id
  stamgroep {
    ...stamgroepFields
  }
  ongelezenNotitieAanwezig
}
    ${stamgroepFields}`;
export const notitieboekMenuItemFields = gql`
    fragment notitieboekMenuItemFields on NotitieboekMenuItem {
  __typename
  ... on NotitieboekMenuLeerlingItem {
    ...notitieboekMenuLeerlingItemFields
  }
  ... on NotitieboekMenuLesgroepItem {
    ...notitieboekMenuLesgroepItemFields
  }
  ... on NotitieboekMenuStamgroepItem {
    ...notitieboekMenuStamgroepItemFields
  }
}
    ${notitieboekMenuLeerlingItemFields}
${notitieboekMenuLesgroepItemFields}
${notitieboekMenuStamgroepItemFields}`;
export const actueleNotitieItemFields = gql`
    fragment actueleNotitieItemFields on ActueleNotitieItem {
  leerling {
    ...partialLeerling
  }
  stamgroep {
    ...stamgroepFields
  }
  lesgroep {
    ...LesgroepFields
  }
  ongelezenNotitieAanwezig
  vastgeprikteNotitieAanwezig
}
    ${partialLeerling}
${stamgroepFields}
${lesgroepFields}`;
export const vestigingFields = gql`
    fragment vestigingFields on Vestiging {
  id
  uuid
  naam
  afkorting
}
    `;
export const notitieFields = gql`
    fragment notitieFields on Notitie {
  id
  auteur {
    ...medewerkerFields
  }
  auteurInactief
  createdAt
  lastModifiedAt
  titel
  inhoud
  gedeeldVoorMentoren
  gedeeldVoorDocenten
  belangrijk
  privacygevoelig
  initieelVastgeprikt
  reactiesToegestaan
  aantalReacties
  vastgeprikt
  bookmarked
  gelezenOp
  vak {
    ...VakFields
  }
  leerlingBetrokkenen {
    id
    leerling {
      ...partialLeerling
    }
    geschrevenInMentorContext
  }
  lesgroepBetrokkenen {
    id
    lesgroep {
      ...LesgroepFields
      vestiging {
        ...vestigingFields
      }
    }
    geschrevenInMentorContext
  }
  stamgroepBetrokkenen {
    id
    stamgroep {
      ...stamgroepFields
      vestiging {
        ...vestigingFields
      }
    }
    geschrevenInMentorContext
  }
  bijlagen {
    id
    uploadContextId
    titel
    url
    contentType
    extensie
    zichtbaarVoorLeerling
  }
}
    ${medewerkerFields}
${vakFields}
${partialLeerling}
${lesgroepFields}
${vestigingFields}
${stamgroepFields}`;
export const notitieStreamPeriodeFields = gql`
    fragment notitieStreamPeriodeFields on NotitieStreamPeriode {
  start
  eind
  notities {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const ingevoerdDoor = gql`
    fragment ingevoerdDoor on Medewerker {
  id
  voornaam
  tussenvoegsels
  achternaam
}
    `;
export const absentieRedenFields = gql`
    fragment absentieRedenFields on AbsentieReden {
  id
  absentieSoort
  afkorting
  omschrijving
  geoorloofd
}
    `;
export const absentieMeldingFields = gql`
    fragment absentieMeldingFields on AbsentieMelding {
  id
  opmerkingen
  tijdstip
  heeftEinde
  beginDatumTijd
  eindDatumTijd
  ingevoerdDoor {
    ...ingevoerdDoor
  }
  ingevoerdDoorVerzorger {
    ...verzorgerFields
  }
  absentieReden {
    ...absentieRedenFields
  }
}
    ${ingevoerdDoor}
${verzorgerFields}
${absentieRedenFields}`;
export const overigeVrijVeldWaardeFields = gql`
    fragment overigeVrijVeldWaardeFields on VrijVeldWaarde {
  id
  vrijveld {
    id
    naam
    vastgezet
    positie
  }
  booleanWaarde
  keuzelijstWaarde {
    id
    waarde
  }
}
    `;
export const lesRegistratieFields = gql`
    fragment lesRegistratieFields on LesRegistratie {
  id
  leerlingRegistraties {
    id
    dirty
    waarneming {
      id
      ingevoerdDoor {
        ...ingevoerdDoor
      }
    }
    leerling {
      id
      voornaam
    }
    aanwezig
    absent {
      ...absentieMeldingFields
    }
    teLaat {
      ...absentieMeldingFields
    }
    verwijderd {
      ...absentieMeldingFields
    }
    materiaalVergeten
    huiswerkNietInOrde
    overigeVrijVeldWaarden {
      ...overigeVrijVeldWaardeFields
    }
    absentieRedenenToegestaanVoorDocent {
      ...absentieRedenFields
    }
  }
}
    ${ingevoerdDoor}
${absentieMeldingFields}
${overigeVrijVeldWaardeFields}
${absentieRedenFields}`;
export const aanwezigheid = gql`
    fragment aanwezigheid on LeerlingRegistratie {
  __typename
  aanwezig
  dirty
  absent {
    ...absentieMeldingFields
  }
  teLaat {
    ...absentieMeldingFields
  }
  verwijderd {
    ...absentieMeldingFields
  }
  huiswerkNietInOrde
  materiaalVergeten
  overigeVrijVeldWaarden {
    ...overigeVrijVeldWaardeFields
  }
}
    ${absentieMeldingFields}
${overigeVrijVeldWaardeFields}`;
export const leerlingRegistratieFragment = gql`
    fragment leerlingRegistratieFragment on LeerlingRegistratie {
  dirty
}
    `;
export const lesRegistratieFragment = gql`
    fragment lesRegistratieFragment on LesRegistratie {
  laatstGewijzigdDatum
}
    `;
export const resultaatLabelFields = gql`
    fragment resultaatLabelFields on ResultaatLabel {
  id
  afkorting
  naam
  voldoende
  specialeWaarde
}
    `;
export const matrixResultaatkolomFields = gql`
    fragment matrixResultaatkolomFields on MatrixResultaatkolom {
  id
  resultaatkolom {
    __typename
    id
    type
    actief
    periode
    volgnummer
    code
    bevrorenStatus
    omschrijving
    ... on IToetskolom {
      toetscode
      weging
      examenWeging
      herkansing
      type
      datumToets
      toetsSoort {
        id
        naam
        defaultWeging
      }
      resultaatLabelLijst {
        id
        naam
        afkorting
        omschrijving
        resultaatLabels {
          ...resultaatLabelFields
        }
      }
      domeincode
      domeinomschrijving
      toetsduur
      toetsvorm
      afnamevorm
    }
    ... on Advieskolom {
      afkorting
      categorie
      adviesWeergave {
        id
        naam
        afkorting
        omschrijving
        resultaatLabels {
          ...resultaatLabelFields
        }
      }
    }
    ... on SamengesteldeToetskolom {
      leerlingMissendeToetsen {
        leerlingUuid
        periode
        toetsafkorting
      }
    }
    ... on Deeltoetskolom {
      samengesteldeToetskolom {
        id
      }
      deeltoetsWeging
    }
    ... on RapportCijferkolom {
      vastgezet
      resultaatLabelLijst {
        id
        naam
        afkorting
        omschrijving
        resultaatLabels {
          ...resultaatLabelFields
        }
      }
    }
    ... on RapportGemiddeldekolom {
      resultaatLabelLijst {
        id
        naam
        afkorting
        omschrijving
        resultaatLabels {
          ...resultaatLabelFields
        }
      }
    }
  }
  herkansingsNummer
  lesgroepSpecifiekeOmschrijving
  resultaten {
    cellId
    herkansingsNummer
    score
    formattedResultaat
    formattedResultaatAfwijkendNiveau
    resultaatLabel {
      ...resultaatLabelFields
    }
    resultaatLabelAfwijkendNiveau {
      ...resultaatLabelFields
    }
    voldoende
    voldoendeAfwijkendNiveau
    opmerkingen
    leerlingUUID
    teltNietMee
    toetsNietGemaakt
    vrijstelling
    rapportCijferEnOverschreven
    rapportCijferEnOverschrevenAfwijkendNiveau
    toonOpmerkingInELO
    lesgroepId
  }
  resultaatAnderVakKolom {
    anderVak {
      ...VakFields
    }
    weging
    examenWeging
  }
  klasgemiddelde
  klasgemiddeldeAlternatiefNiveau
  toegestaneKolomActies
  lesgroepId
}
    ${resultaatLabelFields}
${vakFields}`;
export const cijferPeriodeFields = gql`
    fragment cijferPeriodeFields on CijferPeriode {
  id
  nummer
  begin
  eind
  isHuidig
}
    `;
export const resultaatLabelLijstFields = gql`
    fragment resultaatLabelLijstFields on ResultaatLabelLijst {
  id
  naam
  afkorting
  omschrijving
  resultaatLabels {
    ...resultaatLabelFields
  }
}
    ${resultaatLabelFields}`;
export const voortgangsdossierFields = gql`
    fragment voortgangsdossierFields on Voortgangsdossier {
  id
  toetsdossier {
    id
    naam
    isDefaultDossier
  }
  onderwijssoortLeerjaar
  meervoudigeToetsnorm
  opmerkingen
  lesgroepToetsenToegestaan
  lesgroepDeeltoetsenToestaan
  toetsNormering1
  toetsNormering2
}
    `;
export const mentorDashboardExamenVakSamenvattendeResultatenFields = gql`
    fragment mentorDashboardExamenVakSamenvattendeResultatenFields on MentorDashboardExamenVakSamenvattendeResultaten {
  vak {
    ...VakFields
  }
  anderNiveau
  vrijstelling
  ontheffing
  seCijfer {
    ...geldendResultaatFields
  }
  ceCijfer {
    ...geldendResultaatFields
  }
  eindCijfer {
    ...geldendResultaatFields
  }
  ceType
  trendindicatieSE
  aantalResultatenVoorTrendindicatieSE
}
    ${vakFields}
${geldendResultaatFields}`;
export const mentorDashboardExamenDossierFields = gql`
    fragment mentorDashboardExamenDossierFields on MentorDashboardExamendossier {
  plaatsingId
  lichtingId
  heeftTrendindicatie
  examenVakSamenvattendeResultaten {
    ...mentorDashboardExamenVakSamenvattendeResultatenFields
  }
}
    ${mentorDashboardExamenVakSamenvattendeResultatenFields}`;
export const stamgroepNormeringFields = gql`
    fragment stamgroepNormeringFields on StamgroepNormering {
  voortgangsDossiersHeeftAlternatieveNormering
  stamgroep {
    id
    naam
  }
}
    `;
export const mentorDashboardExamenDossierContextenFields = gql`
    fragment mentorDashboardExamenDossierContextenFields on ExamendossierContext {
  plaatsingId
  lichtingId
  onderwijssoort
  examenjaar
}
    `;
export const mentorDashboardResultatenContextFields = gql`
    fragment mentorDashboardResultatenContextFields on MentorDashboardResultatenContext {
  stamgroepen {
    ...stamgroepNormeringFields
  }
  examendossierContexten {
    ...mentorDashboardExamenDossierContextenFields
  }
}
    ${stamgroepNormeringFields}
${mentorDashboardExamenDossierContextenFields}`;
export const periodeAdviesKolomContextFields = gql`
    fragment periodeAdviesKolomContextFields on PeriodeAdviesKolomContext {
  adviesCategorieNaam
  adviesCategorieAfkorting
  adviesKolomNaam
  adviesKolomAfkorting
}
    `;
export const periodeAdviesKolomFields = gql`
    fragment periodeAdviesKolomFields on PeriodeAdviesKolom {
  periode
  datumVan
  datumTot
  kolomContexten {
    ...periodeAdviesKolomContextFields
  }
}
    ${periodeAdviesKolomContextFields}`;
export const mentorDashboardVoortgangsDossierFields = gql`
    fragment mentorDashboardVoortgangsDossierFields on MentorDashboardVoortgangsDossier {
  stamgroepId
  relevanteCijferperiode
  vakPeriodes {
    vak {
      ...VakFields
    }
    heeftAlternatieveNormering
    trendindicatie
    trendindicatieAlternatieveNormering
    aantalResultatenVoorTrendindicatie
    aantalResultatenVoorTrendindicatieAlternatieveNormering
    periodes {
      volgnummer
      periodeGemiddeldeKolom {
        ...geldendVoortgangsdossierResultaatFields
      }
      rapportCijferkolom {
        ...geldendVoortgangsdossierResultaatFields
      }
      advieskolommen {
        ...geldendAdviesResultaatFields
      }
    }
  }
  adviesKolommenPerPeriode {
    ...periodeAdviesKolomFields
  }
}
    ${vakFields}
${geldendVoortgangsdossierResultaatFields}
${geldendAdviesResultaatFields}
${periodeAdviesKolomFields}`;
export const vakResultatenFields = gql`
    fragment vakResultatenFields on MentorDashboardVakPeriodeResultaten {
  volgnummer
  periodeGemiddeldeKolom {
    ...geldendVoortgangsdossierResultaatFields
  }
  advieskolommen {
    ...geldendAdviesResultaatFields
  }
  rapportCijferkolom {
    ...geldendVoortgangsdossierResultaatFields
  }
  toetskolommen {
    ...geldendVoortgangsdossierResultaatFields
  }
  rapportGemiddeldekolom {
    ...geldendVoortgangsdossierResultaatFields
  }
}
    ${geldendVoortgangsdossierResultaatFields}
${geldendAdviesResultaatFields}`;
export const leerlingSignaleringen = gql`
    fragment leerlingSignaleringen on LeerlingSignalering {
  id
  leerling {
    ...leerlingMetIsJarig
  }
  afspraken {
    id
    begin
    lesuur
    isRoosterToets
  }
  aantal
}
    ${leerlingMetIsJarig}`;
export const basisSjabloonFields = gql`
    fragment basisSjabloonFields on Sjabloon {
  id
  uuid
  naam
  vestigingId
  gedeeldMetVaksectie
  vaksectie {
    id
    uuid
    naam
  }
  eigenaar {
    id
    uuid
    initialen
    voornaam
    tussenvoegsels
    achternaam
    pasfoto
    school
    email
  }
  synchronisatieStartweek
  aantalBijlagen
  isNieuw @client
}
    `;
export const basisStudiewijzerFields = gql`
    fragment basisStudiewijzerFields on Studiewijzer {
  id
  uuid
  naam
  schooljaar
  lesgroep {
    ...LesgroepFields
    examendossierOndersteund
    heeftStamgroep
  }
  vestigingId
}
    ${lesgroepFields}`;
export const categorieFields = gql`
    fragment categorieFields on SjabloonCategorie {
  id
  vaksectieUuid
  naam
  sjablonen {
    ...basisSjabloonFields
    gesynchroniseerdeStudiewijzers {
      ...basisStudiewijzerFields
    }
  }
  inEditMode @client
}
    ${basisSjabloonFields}
${basisStudiewijzerFields}`;
export const sjabloonFields = gql`
    fragment sjabloonFields on Sjabloon {
  ...basisSjabloonFields
  gesynchroniseerdeStudiewijzers {
    ...basisStudiewijzerFields
  }
}
    ${basisSjabloonFields}
${basisStudiewijzerFields}`;
export const categorieMetBijlagenFields = gql`
    fragment categorieMetBijlagenFields on SjabloonCategorie {
  id
  vaksectieUuid
  naam
  sjablonen {
    ...sjabloonFields
    gesynchroniseerdeStudiewijzers {
      ...basisStudiewijzerFields
    }
  }
  inEditMode @client
}
    ${sjabloonFields}
${basisStudiewijzerFields}`;
export const sjabloonIsNieuw = gql`
    fragment sjabloonIsNieuw on Sjabloon {
  __typename
  isNieuw
}
    `;
export const categorieEditMode = gql`
    fragment categorieEditMode on SjabloonCategorie {
  __typename
  inEditMode
}
    `;
export const studiewijzerFields = gql`
    fragment studiewijzerFields on Studiewijzer {
  ...basisStudiewijzerFields
  aantalBijlagen
  gesynchroniseerdeSjablonen {
    ...sjabloonFields
  }
}
    ${basisStudiewijzerFields}
${sjabloonFields}`;
export const studiewijzercategorieEditMode = gql`
    fragment studiewijzercategorieEditMode on StudiewijzerCategorie {
  __typename
  inEditMode
}
    `;
export const studiewijzeritemIsNieuw = gql`
    fragment studiewijzeritemIsNieuw on Studiewijzeritem {
  __typename
  isNieuw
}
    `;
export const dagOfAfspraakToekenningFields = gql`
    fragment dagOfAfspraakToekenningFields on Toekenning {
  __typename
  id
  isStartInleverperiode
  sortering
  synchroniseertMet
  studiewijzeritem {
    ...itemFields
  }
  ... on AfspraakToekenning {
    aangemaaktOpDatumTijd
    afgerondOpDatumTijd
  }
  ... on DagToekenning {
    datum
  }
  lesgroep {
    ...LesgroepFields
  }
  differentiatiegroepen {
    ...differentiatiegroepFields
  }
  differentiatieleerlingen {
    ...leerlingMetIsJarig
  }
}
    ${itemFields}
${lesgroepFields}
${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const itemMutationFields = gql`
    fragment itemMutationFields on Studiewijzeritem {
  id
  huiswerkType
  zichtbaarVoorLeerling
  leerdoelen
  omschrijving
  onderwerp
  notitie
  tijdsindicatie
  notitieZichtbaarVoorLeerling
  bijlagen {
    id
    uploadContextId
    type
    titel
    url
    contentType
    extensie
    zichtbaarVoorLeerling
    sortering
    methodeId
  }
  inleverperiode {
    id
    omschrijving
    begin
    eind
    plagiaatDetectie
    stuurBerichtBijInlevering
    inleveringenAantal
    inleveringenVerwacht
    herinnering
    startSortering
    eindSortering
  }
  conceptInleveropdracht {
    ...conceptInleveropdrachtFields
  }
  projectgroepen {
    id
    naam
    leerlingen {
      ...partialLeerling
    }
    heeftInlevering
    hoogstePlagiaat
  }
  isNieuw @client
  icon @client
}
    ${conceptInleveropdrachtFields}
${partialLeerling}`;
export const toekenningMutationFields = gql`
    fragment toekenningMutationFields on Toekenning {
  __typename
  id
  sortering
  synchroniseertMet
  studiewijzeritem {
    ...itemMutationFields
  }
  ... on AfspraakToekenning {
    aangemaaktOpDatumTijd
    afgerondOpDatumTijd
  }
  ... on DagToekenning {
    datum
  }
  ... on WeekToekenning {
    startWeek
    eindWeek
  }
  lesgroep {
    ...LesgroepFields
  }
  differentiatiegroepen {
    ...differentiatiegroepFields
  }
  differentiatieleerlingen {
    ...leerlingMetIsJarig
  }
}
    ${itemMutationFields}
${lesgroepFields}
${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const createAfspraak = gql`
    mutation createAfspraak($afspraak: createAfspraakInput!) {
  createAfspraak(afspraak: $afspraak) {
    afspraak {
      ...RoosterAfspraakFields
      ...EigenAfspraakFields
      ...AfspraakLesgroepenFields
    }
  }
}
    ${roosterAfspraakFields}
${eigenAfspraakFields}
${afspraakLesgroepenFields}`;
export const updateAfspraak = gql`
    mutation updateAfspraak($afspraak: updateAfspraakInput!) {
  updateAfspraak(afspraak: $afspraak) {
    afspraak {
      ...RoosterAfspraakFields
      ...AfspraakLesgroepenFields
      ...EigenAfspraakFields
    }
  }
}
    ${roosterAfspraakFields}
${afspraakLesgroepenFields}
${eigenAfspraakFields}`;
export const deleteAfspraak = gql`
    mutation deleteAfspraak($afspraak: deleteAfspraakInput!) {
  deleteAfspraak(afspraak: $afspraak) {
    succes
  }
}
    `;
export const saveDifferentiatiegroep = gql`
    mutation saveDifferentiatiegroep($differentiatiegroep: DifferentiatiegroepInput!) {
  saveDifferentiatiegroep(differentiatiegroep: $differentiatiegroep) {
    ...differentiatiegroepFields
  }
}
    ${differentiatiegroepFields}`;
export const deleteDifferentiatiegroep = gql`
    mutation deleteDifferentiatiegroep($differentiatiegroep: ID!) {
  deleteDifferentiatiegroep(differentiatiegroep: $differentiatiegroep)
}
    `;
export const verplaatsLeerling = gql`
    mutation verplaatsLeerling($leerlingId: ID!, $vanDifferentiatiegroepId: ID!, $naarDifferentiatiegroepId: ID!) {
  verplaatsLeerling(
    leerlingId: $leerlingId
    vanDifferentiatiegroepId: $vanDifferentiatiegroepId
    naarDifferentiatiegroepId: $naarDifferentiatiegroepId
  )
}
    `;
export const sendFeedback = gql`
    mutation sendFeedback($feedbackValue: Int!, $opmerking: String!, $medewerker: medewerkerInput!, $deviceInfo: deviceInfoInput!, $url: String!) {
  sendFeedback(
    feedbackValue: $feedbackValue
    opmerking: $opmerking
    medewerker: $medewerker
    deviceInfo: $deviceInfo
    url: $url
  )
}
    `;
export const sendProductboardFeedback = gql`
    mutation sendProductboardFeedback($feedbackValue: Int!, $opmerking: String!, $medewerker: medewerkerInput!) {
  sendProductboardFeedback(
    feedbackValue: $feedbackValue
    opmerking: $opmerking
    medewerker: $medewerker
  )
}
    `;
export const updateInleveringenStatus = gql`
    mutation updateInleveringenStatus($toekenningId: ID!, $inleveraarId: ID!, $inleveringStatus: InleveringStatus!) {
  updateInleveringenStatus(
    toekenningId: $toekenningId
    inleveraarId: $inleveraarId
    inleveringStatus: $inleveringStatus
  ) {
    ...inleveringFields
  }
}
    ${inleveringFields}`;
export const saveDagToekenningInleveropdrachten = gql`
    mutation saveDagToekenningInleveropdrachten($toekenningInput: [DagToekenningInput!]!) {
  saveDagToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const downloadLaatsteOpdrachtenVanStatussen = gql`
    mutation downloadLaatsteOpdrachtenVanStatussen($toekenningId: ID!, $statussen: [InleveringStatus!]!) {
  downloadLaatsteOpdrachtenVanStatussen(
    toekenningId: $toekenningId
    statussen: $statussen
  )
}
    `;
export const downloadOpdrachtenInBulk = gql`
    mutation downloadOpdrachtenInBulk($toekenningId: ID!, $inleveringenIds: [ID!]!) {
  downloadOpdrachtenInBulk(
    toekenningId: $toekenningId
    inleveringenIds: $inleveringenIds
  )
}
    `;
export const verwijderOngelezenInleveringen = gql`
    mutation verwijderOngelezenInleveringen($toekenningId: ID!, $inleveraarId: ID!) {
  verwijderOngelezenInleveringen(
    toekenningId: $toekenningId
    inleveraarId: $inleveraarId
  )
}
    `;
export const verstuurInleveringReactie = gql`
    mutation verstuurInleveringReactie($toekenningId: ID!, $inleveraarId: ID!, $boodschapInput: BoodschapInput!) {
  verstuurInleveringReactie(
    toekenningId: $toekenningId
    inleveraarId: $inleveraarId
    boodschapInput: $boodschapInput
  )
}
    `;
export const verstuurInleveringReacties = gql`
    mutation verstuurInleveringReacties($toekenningId: ID!, $boodschapInput: BoodschapInput!) {
  verstuurInleveringReacties(
    toekenningId: $toekenningId
    boodschapInput: $boodschapInput
  )
}
    `;
export const startPlagiaatcontrole = gql`
    mutation startPlagiaatcontrole($inleveringId: ID!) {
  startPlagiaatcontrole(inleveringId: $inleveringId)
}
    `;
export const plagiaatInfo = gql`
    mutation plagiaatInfo($inleveringIds: [String!]!) {
  plagiaatInfo(inleveringIds: $inleveringIds) {
    inleveringId
    type
    ephorusDocumentGUID
    submissionId
    percentage
    inVerwerking
    error
  }
}
    `;
export const updateJaarbijlagenZichtbaarheidBulk = gql`
    mutation updateJaarbijlagenZichtbaarheidBulk($jaarbijlagen: [JaarbijlageInput!]!, $jaarbijlageMapIds: [String!]!, $swId: String!, $zichtbaarVoorLeerling: Boolean!) {
  updateJaarbijlagenZichtbaarheidBulk(
    jaarbijlagen: $jaarbijlagen
    jaarbijlageMapIds: $jaarbijlageMapIds
    swId: $swId
    zichtbaarVoorLeerling: $zichtbaarVoorLeerling
  )
}
    `;
export const jaarbijlagenDifferentiatieToekennenBulk = gql`
    mutation jaarbijlagenDifferentiatieToekennenBulk($jaarbijlagen: [JaarbijlageInput!]!, $jaarbijlageMapIds: [String!]!, $swId: String!, $differentiatiegroepenIds: [ID!]!, $differentiatieleerlingenIds: [ID!]!, $differentiatieVervangen: Boolean!) {
  jaarbijlagenDifferentiatieToekennenBulk(
    jaarbijlagen: $jaarbijlagen
    jaarbijlageMapIds: $jaarbijlageMapIds
    swId: $swId
    differentiatiegroepenIds: $differentiatiegroepenIds
    differentiatieleerlingenIds: $differentiatieleerlingenIds
    differentiatieVervangen: $differentiatieVervangen
  ) {
    mappen {
      id
      differentiatiegroepen {
        ...differentiatiegroepFields
      }
      differentiatieleerlingen {
        ...leerlingMetIsJarig
      }
    }
    bijlagen {
      id
      differentiatiegroepen {
        ...differentiatiegroepFields
      }
      differentiatieleerlingen {
        ...leerlingMetIsJarig
      }
    }
  }
}
    ${differentiatiegroepFields}
${leerlingMetIsJarig}`;
export const verwijderJaarbijlagenBulk = gql`
    mutation verwijderJaarbijlagenBulk($jaarbijlagen: [JaarbijlageInput!]!, $swId: String!) {
  verwijderJaarbijlagenBulk(jaarbijlagen: $jaarbijlagen, swId: $swId)
}
    `;
export const saveJaarbijlage = gql`
    mutation saveJaarbijlage($bijlage: BijlageInput!, $swId: String!, $mapId: String, $synchroniseerMetSjabloonId: String) {
  saveJaarbijlage(
    bijlage: $bijlage
    swId: $swId
    mapId: $mapId
    synchroniseerMetSjabloonId: $synchroniseerMetSjabloonId
  ) {
    bijlage {
      ...bijlageFields
    }
  }
}
    ${bijlageFields}`;
export const verwijderJaarbijlage = gql`
    mutation verwijderJaarbijlage($id: String!, $isBestand: Boolean!, $swId: String!) {
  verwijderJaarbijlage(id: $id, isBestand: $isBestand, swId: $swId)
}
    `;
export const saveJaarbijlageMap = gql`
    mutation saveJaarbijlageMap($bijlageMap: BijlageMapInput!, $swId: String!) {
  saveJaarbijlageMap(bijlageMap: $bijlageMap, swId: $swId) {
    ...bijlageMapFields
  }
}
    ${bijlageMapFields}`;
export const verwijderJaarbijlageMap = gql`
    mutation verwijderJaarbijlageMap($jaarbijlageMapId: String!, $verwijderBijlagenMee: Boolean!) {
  verwijderJaarbijlageMap(
    jaarbijlageMapId: $jaarbijlageMapId
    verwijderBijlagenMee: $verwijderBijlagenMee
  )
}
    `;
export const sorteerJaarbijlagen = gql`
    mutation sorteerJaarbijlagen($jaarbijlagen: [JaarbijlageInput!]!, $swId: String!, $jaarbijlageMapId: String) {
  sorteerJaarbijlagen(
    jaarbijlagen: $jaarbijlagen
    swId: $swId
    jaarbijlageMapId: $jaarbijlageMapId
  )
}
    `;
export const sorteerJaarbijlageMappen = gql`
    mutation sorteerJaarbijlageMappen($jaarbijlageMapIds: [String!]!, $swId: String!) {
  sorteerJaarbijlageMappen(jaarbijlageMapIds: $jaarbijlageMapIds, swId: $swId)
}
    `;
export const verplaatsJaarbijlagenNaarMapBulk = gql`
    mutation verplaatsJaarbijlagenNaarMapBulk($jaarbijlagen: [JaarbijlageInput!]!, $swId: String!, $jaarbijlageMapId: String) {
  verplaatsJaarbijlagenNaarMapBulk(
    jaarbijlagen: $jaarbijlagen
    swId: $swId
    jaarbijlageMapId: $jaarbijlageMapId
  )
}
    `;
export const kopieerBijlagen = gql`
    mutation kopieerBijlagen($identifier: ID!, $voorSjabloon: Boolean!, $jaarbijlagen: [JaarbijlageInput!]!, $jaarbijlageMappen: [KopieerBijlageMapInput!]!, $jaarbijlageMapId: String) {
  kopieerBijlagen(
    identifier: $identifier
    voorSjabloon: $voorSjabloon
    jaarbijlagen: $jaarbijlagen
    jaarbijlageMappen: $jaarbijlageMappen
    jaarbijlageMapId: $jaarbijlageMapId
  ) {
    mappen {
      ...bijlageMapFields
    }
    bijlagen {
      ...bijlageFields
    }
  }
}
    ${bijlageMapFields}
${bijlageFields}`;
export const exporteerBijlagen = gql`
    mutation exporteerBijlagen($voorSjabloon: Boolean!, $jaarbijlagen: [JaarbijlageInput!]!, $jaarbijlageMapIds: [ID!]!, $abstractStudiewijzerIds: [ID!]!) {
  exporteerBijlagen(
    voorSjabloon: $voorSjabloon
    jaarbijlagen: $jaarbijlagen
    jaarbijlageMapIds: $jaarbijlageMapIds
    abstractStudiewijzerIds: $abstractStudiewijzerIds
  )
}
    `;
export const synchroniseerJaarbijlageMetSjabloon = gql`
    mutation synchroniseerJaarbijlageMetSjabloon($jaarbijlageId: String!, $bijlageType: String!, $sjabloonId: String!) {
  synchroniseerJaarbijlageMetSjabloon(
    jaarbijlageId: $jaarbijlageId
    bijlageType: $bijlageType
    sjabloonId: $sjabloonId
  )
}
    `;
export const synchroniseerJaarbijlageMapMetSjabloon = gql`
    mutation synchroniseerJaarbijlageMapMetSjabloon($bijlageMapId: String!, $sjabloonId: String!) {
  synchroniseerJaarbijlageMapMetSjabloon(
    bijlageMapId: $bijlageMapId
    sjabloonId: $sjabloonId
  )
}
    `;
export const verwijderBijlageDifferentiaties = gql`
    mutation verwijderBijlageDifferentiaties($bijlageId: ID!, $isBestand: Boolean!) {
  verwijderBijlageDifferentiaties(bijlageId: $bijlageId, isBestand: $isBestand)
}
    `;
export const verwijderMapDifferentiaties = gql`
    mutation verwijderMapDifferentiaties($bijlageMapId: ID!) {
  verwijderMapDifferentiaties(bijlageMapId: $bijlageMapId)
}
    `;
export const setLeerlingoverzichtTijdspanSelectie = gql`
    mutation setLeerlingoverzichtTijdspanSelectie($medewerkerUUID: ID!, $leerlingId: ID!, $selectie: String!) {
  setLeerlingoverzichtTijdspanSelectie(
    medewerkerUUID: $medewerkerUUID
    leerlingId: $leerlingId
    selectie: $selectie
  )
}
    `;
export const setLeerlingoverzichtWeergaveInstellingen = gql`
    mutation setLeerlingoverzichtWeergaveInstellingen($medewerkerUUID: ID!, $leerlingId: ID!, $weergaves: [String!]!) {
  setLeerlingoverzichtWeergaveInstellingen(
    medewerkerUUID: $medewerkerUUID
    leerlingId: $leerlingId
    weergaves: $weergaves
  )
}
    `;
export const lesplanningAfspraakNaarDag = gql`
    mutation lesplanningAfspraakNaarDag($afspraaktoekenning: AfspraakToekenningInput!, $dagtoekenning: DagToekenningInput!) {
  lesplanningAfspraakNaarDag(
    afspraaktoekenning: $afspraaktoekenning
    dagtoekenning: $dagtoekenning
  )
}
    `;
export const lesplanningDagNaarAfspraak = gql`
    mutation lesplanningDagNaarAfspraak($dagtoekenning: DagToekenningInput!, $afspraaktoekenning: AfspraakToekenningInput!) {
  lesplanningDagNaarAfspraak(
    dagtoekenning: $dagtoekenning
    afspraaktoekenning: $afspraaktoekenning
  )
}
    `;
export const updateMaatregeltoekenning = gql`
    mutation updateMaatregeltoekenning($toekenningId: ID, $toekenningInput: MaatregelToekenningInput!) {
  updateMaatregeltoekenning(
    toekenningId: $toekenningId
    toekenningInput: $toekenningInput
  ) {
    ...maatregelToekenning
  }
}
    ${maatregelToekenning}`;
export const deleteMaatregeltoekenning = gql`
    mutation deleteMaatregeltoekenning($toekenningId: ID!) {
  deleteMaatregeltoekenning(toekenningId: $toekenningId)
}
    `;
export const markeerMaatregeltoekenningAfgehandeld = gql`
    mutation markeerMaatregeltoekenningAfgehandeld($toekenningId: ID!, $afgehandeld: Boolean!) {
  markeerMaatregeltoekenningAfgehandeld(
    toekenningId: $toekenningId
    afgehandeld: $afgehandeld
  ) {
    ...maatregelToekenning
  }
}
    ${maatregelToekenning}`;
export const setSignaleringAantal = gql`
    mutation setSignaleringAantal($medewerkerUuid: ID!, $signaleringAantal: Int!) {
  setSignaleringAantal(
    medewerkerUuid: $medewerkerUuid
    signaleringAantal: $signaleringAantal
  ) {
    succes
  }
}
    `;
export const setLaatstGelezenUpdate = gql`
    mutation setLaatstGelezenUpdate($medewerkerUuid: String!, $laatsteId: Int!) {
  setLaatstGelezenUpdate(medewerkerUuid: $medewerkerUuid, laatsteId: $laatsteId) {
    succes
  }
}
    `;
export const setDagBegintijd = gql`
    mutation setDagBegintijd($medewerkerUuid: ID!, $dagBegintijd: String!) {
  setDagBegintijd(medewerkerUuid: $medewerkerUuid, dagBegintijd: $dagBegintijd) {
    succes
  }
}
    `;
export const markeerAllesGelezen = gql`
    mutation markeerAllesGelezen {
  markeerAllesGelezen
}
    `;
export const markeerGelezen = gql`
    mutation markeerGelezen($boodschapId: ID!) {
  markeerGelezen(boodschapId: $boodschapId)
}
    `;
export const saveSortering = gql`
    mutation saveSortering($sorteringInput: SorteringInput!) {
  saveSortering(sorteringInput: $sorteringInput)
}
    `;
export const setSignaleringenFilters = gql`
    mutation setSignaleringenFilters($medewerkerUUID: ID!, $filters: SignaleringenFiltersInput!) {
  setSignaleringenFilters(medewerkerUUID: $medewerkerUUID, filters: $filters) {
    ...signaleringenFiltersFields
  }
}
    ${signaleringenFiltersFields}`;
export const setGroepsoverzichtTijdspanSelectie = gql`
    mutation setGroepsoverzichtTijdspanSelectie($medewerkerUUID: ID!, $stamgroepId: ID, $isGezamenlijk: Boolean, $selectie: String!) {
  setGroepsoverzichtTijdspanSelectie(
    medewerkerUUID: $medewerkerUUID
    stamgroepId: $stamgroepId
    isGezamenlijk: $isGezamenlijk
    selectie: $selectie
  )
}
    `;
export const setGroepsoverzichtWeergaveInstellingen = gql`
    mutation setGroepsoverzichtWeergaveInstellingen($medewerkerUUID: ID!, $stamgroepId: ID, $isGezamenlijk: Boolean, $weergaves: [GroepsoverzichtWeergaveInstellingInput!]!) {
  setGroepsoverzichtWeergaveInstellingen(
    medewerkerUUID: $medewerkerUUID
    stamgroepId: $stamgroepId
    isGezamenlijk: $isGezamenlijk
    weergaves: $weergaves
  )
}
    `;
export const setGroepsoverzichtResultatenInstellingen = gql`
    mutation setGroepsoverzichtResultatenInstellingen($medewerkerUUID: ID!, $stamgroepId: ID, $isGezamenlijk: Boolean, $resultatenInstellingen: GroepsoverzichtResultatenInstellingenInput!) {
  setGroepsoverzichtResultatenInstellingen(
    medewerkerUUID: $medewerkerUUID
    stamgroepId: $stamgroepId
    isGezamenlijk: $isGezamenlijk
    resultatenInstellingen: $resultatenInstellingen
  )
}
    `;
export const setGroepsoverzichtResultatenSortering = gql`
    mutation setGroepsoverzichtResultatenSortering($medewerkerUUID: ID!, $stamgroepId: ID, $isGezamenlijk: Boolean, $sortering: GroepsoverzichtResultatenSorteringenInput!) {
  setGroepsoverzichtResultatenSortering(
    medewerkerUUID: $medewerkerUUID
    stamgroepId: $stamgroepId
    isGezamenlijk: $isGezamenlijk
    sortering: $sortering
  )
}
    `;
export const updateRecenteMethodes = gql`
    mutation updateRecenteMethodes($medewerkerUuid: String!, $methodeInput: RecenteMethodeInput!) {
  updateRecenteMethodes(
    medewerkerUuid: $medewerkerUuid
    methodeInput: $methodeInput
  )
}
    `;
export const saveNotitie = gql`
    mutation saveNotitie($notitie: NotitieInput!) {
  saveNotitie(notitie: $notitie) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const bookmarkNotitie = gql`
    mutation bookmarkNotitie($notitieId: ID!, $notitieContext: NotitieContext!, $contextId: String!, $bookmarked: Boolean!) {
  bookmarkNotitie(
    notitieId: $notitieId
    notitieContext: $notitieContext
    contextId: $contextId
    bookmarked: $bookmarked
  ) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const notitieVastprikken = gql`
    mutation notitieVastprikken($notitieId: ID!, $notitieContext: NotitieContext!, $contextId: String!, $vastgeprikt: Boolean!) {
  notitieVastprikken(
    notitieId: $notitieId
    notitieContext: $notitieContext
    contextId: $contextId
    vastgeprikt: $vastgeprikt
  ) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const markeerNotitieGelezen = gql`
    mutation markeerNotitieGelezen($notitieId: ID!, $notitieContext: NotitieContext!, $contextId: String!) {
  markeerNotitieGelezen(
    notitieId: $notitieId
    notitieContext: $notitieContext
    contextId: $contextId
  ) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const updateZichtbaarheidNotitie = gql`
    mutation updateZichtbaarheidNotitie($notitieId: ID!, $notitieZichtbaarheid: NotitieZichtbaarheidInput!) {
  updateZichtbaarheidNotitie(
    notitieId: $notitieId
    notitieZichtbaarheid: $notitieZichtbaarheid
  ) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const verwijderNotitie = gql`
    mutation verwijderNotitie($notitieId: ID!) {
  verwijderNotitie(notitieId: $notitieId)
}
    `;
export const markeerAlleNotitiesGelezen = gql`
    mutation markeerAlleNotitiesGelezen {
  markeerAlleNotitiesGelezen
}
    `;
export const saveProjectgroep = gql`
    mutation saveProjectgroep($projectgroep: ProjectgroepInput!) {
  saveProjectgroep(projectgroep: $projectgroep) {
    ...projectgroepFields
  }
}
    ${projectgroepFields}`;
export const deleteProjectgroep = gql`
    mutation deleteProjectgroep($projectgroep: String!) {
  deleteProjectgroep(projectgroep: $projectgroep)
}
    `;
export const verplaatsProjectgroepLeerling = gql`
    mutation verplaatsProjectgroepLeerling($leerlingId: ID!, $vanProjectgroepId: ID!, $naarProjectgroepId: ID!) {
  verplaatsProjectgroepLeerling(
    leerlingId: $leerlingId
    vanProjectgroepId: $vanProjectgroepId
    naarProjectgroepId: $naarProjectgroepId
  )
}
    `;
export const saveLesRegistratie = gql`
    mutation saveLesRegistratie($lesRegistratieInput: LesRegistratieInput!) {
  saveLesRegistratie(lesRegistratieInput: $lesRegistratieInput) {
    afspraakId
    presentieRegistratieVerwerkt
    registraties {
      leerlingRegistratieId
      aanwezig
      huiswerkNietInOrde
      materiaalVergeten
      waarneming {
        id
        ingevoerdDoor {
          ...ingevoerdDoor
        }
      }
      absentMelding {
        ...absentieMeldingFields
      }
      teLaatMelding {
        ...absentieMeldingFields
      }
      verwijderdMelding {
        ...absentieMeldingFields
      }
      materiaalVergeten
      huiswerkNietInOrde
      overigeVrijVeldWaarden {
        ...overigeVrijVeldWaardeFields
      }
    }
  }
}
    ${ingevoerdDoor}
${absentieMeldingFields}
${overigeVrijVeldWaardeFields}`;
export const saveSignaleringenInstellingen = gql`
    mutation saveSignaleringenInstellingen($medewerkerUuid: ID!, $aantal: Int!, $verborgenVrijeVeldenIds: [ID!]!) {
  saveSignaleringenInstellingen(
    medewerkerUuid: $medewerkerUuid
    aantal: $aantal
    verborgenVrijeVeldenIds: $verborgenVrijeVeldenIds
  )
}
    `;
export const deleteToetsKolom = gql`
    mutation deleteToetsKolom($toetsKolomId: ID!) {
  deleteToetsKolom(toetsKolomId: $toetsKolomId)
}
    `;
export const saveToetsKolom = gql`
    mutation saveToetsKolom($toetsKolom: ResultaatKolomInput!, $kolomType: ResultaatkolomType!) {
  saveToetsKolom(toetsKolom: $toetsKolom, kolomType: $kolomType)
}
    `;
export const setKolomZichtbaarheid = gql`
    mutation setKolomZichtbaarheid($medewerkerUuid: String!, $lesgroepId: ID!, $zichtbaarheid: [KolomZichtbaarheidInput!]!) {
  setKolomZichtbaarheid(
    medewerkerUuid: $medewerkerUuid
    lesgroepId: $lesgroepId
    zichtbaarheid: $zichtbaarheid
  )
}
    `;
export const saveResultaten = gql`
    mutation saveResultaten($voortgangsdossierId: ID!, $lesgroepId: ID!, $resultaatInputParams: [ResultaatInputParam!]!) {
  saveResultaten(
    voortgangsdossierId: $voortgangsdossierId
    lesgroepId: $lesgroepId
    resultaatInputParams: $resultaatInputParams
  ) {
    resultaatKey {
      leerlingUUID
      resultaatkolomId
      herkansingsNummer
    }
    success
    errorMessage
  }
}
    `;
export const saveResultaatOpmerkingen = gql`
    mutation saveResultaatOpmerkingen($voortgangsdossierId: ID!, $lesgroepId: String!, $cellId: ID!, $opmerkingen: String, $toonOpmerkingInELO: Boolean!) {
  saveResultaatOpmerkingen(
    voortgangsdossierId: $voortgangsdossierId
    lesgroepId: $lesgroepId
    cellId: $cellId
    opmerkingen: $opmerkingen
    toonOpmerkingInELO: $toonOpmerkingInELO
  )
}
    `;
export const saveLesgroepOmschrijving = gql`
    mutation saveLesgroepOmschrijving($voortgangsdossierId: ID!, $lesgroepId: ID!, $toetsKolomId: ID!, $lesgroepOmschrijving: String) {
  saveLesgroepOmschrijving(
    voortgangsdossierId: $voortgangsdossierId
    lesgroepId: $lesgroepId
    toetsKolomId: $toetsKolomId
    lesgroepOmschrijving: $lesgroepOmschrijving
  )
}
    `;
export const updateZichtbaarheidBulkSjabloon = gql`
    mutation updateZichtbaarheidBulkSjabloon($zichtbaarVoorLeerling: Boolean!, $studiewijzeritemIds: [String!]!) {
  updateZichtbaarheidBulkSjabloon(
    zichtbaarVoorLeerling: $zichtbaarVoorLeerling
    studiewijzeritemIds: $studiewijzeritemIds
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const verwijderBulkSjabloon = gql`
    mutation verwijderBulkSjabloon($studiewijzeritemIds: [String!]!) {
  verwijderBulkSjabloon(studiewijzeritemIds: $studiewijzeritemIds)
}
    `;
export const ontkoppelStudiewijzersVanSjablonen = gql`
    mutation ontkoppelStudiewijzersVanSjablonen($sjabloonIds: [ID!]!) {
  ontkoppelStudiewijzersVanSjablonen(sjabloonIds: $sjabloonIds)
}
    `;
export const verplaatsSjabloon = gql`
    mutation verplaatsSjabloon($medewerkerUuid: String!, $vaksectieUuid: String!, $sjabloonId: String!, $vanCategorie: String, $naarCategorie: String, $sjabloonUuid: String!) {
  verplaatsSjabloon(
    medewerkerUuid: $medewerkerUuid
    vaksectieUuid: $vaksectieUuid
    sjabloonId: $sjabloonId
    vanCategorie: $vanCategorie
    naarCategorie: $naarCategorie
    sjabloonUuid: $sjabloonUuid
  )
}
    `;
export const saveSjabloon = gql`
    mutation saveSjabloon($sjabloon: SjabloonInput!, $actie: String!, $medewerkerUuid: ID!, $studiewijzerId: ID) {
  saveSjabloon(
    sjabloon: $sjabloon
    actie: $actie
    medewerkerUuid: $medewerkerUuid
    studiewijzerId: $studiewijzerId
  ) {
    sjabloon {
      ...basisSjabloonFields
      gesynchroniseerdeStudiewijzers {
        ...basisStudiewijzerFields
      }
    }
  }
}
    ${basisSjabloonFields}
${basisStudiewijzerFields}`;
export const saveSjabloonVanuitDetail = gql`
    mutation saveSjabloonVanuitDetail($sjabloon: SjabloonInput!, $actie: String!, $medewerkerUuid: ID!, $studiewijzerId: ID, $oudeVaksectieUuid: String) {
  saveSjabloon(
    sjabloon: $sjabloon
    actie: $actie
    medewerkerUuid: $medewerkerUuid
    studiewijzerId: $studiewijzerId
    oudeVaksectieUuid: $oudeVaksectieUuid
  ) {
    sjabloon {
      ...sjabloonFields
    }
  }
}
    ${sjabloonFields}`;
export const kopieerToekenningenNaarSjabloon = gql`
    mutation kopieerToekenningenNaarSjabloon($sjabloonId: ID!, $weeknummer: Int!, $toekenningIds: [ID!]!) {
  kopieerToekenningenNaarSjabloon(
    sjabloonId: $sjabloonId
    weeknummer: $weeknummer
    toekenningIds: $toekenningIds
  ) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const kopieerSjabloon = gql`
    mutation kopieerSjabloon($sjabloonId: ID!, $sjabloonUuid: String!) {
  kopieerSjabloon(sjabloonId: $sjabloonId, sjabloonUuid: $sjabloonUuid) {
    ...basisSjabloonFields
    gesynchroniseerdeStudiewijzers {
      ...basisStudiewijzerFields
    }
  }
}
    ${basisSjabloonFields}
${basisStudiewijzerFields}`;
export const dupliceerToekenningInSjabloon = gql`
    mutation dupliceerToekenningInSjabloon($toekenningId: ID!) {
  dupliceerToekenningInSjabloon(toekenningId: $toekenningId) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const exporteerToekenningenUitSjabloon = gql`
    mutation exporteerToekenningenUitSjabloon($toekenningIds: [ID!]!, $abstractStudiewijzerIds: [ID!]!) {
  exporteerToekenningenUitSjabloon(
    toekenningIds: $toekenningIds
    abstractStudiewijzerIds: $abstractStudiewijzerIds
  )
}
    `;
export const synchroniseerMetSjabloon = gql`
    mutation synchroniseerMetSjabloon($sjabloonId: ID!, $startWeek: Int!, $studiewijzerIds: [ID!]!) {
  synchroniseerMetSjabloon(
    sjabloonId: $sjabloonId
    startWeek: $startWeek
    studiewijzerIds: $studiewijzerIds
  )
}
    `;
export const ontkoppelVanSjabloon = gql`
    mutation ontkoppelVanSjabloon($sjabloonId: ID!, $studiewijzerId: ID!, $verwijderItems: Boolean!) {
  ontkoppelVanSjabloon(
    sjabloonId: $sjabloonId
    studiewijzerId: $studiewijzerId
    verwijderItems: $verwijderItems
  )
}
    `;
export const verschuifSjabloonContent = gql`
    mutation verschuifSjabloonContent($sjabloonId: ID!, $nieuweStartweek: Int!) {
  verschuifSjabloonContent(
    sjabloonId: $sjabloonId
    nieuweStartweek: $nieuweStartweek
  )
}
    `;
export const verschuifSjabloonPlanning = gql`
    mutation verschuifSjabloonPlanning($sjabloonId: ID!, $vanafWeeknummer: Int!, $aantalWeken: Int!, $direction: String!) {
  verschuifSjabloonPlanning(
    sjabloonId: $sjabloonId
    vanafWeeknummer: $vanafWeeknummer
    aantalWeken: $aantalWeken
    direction: $direction
  )
}
    `;
export const saveSjabloonCategorie = gql`
    mutation saveSjabloonCategorie($categorie: SjabloonCategorieInput!, $medewerkerUuid: String!) {
  saveSjabloonCategorie(categorie: $categorie, medewerkerUuid: $medewerkerUuid) {
    id
    vaksectieUuid
    naam
    sjablonen
    inEditMode @client
  }
}
    `;
export const deleteSjabloonCategorie = gql`
    mutation deleteSjabloonCategorie($categorieId: ID!, $medewerkerUuid: String!, $vaksectieUuid: String!) {
  deleteSjabloonCategorie(
    categorieId: $categorieId
    medewerkerUuid: $medewerkerUuid
    vaksectieUuid: $vaksectieUuid
  )
}
    `;
export const moveSjabloonCategorie = gql`
    mutation moveSjabloonCategorie($movePosition: Int!, $categorieId: ID!, $vaksectieUuid: String!, $medewerkerUuid: String!) {
  moveSjabloonCategorie(
    movePosition: $movePosition
    categorieId: $categorieId
    vaksectieUuid: $vaksectieUuid
    medewerkerUuid: $medewerkerUuid
  )
}
    `;
export const deleteSjabloon = gql`
    mutation deleteSjabloon($sjabloon: DeleteSjabloonInput!) {
  deleteSjabloon(sjabloon: $sjabloon) {
    succes
  }
}
    `;
export const addLabelToSjabloonWeek = gql`
    mutation addLabelToSjabloonWeek($sjabloonId: ID!, $weeknummer: Int!, $label: String!) {
  addLabelToSjabloonWeek(
    sjabloonId: $sjabloonId
    weeknummer: $weeknummer
    label: $label
  )
}
    `;
export const removeLabelFromSjabloonWeek = gql`
    mutation removeLabelFromSjabloonWeek($sjabloonId: ID!, $weeknummer: Int!) {
  removeLabelFromSjabloonWeek(sjabloonId: $sjabloonId, weeknummer: $weeknummer)
}
    `;
export const afspraakNaarAfspraak = gql`
    mutation afspraakNaarAfspraak($afspraakToekenning: AfspraakToekenningInput!, $lesgroepId: String!) {
  afspraakNaarAfspraak(
    afspraakToekenning: $afspraakToekenning
    lesgroepId: $lesgroepId
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const dagNaarAfspraak = gql`
    mutation dagNaarAfspraak($dagToekenning: DagToekenningInput!, $lesgroepId: String!, $datum: LocalDate!) {
  dagNaarAfspraak(
    dagToekenning: $dagToekenning
    lesgroepId: $lesgroepId
    datum: $datum
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const afspraakNaarDag = gql`
    mutation afspraakNaarDag($afspraakToekenning: AfspraakToekenningInput!, $lesgroepId: String!, $dag: LocalDate!) {
  afspraakNaarDag(
    afspraakToekenning: $afspraakToekenning
    lesgroepId: $lesgroepId
    dag: $dag
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const dagNaarDag = gql`
    mutation dagNaarDag($dagToekenning: DagToekenningInput!, $lesgroepId: String!) {
  dagNaarDag(dagToekenning: $dagToekenning, lesgroepId: $lesgroepId) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const dagNaarWeek = gql`
    mutation dagNaarWeek($dagToekenning: DagToekenningInput!, $lesgroepId: String!, $weeknummer: Int!) {
  dagNaarWeek(
    dagToekenning: $dagToekenning
    lesgroepId: $lesgroepId
    weeknummer: $weeknummer
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const afspraakNaarWeek = gql`
    mutation afspraakNaarWeek($afspraakToekenning: AfspraakToekenningInput!, $lesgroepId: String!, $weeknummer: Int!) {
  afspraakNaarWeek(
    afspraakToekenning: $afspraakToekenning
    lesgroepId: $lesgroepId
    weeknummer: $weeknummer
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const weekNaarWeek = gql`
    mutation weekNaarWeek($weekToekenning: WeekToekenningInput!) {
  weekNaarWeek(weekToekenning: $weekToekenning) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const weekNaarAfspraak = gql`
    mutation weekNaarAfspraak($weekToekenning: WeekToekenningInput!, $datum: LocalDate!) {
  weekNaarAfspraak(weekToekenning: $weekToekenning, datum: $datum) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const weekNaarDag = gql`
    mutation weekNaarDag($weekToekenning: WeekToekenningInput!, $dag: LocalDate!) {
  weekNaarDag(weekToekenning: $weekToekenning, dag: $dag) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const saveStudiewijzer = gql`
    mutation saveStudiewijzer($studiewijzer: StudiewijzerInput!) {
  saveStudiewijzer(studiewijzer: $studiewijzer) {
    ...studiewijzerFields
  }
}
    ${studiewijzerFields}`;
export const verschuifPlanning = gql`
    mutation verschuifPlanning($studiewijzerId: ID!, $vanafWeeknummer: Int!, $aantalWeken: Int!, $direction: String!) {
  verschuifPlanning(
    studiewijzerId: $studiewijzerId
    vanafWeeknummer: $vanafWeeknummer
    aantalWeken: $aantalWeken
    direction: $direction
  )
}
    `;
export const deleteStudiewijzer = gql`
    mutation deleteStudiewijzer($studiewijzerId: ID!) {
  deleteStudiewijzer(studiewijzerId: $studiewijzerId)
}
    `;
export const studiewijzerSaveAfspraakToekenningObs = gql`
    mutation studiewijzerSaveAfspraakToekenningObs($toekenningInput: [AfspraakToekenningInput!]!, $sjabloonSyncId: String) {
  saveAfspraakToekenning(
    toekenningInput: $toekenningInput
    sjabloonSyncId: $sjabloonSyncId
  ) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const importeerSjablonen = gql`
    mutation importeerSjablonen($studiewijzerId: ID!, $sjablonen: [SjabloonWeekInput!]!) {
  importeerSjablonen(studiewijzerId: $studiewijzerId, sjablonen: $sjablonen)
}
    `;
export const exporteerToekenningenUitStudiewijzer = gql`
    mutation exporteerToekenningenUitStudiewijzer($toekenningIds: [ID!]!, $abstractStudiewijzerIds: [ID!]!) {
  exporteerToekenningenUitStudiewijzer(
    toekenningIds: $toekenningIds
    abstractStudiewijzerIds: $abstractStudiewijzerIds
  )
}
    `;
export const saveStudiewijzerCategorie = gql`
    mutation saveStudiewijzerCategorie($categorie: StudiewijzerCategorieInput!, $medewerkerUuid: String!, $schooljaar: Int!) {
  saveStudiewijzerCategorie(
    categorie: $categorie
    medewerkerUuid: $medewerkerUuid
    schooljaar: $schooljaar
  ) {
    id
    naam
    studiewijzers
    inEditMode @client
  }
}
    `;
export const deleteStudiewijzerCategorie = gql`
    mutation deleteStudiewijzerCategorie($categorieId: ID!, $medewerkerUuid: String!, $schooljaar: Int!) {
  deleteStudiewijzerCategorie(
    categorieId: $categorieId
    medewerkerUuid: $medewerkerUuid
    schooljaar: $schooljaar
  )
}
    `;
export const moveStudiewijzerCategorie = gql`
    mutation moveStudiewijzerCategorie($movePosition: Int!, $categorieId: ID!, $schooljaar: Int!, $medewerkerUuid: String!) {
  moveStudiewijzerCategorie(
    movePosition: $movePosition
    categorieId: $categorieId
    schooljaar: $schooljaar
    medewerkerUuid: $medewerkerUuid
  )
}
    `;
export const verplaatsStudiewijzer = gql`
    mutation verplaatsStudiewijzer($medewerkerUuid: String!, $schooljaar: Int!, $studiewijzerUuid: String!, $vanCategorie: String, $naarCategorie: String) {
  verplaatsStudiewijzer(
    medewerkerUuid: $medewerkerUuid
    schooljaar: $schooljaar
    studiewijzerUuid: $studiewijzerUuid
    vanCategorie: $vanCategorie
    naarCategorie: $naarCategorie
  )
}
    `;
export const synchroniseerMetSjablonen = gql`
    mutation synchroniseerMetSjablonen($studiewijzerId: ID!, $sjablonen: [SjabloonWeekInput!]!) {
  synchroniseerMetSjablonen(
    studiewijzerId: $studiewijzerId
    sjablonen: $sjablonen
  )
}
    `;
export const saveAfspraakToekenning = gql`
    mutation saveAfspraakToekenning($toekenningInput: [AfspraakToekenningInput!]!) {
  saveAfspraakToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const saveDagToekenning = gql`
    mutation saveDagToekenning($toekenningInput: [DagToekenningInput!]!) {
  saveDagToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const saveWeekToekenning = gql`
    mutation saveWeekToekenning($toekenningInput: [WeekToekenningInput!]!) {
  saveWeekToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const deleteDagToekenning = gql`
    mutation deleteDagToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean!) {
  deleteDagToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const deleteAfspraakToekenning = gql`
    mutation deleteAfspraakToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean!) {
  deleteAfspraakToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const deleteWeekToekenning = gql`
    mutation deleteWeekToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean!) {
  deleteWeekToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const updateToekenningZichtbaarheid = gql`
    mutation updateToekenningZichtbaarheid($toekenningInput: [DagToekenningInput!]!) {
  saveDagToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const saveAfspraakToekenningObs = gql`
    mutation saveAfspraakToekenningObs($toekenningInput: [AfspraakToekenningInput!]!) {
  saveAfspraakToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const saveDagToekenningObs = gql`
    mutation saveDagToekenningObs($toekenningInput: [DagToekenningInput!]!) {
  saveDagToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const herplanAfspraakToekenningen = gql`
    mutation herplanAfspraakToekenningen($herplanAfspraakToekenningen: HerplanAfspraakToekenningenInput!) {
  herplanAfspraakToekenningen(
    herplanAfspraakToekenningen: $herplanAfspraakToekenningen
  ) {
    succes
  }
}
    `;
export const verwijderBulkStudiewijzer = gql`
    mutation verwijderBulkStudiewijzer($studiewijzeritemIds: [String!]!, $verwijderUitSjabloon: Boolean!) {
  verwijderBulkStudiewijzer(
    studiewijzeritemIds: $studiewijzeritemIds
    verwijderUitSjabloon: $verwijderUitSjabloon
  )
}
    `;
export const updateZichtbaarheidBulkStudiewijzer = gql`
    mutation updateZichtbaarheidBulkStudiewijzer($zichtbaarVoorLeerling: Boolean!, $studiewijzeritemIds: [String!]!) {
  updateZichtbaarheidBulkStudiewijzer(
    zichtbaarVoorLeerling: $zichtbaarVoorLeerling
    studiewijzeritemIds: $studiewijzeritemIds
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const verwijderStudiewijzeritems = gql`
    mutation verwijderStudiewijzeritems($studiewijzeritemIds: [String!]!, $verwijderUitSjabloon: Boolean!) {
  verwijderBulkStudiewijzer(
    studiewijzeritemIds: $studiewijzeritemIds
    verwijderUitSjabloon: $verwijderUitSjabloon
  )
}
    `;
export const saveWeekToekenningObs = gql`
    mutation saveWeekToekenningObs($toekenningInput: [WeekToekenningInput!]!, $sjabloonSyncId: String) {
  saveWeekToekenning(
    toekenningInput: $toekenningInput
    sjabloonSyncId: $sjabloonSyncId
  ) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const verwijderWeekToekenning = gql`
    mutation verwijderWeekToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean) {
  deleteWeekToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const verwijderDagToekenning = gql`
    mutation verwijderDagToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean) {
  deleteDagToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const verwijderAfspraakToekenning = gql`
    mutation verwijderAfspraakToekenning($toekenningId: String!, $verwijderUitSjabloon: Boolean) {
  deleteAfspraakToekenning(
    toekenningId: $toekenningId
    verwijderUitSjabloon: $verwijderUitSjabloon
  ) {
    succes
  }
}
    `;
export const kopieerToekenningenNaarStudiewijzerWeek = gql`
    mutation kopieerToekenningenNaarStudiewijzerWeek($studiewijzerId: ID!, $weeknummer: Int!, $toekenningIds: [ID!]!) {
  kopieerToekenningenNaarStudiewijzerWeek(
    studiewijzerId: $studiewijzerId
    weeknummer: $weeknummer
    toekenningIds: $toekenningIds
  ) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const kopieerToekenningenNaarStudiewijzerDatum = gql`
    mutation kopieerToekenningenNaarStudiewijzerDatum($studiewijzerId: ID!, $voorAfspraak: Boolean!, $datum: LocalDate!, $toekenningIds: [ID!]!) {
  kopieerToekenningenNaarStudiewijzerDatum(
    studiewijzerId: $studiewijzerId
    voorAfspraak: $voorAfspraak
    datum: $datum
    toekenningIds: $toekenningIds
  ) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const updateZichtbaarheidToekenning = gql`
    mutation updateZichtbaarheidToekenning($zichtbaarVoorLeerling: Boolean!, $studiewijzeritemIds: [String!]!) {
  updateZichtbaarheidBulkStudiewijzer(
    zichtbaarVoorLeerling: $zichtbaarVoorLeerling
    studiewijzeritemIds: $studiewijzeritemIds
  ) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const dupliceerToekenningInStudiewijzer = gql`
    mutation dupliceerToekenningInStudiewijzer($toekenningId: ID!) {
  dupliceerToekenningInStudiewijzer(toekenningId: $toekenningId) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const ontkoppelToekenning = gql`
    mutation ontkoppelToekenning($toekenningId: String!) {
  ontkoppelToekenning(toekenningId: $toekenningId)
}
    `;
export const koppelToekenning = gql`
    mutation koppelToekenning($sjabloonId: String!, $toekenningId: String!) {
  koppelToekenning(sjabloonId: $sjabloonId, toekenningId: $toekenningId)
}
    `;
export const saveWeekToekenning2 = gql`
    mutation saveWeekToekenning2($toekenningInput: [WeekToekenningInput!]!) {
  saveWeekToekenning(toekenningInput: $toekenningInput) {
    toekenningen {
      ...toekenningMutationFields
    }
  }
}
    ${toekenningMutationFields}`;
export const verwijderToekenning = gql`
    mutation verwijderToekenning($toekenningId: String!) {
  deleteWeekToekenning(toekenningId: $toekenningId) {
    succes
  }
}
    `;
export const sorteerToekenningen = gql`
    mutation sorteerToekenningen($toekenningenSortering: [ToekenningSortering!]!, $suffix: String!) {
  sorteerToekenningen(
    toekenningenSortering: $toekenningenSortering
    suffix: $suffix
  )
}
    `;
export const sorteerSjabloonToekenning = gql`
    mutation sorteerSjabloonToekenning($toekenningenSortering: [ToekenningSortering!]!, $suffix: String!) {
  sorteerToekenningen(
    toekenningenSortering: $toekenningenSortering
    suffix: $suffix
  )
}
    `;
export const differentiatieToekennenBulk = gql`
    mutation differentiatieToekennenBulk($toekenningIds: [ID!]!, $differentiatiegroepenIds: [ID!]!, $differentiatieleerlingenIds: [ID!]!, $differentiatieVervangen: Boolean!) {
  differentiatieToekennenBulk(
    toekenningIds: $toekenningIds
    differentiatiegroepenIds: $differentiatiegroepenIds
    differentiatieleerlingenIds: $differentiatieleerlingenIds
    differentiatieVervangen: $differentiatieVervangen
  ) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const verwijderToekenningDifferentiaties = gql`
    mutation verwijderToekenningDifferentiaties($toekenningId: ID!) {
  verwijderToekenningDifferentiaties(toekenningId: $toekenningId)
}
    `;
export const transloaditParams = gql`
    mutation transloaditParams {
  transloaditParams {
    uploadContextId
    params
    signature
  }
}
    `;
export const afspraak = gql`
    query afspraak($id: ID!) {
  afspraak(id: $id) {
    ...BaseAfspraak
    ...AfspraakLesgroepenFields
    medewerkers {
      ...afspraakMedewerker
    }
    isKwt
    heeftLesgroepen
  }
}
    ${baseAfspraak}
${afspraakLesgroepenFields}
${afspraakMedewerker}`;
export const zoekParticipanten = gql`
    query zoekParticipanten($zoekterm: String!, $afspraakId: ID) {
  zoekParticipanten(zoekterm: $zoekterm, afspraakId: $afspraakId) {
    stamgroep {
      id
      naam
    }
    lesgroep {
      id
      naam
      color @client
    }
    medewerker {
      id
      nummer
      voornaam
      tussenvoegsels
      achternaam
      initialen
      pasfoto
    }
    leerling {
      id
      uuid
      leerlingnummer
      voornaam
      tussenvoegsels
      achternaam
      initialen
      pasfoto
      stamgroep
    }
  }
}
    `;
export const getVerjaardagen = gql`
    query getVerjaardagen {
  getVerjaardagen {
    vanaf
    tot
    jarigenDezeWeek {
      ...verjaardagLeerling
    }
    jarigenVolgendeWeek {
      ...verjaardagLeerling
    }
  }
}
    ${verjaardagLeerling}`;
export const lesmomentenVanWeek = gql`
    query lesmomentenVanWeek($jaar: Int!, $week: Int!, $exacteLesgroepenMatch: Boolean!, $lesgroepIds: [ID!]) {
  lesmomentenVanWeek(
    jaar: $jaar
    week: $week
    exacteLesgroepenMatch: $exacteLesgroepenMatch
    lesgroepIds: $lesgroepIds
  ) {
    ...BaseAfspraak
    isKwt
    medewerkers {
      ...afspraakMedewerker
    }
    lesgroepen {
      ...LesgroepFields
    }
  }
}
    ${baseAfspraak}
${afspraakMedewerker}
${lesgroepFields}`;
export const leerlingAfspraakVakken = gql`
    query leerlingAfspraakVakken($leerlingId: String!, $afspraakId: String!) {
  leerlingAfspraakVakken(leerlingId: $leerlingId, afspraakId: $afspraakId) {
    ...VakFields
  }
}
    ${vakFields}`;
export const validateUrl = gql`
    query validateUrl($url: String!) {
  validateUrl(url: $url) {
    statusCode
    protocolChange
    contentType
  }
}
    `;
export const sharedLinkContext = gql`
    query sharedLinkContext($sharedLinkContextUuid: String!) {
  sharedLinkContext(sharedLinkContextUuid: $sharedLinkContextUuid) {
    id
    description
    type
    sender
    homeworkType
    homeworkTitle
    date
    assignmentStart
    assignmentEnd
    url
    groups
    learningGoals
  }
}
    `;
export const differentiatiegroepen = gql`
    query differentiatiegroepen($lesgroep: String!) {
  differentiatiegroepen(lesgroep: $lesgroep) {
    ...differentiatiegroepFields
  }
}
    ${differentiatiegroepFields}`;
export const leerlingenVanLesgroepMetDifferentiatiegroepen = gql`
    query leerlingenVanLesgroepMetDifferentiatiegroepen($lesgroep: String!) {
  leerlingenVanLesgroepMetDifferentiatiegroepen(lesgroep: $lesgroep) {
    differentiatiegroepen {
      id
      naam
      kleur
    }
    ...leerlingMetIsJarig
  }
}
    ${leerlingMetIsJarig}`;
export const isFeatureDisabled = gql`
    query isFeatureDisabled($moduleNaam: String!, $featureNaam: String!) {
  isFeatureDisabled(moduleNaam: $moduleNaam, featureNaam: $featureNaam)
}
    `;
export const productboardToken = gql`
    query productboardToken($medewerker: medewerkerInput!) {
  productboardToken(medewerker: $medewerker)
}
    `;
export const inleveropdrachtenVanSchooljaarAankomend = gql`
    query inleveropdrachtenVanSchooljaarAankomend($schooljaar: Int!) {
  inleveropdrachtenVanSchooljaarAankomend(schooljaar: $schooljaar) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const inleveropdrachtenVanSchooljaarVerlopen = gql`
    query inleveropdrachtenVanSchooljaarVerlopen($schooljaar: Int!) {
  inleveropdrachtenVanSchooljaarVerlopen(schooljaar: $schooljaar) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const aantalInleveropdrachtenVanSchooljaarVerlopen = gql`
    query aantalInleveropdrachtenVanSchooljaarVerlopen($schooljaar: Int!) {
  aantalInleveropdrachtenVanSchooljaarVerlopen(schooljaar: $schooljaar)
}
    `;
export const inleveringen = gql`
    query inleveringen($toekenningId: ID!, $inleveraarId: ID!) {
  inleveringen(toekenningId: $toekenningId, inleveraarId: $inleveraarId) {
    ...inleveringFields
  }
}
    ${inleveringFields}`;
export const inleveringenConversatie = gql`
    query inleveringenConversatie($toekenningId: ID!, $inleveraarId: ID!) {
  inleveringenConversatie(
    toekenningId: $toekenningId
    inleveraarId: $inleveraarId
  ) {
    ...inleveringBerichtFields
  }
}
    ${inleveringBerichtFields}`;
export const inleveringenOverzicht = gql`
    query inleveringenOverzicht($toekenningId: ID!) {
  inleveringenOverzicht(toekenningId: $toekenningId) {
    toekenning {
      ...dagOfAfspraakToekenningFields
    }
    berichtenMogelijk
    nieuw {
      inleveraar {
        ...inleveraarFields
      }
      inleveringen {
        id
        inlevering {
          id
          inleverdatum
        }
      }
    }
    teBeoordelen {
      ...inleveraarFields
    }
    inBeoordeling {
      ...inleveraarFields
    }
    afgewezen {
      ...inleveraarFields
    }
    akkoord {
      ...inleveraarFields
    }
    nietIngeleverd {
      ...inleveraarFields
    }
  }
}
    ${dagOfAfspraakToekenningFields}
${inleveraarFields}`;
export const similarityReportUrl = gql`
    query similarityReportUrl($submissionId: String!) {
  similarityReportUrl(submissionId: $submissionId)
}
    `;
export const pollPlagiaatVerwerkingStatus = gql`
    query pollPlagiaatVerwerkingStatus($inleveringIds: [String!]!) {
  pollPlagiaatVerwerkingStatus(inleveringIds: $inleveringIds) {
    inVerwerking
    nietInVerwerking
  }
}
    `;
export const inleveropdrachten = gql`
    query inleveropdrachten($lesgroepen: [String!]!) {
  inleveropdrachten(lesgroepen: $lesgroepen) {
    ...toekenningFields
  }
}
    ${toekenningFields}`;
export const inleveroverzicht = gql`
    query inleveroverzicht($toekenningId: ID!) {
  inleveroverzicht(toekenningId: $toekenningId) {
    afgerond {
      ...inleveraarFields
    }
    nietAfgerond {
      ...inleveraarFields
    }
  }
}
    ${inleveraarFields}`;
export const jaarbijlageVoorAbstractSw = gql`
    query jaarbijlageVoorAbstractSw($abstractSwId: String!) {
  jaarbijlageVoorAbstractSw(abstractSwId: $abstractSwId) {
    mappen {
      ...bijlageMapFields
    }
    bijlagen {
      ...bijlageFields
    }
  }
}
    ${bijlageMapFields}
${bijlageFields}`;
export const heeftLeerlingExamendossier = gql`
    query heeftLeerlingExamendossier($leerlingId: ID!) {
  heeftLeerlingExamendossier(leerlingId: $leerlingId)
}
    `;
export const leerlingenVanLesgroep = gql`
    query leerlingenVanLesgroep($lesgroepId: String!) {
  leerlingenVanLesgroep(lesgroepId: $lesgroepId) {
    ...leerlingMetIsJarig
  }
}
    ${leerlingMetIsJarig}`;
export const leerlingenMetAccount = gql`
    query leerlingenMetAccount($studiewijzerId: ID!) {
  leerlingenMetAccount(studiewijzerId: $studiewijzerId) {
    ...leerlingMetIsJarig
  }
}
    ${leerlingMetIsJarig}`;
export const leerling = gql`
    query leerling($id: ID!) {
  leerling(id: $id) {
    ...partialLeerling
  }
}
    ${partialLeerling}`;
export const leerlingMetSchooljaren = gql`
    query leerlingMetSchooljaren($id: ID!) {
  leerling(id: $id, additionals: ["schooljaren"]) {
    ...partialLeerling
    schooljaren
  }
}
    ${partialLeerling}`;
export const leerlingoverzichtInstellingen = gql`
    query leerlingoverzichtInstellingen($medewerkerUUID: ID!, $leerlingId: ID!) {
  leerlingoverzichtInstellingen(
    medewerkerUUID: $medewerkerUUID
    leerlingId: $leerlingId
  ) {
    ...leerlingoverzichtInstellingenFields
  }
}
    ${leerlingoverzichtInstellingenFields}`;
export const leerlingoverzichtRegistraties = gql`
    query leerlingoverzichtRegistraties($leerlingId: ID!, $periode: MentordashboardOverzichtPeriode!) {
  leerlingoverzichtRegistraties(leerlingId: $leerlingId, periode: $periode) {
    cijferperiode {
      ...registratiesCijferperiodeFields
    }
    registraties {
      ...leerlingoverzichtRegistratieFields
    }
    totDatum
    vanafDatum
  }
}
    ${registratiesCijferperiodeFields}
${leerlingoverzichtRegistratieFields}`;
export const leerlingoverzichtResultaten = gql`
    query leerlingoverzichtResultaten($leerlingId: ID!) {
  leerlingoverzichtResultaten(leerlingId: $leerlingId) {
    actueelTotaalGemiddelde
    actueleCijferperiode
    periodeRapportCijfers {
      ...periodeRapportCijfersFields
    }
    vakTrends {
      ...vakToetsTrendFields
    }
  }
}
    ${periodeRapportCijfersFields}
${vakToetsTrendFields}`;
export const leerlingoverzichtVakDetailPeriodeToetsresultaten = gql`
    query leerlingoverzichtVakDetailPeriodeToetsresultaten($leerlingId: ID!, $vakId: ID!) {
  leerlingoverzichtVakDetailPeriodeToetsresultaten(
    leerlingId: $leerlingId
    vakId: $vakId
  ) {
    cijferperiode
    isHuidig
    toetsresultaten {
      ...vakDetailToetsresultaatFields
    }
  }
}
    ${vakDetailToetsresultaatFields}`;
export const leerlingoverzichtExamenResultaten = gql`
    query leerlingoverzichtExamenResultaten($leerlingId: ID!) {
  leerlingoverzichtExamenResultaten(leerlingId: $leerlingId) {
    actueelTotaalGemiddelde
    heeftTrendindicatie
    examenVakSamenvattendeResultaten {
      ...mentorDashboardExamenVakSamenvattendeResultatenFields
      docenten
    }
  }
}
    ${mentorDashboardExamenVakSamenvattendeResultatenFields}`;
export const leerlingoverzichtVakSamenvatting = gql`
    query leerlingoverzichtVakSamenvatting($leerlingId: String!, $vakId: String!, $periode: Int!, $isExamen: Boolean!) {
  leerlingoverzichtVakSamenvatting(
    leerlingId: $leerlingId
    vakId: $vakId
    periode: $periode
    isExamen: $isExamen
  ) {
    ... on LeerlingoverzichtVakSamenvattingResponse {
      __typename
      resultaten {
        ...vakResultatenFields
      }
      registraties {
        ...leerlingoverzichtVakDetailRegistratieWrapperFields
      }
      notities {
        docentNamen
        notities {
          ...rapportvergaderingNotitieFields
        }
      }
    }
    ... on LeerlingoverzichtExamenVakSamenvattingResponse {
      __typename
      registraties {
        ...leerlingoverzichtVakDetailRegistratieWrapperFields
      }
      notities {
        docentNamen
        notities {
          ...rapportvergaderingNotitieFields
        }
      }
    }
  }
}
    ${vakResultatenFields}
${leerlingoverzichtVakDetailRegistratieWrapperFields}
${rapportvergaderingNotitieFields}`;
export const leerlingoverzichtVakSeResultaten = gql`
    query leerlingoverzichtVakSEResultaten($leerlingId: String!, $vakId: String!) {
  leerlingoverzichtVakSEResultaten(leerlingId: $leerlingId, vakId: $vakId) {
    ...geldendResultaatFields
  }
}
    ${geldendResultaatFields}`;
export const leerlingoverzichtResultatenVergelijking = gql`
    query leerlingoverzichtResultatenVergelijking($leerlingId: String!, $periode: Int!, $vergelijking: LeerlingoverzichtResultatenVergelijking!) {
  leerlingoverzichtResultatenVergelijking(
    leerlingId: $leerlingId
    periode: $periode
    vergelijking: $vergelijking
  ) {
    ...vakgemiddeldeFields
  }
}
    ${vakgemiddeldeFields}`;
export const leerlingoverzichtSeResultatenVergelijking = gql`
    query leerlingoverzichtSEResultatenVergelijking($leerlingId: String!, $vergelijking: LeerlingoverzichtResultatenVergelijking!) {
  leerlingoverzichtSEResultatenVergelijking(
    leerlingId: $leerlingId
    vergelijking: $vergelijking
  ) {
    ...vakgemiddeldeFields
  }
}
    ${vakgemiddeldeFields}`;
export const lesgroepenMetDossier = gql`
    query lesgroepenMetDossier($lesgroepIds: [ID!]!) {
  lesgroepenMetDossier(lesgroepIds: $lesgroepIds) {
    id
    naam
    vak {
      ...VakFields
    }
    examendossierOndersteund
    color @client
    vestigingId
  }
}
    ${vakFields}`;
export const lesgroep = gql`
    query lesgroep($id: ID!) {
  lesgroep(id: $id) {
    ...LesgroepFields
  }
}
    ${lesgroepFields}`;
export const lesplanNavigatieWeek = gql`
    query lesplanNavigatieWeek($afspraakId: ID!, $lesgroepen: [String!]!, $jaar: Int!, $week: Int!) {
  lesplanNavigatieWeek(
    afspraakId: $afspraakId
    lesgroepen: $lesgroepen
    jaar: $jaar
    week: $week
  ) {
    id
    datum
    afspraak {
      ...BaseAfspraak
      ...AfspraakLesgroepenFields
      isKwt
      medewerkers {
        ...afspraakMedewerker
      }
    }
  }
}
    ${baseAfspraak}
${afspraakLesgroepenFields}
${afspraakMedewerker}`;
export const lesplanning = gql`
    query lesplanning($afspraakId: ID!, $begin: LocalDate!, $eind: LocalDate!, $type: String!, $lesgroepen: [String!]!) {
  lesplanning(
    afspraakId: $afspraakId
    begin: $begin
    eind: $eind
    type: $type
    lesgroepen: $lesgroepen
  ) {
    ...lesplanningFields
  }
}
    ${lesplanningFields}`;
export const lesplanningRoosterPreview = gql`
    query lesplanningRoosterPreview($afspraakId: ID!, $afspraakBegin: LocalDate!, $afspraakEind: LocalDate!, $huiswerkType: HuiswerkType!) {
  lesplanningRoosterPreview(
    afspraakId: $afspraakId
    afspraakBegin: $afspraakBegin
    afspraakEind: $afspraakEind
    huiswerkType: $huiswerkType
  ) {
    onderwerp
    omschrijving
    tijdsindicatie
  }
}
    `;
export const lesplanningVoorWeek = gql`
    query lesplanningVoorWeek($afspraakId: ID!, $lesgroepen: [String!]!, $weeknr: Int!, $jaar: Int!) {
  lesplanningVoorWeek(
    afspraakId: $afspraakId
    lesgroepen: $lesgroepen
    weeknr: $weeknr
    jaar: $jaar
  ) {
    ...lesplanningFields
  }
}
    ${lesplanningFields}`;
export const toekomendeAfspraken = gql`
    query toekomendeAfspraken($afspraakId: ID!) {
  toekomendeAfspraken(afspraakId: $afspraakId) {
    ...BaseAfspraak
    isKwt
    isNu @client
    medewerkers {
      ...afspraakMedewerker
    }
  }
}
    ${baseAfspraak}
${afspraakMedewerker}`;
export const toekomendeAfsprakenVanLesgroepen = gql`
    query toekomendeAfsprakenVanLesgroepen($lesgroepen: [ID!]!, $vanafDatum: LocalDate!) {
  toekomendeAfsprakenVanLesgroepen(
    lesgroepen: $lesgroepen
    vanafDatum: $vanafDatum
  ) {
    ...BaseAfspraak
    isKwt
    isNu @client
    medewerkers {
      ...afspraakMedewerker
    }
  }
}
    ${baseAfspraak}
${afspraakMedewerker}`;
export const maatregeltoekenningenPreview = gql`
    query maatregeltoekenningenPreview($leerlingId: ID!) {
  maatregeltoekenningenPreview(leerlingId: $leerlingId) {
    maatregeltoekenningen {
      ...maatregelToekenning
    }
    aantal
  }
}
    ${maatregelToekenning}`;
export const maatregeltoekenningen = gql`
    query maatregeltoekenningen($leerlingId: ID!) {
  maatregeltoekenningen(leerlingId: $leerlingId) {
    ...maatregelToekenning
  }
}
    ${maatregelToekenning}`;
export const maatregelen = gql`
    query maatregelen($vestigingId: ID!, $actief: Boolean!) {
  maatregelen(vestigingId: $vestigingId, actief: $actief) {
    ...maatregelFields
  }
}
    ${maatregelFields}`;
export const ingelogdeMedewerker = gql`
    query ingelogdeMedewerker {
  ingelogdeMedewerker {
    id
    uuid
    nummer
    initialen
    voornaam
    tussenvoegsels
    achternaam
    pasfoto
    email
    school
    laatstGelezenUpdate
    hoofdvestiging {
      ...vestigingFields
    }
    organisatie {
      ...organisatieFields
    }
    googleAnalyticsRolNaam
    settings {
      id
      vestigingRechten {
        vestigingId
        teLaatMeldingToegestaan
        verwijderdMeldingToegestaan
        heeftToegangTotElo
        heeftToegangTotStudiewijzer
        heeftToegangTotDifferentiatie
        heeftToegangMentordashboardCompleet
        importUitMethodeToegestaan
        toonDomeinvelden
        resultaatOpmerkingTonenInELOToegestaan
        heeftToegangTotNotitieboek
      }
      dagBegintijd
      heeftBerichtenInzienRecht
      heeftBerichtenWijzigenRecht
      toegangTotMSTeams
      toegangTotGoogleMeet
      plagiaatControleerbaar
      signaleringAantal
      heeftMentordashboardToegang
      heeftLeerlingPlaatsingenRegistratiesInzienRecht
      leerlingAfwezigheidMaatregelBewerkenRecht
      heeftVoortgangsdossierInzienRecht
      heeftVoortgangsdossierBewerkenRecht
      heeftVoortgangsdossierLesgroepToetsenBewerkenRecht
      heeftExamendossierInzienRecht
      heeftExamendossierBewerkenRecht
      heeftExamendossierLesgroepToetsenBewerkenRecht
      heeftExamendossierCEResultatenInzienRecht
      heeftExamendossierCEResultatenBewerkenRecht
      heeftExamendossierSEResultatenBewerkenRecht
      heeftBekoeldeResultatenBewerkenRecht
      heeftContactmomentenBewerkenCollectiefRecht
      heeftContactmomentenBewerkenLesgroepRecht
      heeftContactmomentenBewerkenStamgroepRecht
      heeftContactmomentenBewerkenLeerlingRecht
    }
  }
}
    ${vestigingFields}
${organisatieFields}`;
export const aantalOngelezenBerichten = gql`
    query aantalOngelezenBerichten {
  aantalOngelezenBerichten
}
    `;
export const berichtenVanMedewerker = gql`
    query berichtenVanMedewerker($offset: Int!, $limit: Int!) {
  berichtenVanMedewerker(offset: $offset, limit: $limit) {
    id
    onderwerp
    verzender
    verzendDatum
    gelezen
    heeftBijlagen
    inleveropdrachtContext {
      toekenningId
      inleveraarId
    }
  }
}
    `;
export const lesgroepenVanDeDocent = gql`
    query lesgroepenVanDeDocent {
  lesgroepenVanDeDocent {
    id
    naam
    vak {
      ...VakFields
    }
    examendossierOndersteund
    color @client
    vestigingId
  }
}
    ${vakFields}`;
export const medewerkerLesgroepenMetDossier = gql`
    query medewerkerLesgroepenMetDossier {
  medewerkerLesgroepenMetDossier {
    id
    naam
    vak {
      ...VakFields
    }
    examendossierOndersteund
    color @client
    vestigingId
  }
}
    ${vakFields}`;
export const lesgroepen = gql`
    query lesgroepen($schooljaar: Int!, $medewerkerId: ID!) {
  lesgroepen(schooljaar: $schooljaar, medewerkerId: $medewerkerId) {
    id
    naam
    vak {
      ...VakFields
    }
    examendossierOndersteund
    color @client
    vestigingId
  }
}
    ${vakFields}`;
export const vakcodesVanDocent = gql`
    query vakcodesVanDocent {
  vakcodesVanDocent
}
    `;
export const sorteringVanMedewerker = gql`
    query sorteringVanMedewerker($medewerkerUuid: String!, $sorteringNaam: String!) {
  sorteringVanMedewerker(
    medewerkerUuid: $medewerkerUuid
    sorteringNaam: $sorteringNaam
  ) {
    ...sorteringFields
  }
}
    ${sorteringFields}`;
export const mentorleerlingen = gql`
    query mentorleerlingen {
  mentorleerlingen {
    stamgroepMentorleerlingen {
      stamgroep {
        ...stamgroepFields
      }
      mentorleerlingen {
        ...partialLeerling
        plaatsingDefinitief
        vestigingId
      }
    }
    individueleMentorleerlingen {
      stamgroep {
        ...stamgroepFields
      }
      leerling {
        ...partialLeerling
        plaatsingDefinitief
        vestigingId
      }
    }
  }
}
    ${stamgroepFields}
${partialLeerling}`;
export const mentorleerlingenLijstIds = gql`
    query mentorleerlingenLijstIds {
  mentorleerlingenLijstIds
}
    `;
export const vakoverzichtRegistraties = gql`
    query vakoverzichtRegistraties($leerlingId: ID!) {
  vakoverzichtRegistraties(leerlingId: $leerlingId) {
    vakken {
      id
      naam
      afkorting
    }
    periodes {
      nummer
      vanaf
      tot
      totaalOngeoorloofdAfwezig
      totaalGeoorloofdAfwezig
      totaalTeLaat
      totaalVerwijderd
      isHuidig
      totaalVrijVeldRegistraties {
        vrijVeld {
          id
          naam
        }
        aantal
        keuzelijstWaarde {
          ...keuzelijstVrijVeldWaardeFields
        }
      }
      vakRegistraties {
        vak {
          ...VakFields
        }
        aantalOngeoorloofdAfwezig
        aantalGeoorloofdAfwezig
        aantalTeLaat
        aantalVerwijderd
        vrijveldRegistraties {
          ...vrijveldRegistratiesFields
        }
      }
    }
  }
}
    ${keuzelijstVrijVeldWaardeFields}
${vakFields}
${vrijveldRegistratiesFields}`;
export const signaleringenFilters = gql`
    query signaleringenFilters($medewerkerUUID: ID!) {
  signaleringenFilters(medewerkerUUID: $medewerkerUUID) {
    ...signaleringenFiltersFields
  }
}
    ${signaleringenFiltersFields}`;
export const groepsoverzichtInstellingen = gql`
    query groepsoverzichtInstellingen($medewerkerUUID: ID!, $stamgroepId: ID, $isGezamenlijk: Boolean) {
  groepsoverzichtInstellingen(
    medewerkerUUID: $medewerkerUUID
    stamgroepId: $stamgroepId
    isGezamenlijk: $isGezamenlijk
  ) {
    registraties {
      ...groepsoverzichtRegistratiesInstellingenFields
    }
    resultaten {
      ...groepsoverzichtResultatenInstellingenFields
    }
  }
}
    ${groepsoverzichtRegistratiesInstellingenFields}
${groepsoverzichtResultatenInstellingenFields}`;
export const leerlingkaart = gql`
    query leerlingkaart($leerlingId: ID!) {
  leerlingkaart(leerlingId: $leerlingId) {
    leerling {
      ...leerlingMetIsJarig
      mobielNummer
      email
      geboortedatum
      adres {
        ...adresFields
      }
      vestigingId
    }
    opmerkingenGezinsSituatie
    relaties {
      ...relatieFields
    }
    broersEnZussen {
      ...leerlingMetIsJarig
      mobielNummer
      email
      geslacht
      adres {
        ...adresFields
      }
    }
    stamgroep {
      id
      naam
    }
    beperkingen {
      ...baseBeperking
    }
    hulpmiddelen {
      ...baseMedischHulpmiddel
    }
    interventies {
      ...baseSchoolInterventie
    }
    opleidingnaam
  }
}
    ${leerlingMetIsJarig}
${adresFields}
${relatieFields}
${baseBeperking}
${baseMedischHulpmiddel}
${baseSchoolInterventie}`;
export const registratieDetail = gql`
    query registratieDetail($leerlingId: String!, $vakId: String, $vanaf: LocalDate!, $tot: LocalDate!, $kolom: String, $vrijveldId: String, $keuzelijstWaardeMogelijkheidId: String) {
  registratieDetail(
    leerlingId: $leerlingId
    vakId: $vakId
    vanaf: $vanaf
    tot: $tot
    kolom: $kolom
    vrijveldId: $vrijveldId
    keuzelijstWaardeMogelijkheidId: $keuzelijstWaardeMogelijkheidId
  ) {
    ...registratieDetailFields
  }
}
    ${registratieDetailFields}`;
export const totaalRegistratieDetails = gql`
    query totaalRegistratieDetails($leerlingId: String!, $kolom: String, $vrijveldId: String, $keuzelijstWaardeMogelijkheidId: String) {
  totaalRegistratieDetails(
    leerlingId: $leerlingId
    kolom: $kolom
    vrijveldId: $vrijveldId
    keuzelijstWaardeMogelijkheidId: $keuzelijstWaardeMogelijkheidId
  ) {
    aantalToetsmomenten
    registratieMaanden {
      ...totaalRegistratieMaandDetailsFields
    }
  }
}
    ${totaalRegistratieMaandDetailsFields}`;
export const totaaloverzichtRegistraties = gql`
    query totaaloverzichtRegistraties($leerlingId: String!) {
  totaaloverzichtRegistraties(leerlingId: $leerlingId) {
    ...totaaloverzichtRegistratiesFields
  }
}
    ${totaaloverzichtRegistratiesFields}`;
export const groepsoverzichtPeriodeOpties = gql`
    query groepsoverzichtPeriodeOpties($stamgroepId: String!) {
  groepsoverzichtPeriodeOpties(stamgroepId: $stamgroepId) {
    ...mentordashboardOverzichtPeriodeOptiesFields
  }
}
    ${mentordashboardOverzichtPeriodeOptiesFields}`;
export const groepsoverzichtPeriodeOptiesIndividueel = gql`
    query groepsoverzichtPeriodeOptiesIndividueel {
  groepsoverzichtPeriodeOptiesIndividueel {
    ...mentordashboardOverzichtPeriodeOptiesFields
  }
}
    ${mentordashboardOverzichtPeriodeOptiesFields}`;
export const groepsoverzichtPeriodeRegistratiesAfwezig = gql`
    query groepsoverzichtPeriodeRegistratiesAfwezig($leerlingId: String!, $kolom: String!, $vanaf: LocalDate!, $tot: LocalDate!) {
  groepsoverzichtPeriodeRegistratiesAfwezig(
    leerlingId: $leerlingId
    kolom: $kolom
    vanaf: $vanaf
    tot: $tot
  ) {
    ...periodeRegistratieDetailsFields
  }
}
    ${periodeRegistratieDetailsFields}`;
export const groepsoverzichtPeriodeRegistratiesVrijVeld = gql`
    query groepsoverzichtPeriodeRegistratiesVrijVeld($leerlingId: String!, $vrijVeldId: String!, $vanaf: LocalDate!, $tot: LocalDate!, $keuzelijstWaardeMogelijkheidId: String) {
  groepsoverzichtPeriodeRegistratiesVrijVeld(
    leerlingId: $leerlingId
    vrijVeldId: $vrijVeldId
    vanaf: $vanaf
    tot: $tot
    keuzelijstWaardeMogelijkheidId: $keuzelijstWaardeMogelijkheidId
  ) {
    ...periodeRegistratieDetailsFields
  }
}
    ${periodeRegistratieDetailsFields}`;
export const groepsoverzichtVakRapportResultaatTrends = gql`
    query groepsoverzichtVakRapportResultaatTrends($leerlingId: String!, $stamgroepId: String!) {
  groepsoverzichtVakRapportResultaatTrends(
    leerlingId: $leerlingId
    stamgroepId: $stamgroepId
  ) {
    ...groepsoverzichtVakRapportResultaatTrendFields
  }
}
    ${groepsoverzichtVakRapportResultaatTrendFields}`;
export const groepsoverzichtVakRapportResultaatTrendsIndividueel = gql`
    query groepsoverzichtVakRapportResultaatTrendsIndividueel($leerlingId: String!) {
  groepsoverzichtVakRapportResultaatTrendsIndividueel(leerlingId: $leerlingId) {
    ...groepsoverzichtVakRapportResultaatTrendFields
  }
}
    ${groepsoverzichtVakRapportResultaatTrendFields}`;
export const groepsoverzichtExamenVakRapportResultaatTrends = gql`
    query groepsoverzichtExamenVakRapportResultaatTrends($leerlingId: String!) {
  groepsoverzichtExamenVakRapportResultaatTrends(leerlingId: $leerlingId) {
    context {
      ...mentorDashboardExamenDossierContextenFields
    }
    heeftTrendindicatie
    vakTrends {
      ...mentorDashboardExamenVakSamenvattendeResultatenFields
    }
  }
}
    ${mentorDashboardExamenDossierContextenFields}
${mentorDashboardExamenVakSamenvattendeResultatenFields}`;
export const groepsoverzichtRegistraties = gql`
    query groepsoverzichtRegistraties($stamgroepId: String!, $periode: MentordashboardOverzichtPeriode!) {
  groepsoverzichtRegistraties(stamgroepId: $stamgroepId, periode: $periode) {
    ...groepsoverzichtRegistratiesWrapperFields
  }
}
    ${groepsoverzichtRegistratiesWrapperFields}`;
export const groepsoverzichtRegistratiesIndividueel = gql`
    query groepsoverzichtRegistratiesIndividueel($periode: MentordashboardOverzichtPeriode!) {
  groepsoverzichtRegistratiesIndividueel(periode: $periode) {
    ...groepsoverzichtRegistratiesWrapperFields
  }
}
    ${groepsoverzichtRegistratiesWrapperFields}`;
export const groepsCijferOverzicht = gql`
    query groepsCijferOverzicht($stamgroepId: String!) {
  groepsCijferOverzicht(stamgroepId: $stamgroepId) {
    ...leerlingRapportCijferOverzichtFields
  }
}
    ${leerlingRapportCijferOverzichtFields}`;
export const groepsCijferOverzichtIndividueel = gql`
    query groepsCijferOverzichtIndividueel {
  groepsCijferOverzichtIndividueel {
    ...leerlingRapportCijferOverzichtFields
  }
}
    ${leerlingRapportCijferOverzichtFields}`;
export const groepsExamenCijferOverzicht = gql`
    query groepsExamenCijferOverzicht($stamgroepId: String!) {
  groepsExamenCijferOverzicht(stamgroepId: $stamgroepId) {
    ...leerlingExamenCijferOverzichtFields
  }
}
    ${leerlingExamenCijferOverzichtFields}`;
export const groepsExamenCijferOverzichtIndividueel = gql`
    query groepsExamenCijferOverzichtIndividueel {
  groepsExamenCijferOverzichtIndividueel {
    ...leerlingExamenCijferOverzichtFields
  }
}
    ${leerlingExamenCijferOverzichtFields}`;
export const examenDossierAanwezig = gql`
    query examenDossierAanwezig($stamgroepId: String!) {
  examenDossierAanwezig(stamgroepId: $stamgroepId)
}
    `;
export const examenDossierAanwezigIndividueel = gql`
    query examenDossierAanwezigIndividueel {
  examenDossierAanwezigIndividueel
}
    `;
export const leerlingVoortgangsdossierGemisteToetsen = gql`
    query leerlingVoortgangsdossierGemisteToetsen($leerlingId: String!) {
  leerlingVoortgangsdossierGemisteToetsen(leerlingId: $leerlingId) {
    ...GemistResultaatFields
  }
}
    ${gemistResultaatFields}`;
export const leerlingExamendossierGemisteToetsen = gql`
    query leerlingExamendossierGemisteToetsen($leerlingId: String!) {
  leerlingExamendossierGemisteToetsen(leerlingId: $leerlingId) {
    ...GemistResultaatFields
  }
}
    ${gemistResultaatFields}`;
export const leerlingVoortgangsdossierLaatsteResultaten = gql`
    query leerlingVoortgangsdossierLaatsteResultaten($leerlingId: String!, $aantal: Int) {
  leerlingVoortgangsdossierLaatsteResultaten(
    leerlingId: $leerlingId
    aantal: $aantal
  ) {
    ...RecentResultaatFields
  }
}
    ${recentResultaatFields}`;
export const leerlingExamendossierLaatsteResultaten = gql`
    query leerlingExamendossierLaatsteResultaten($leerlingId: String!, $aantal: Int) {
  leerlingExamendossierLaatsteResultaten(leerlingId: $leerlingId, aantal: $aantal) {
    ...RecentResultaatFields
  }
}
    ${recentResultaatFields}`;
export const leerlingoverzichtPeriodeOpties = gql`
    query leerlingoverzichtPeriodeOpties($leerlingId: String!) {
  leerlingoverzichtPeriodeOpties(leerlingId: $leerlingId) {
    ...mentordashboardOverzichtPeriodeOptiesFields
  }
}
    ${mentordashboardOverzichtPeriodeOptiesFields}`;
export const leerlingVoortgangsdossierLaatsteResultatenMetTrend = gql`
    query leerlingVoortgangsdossierLaatsteResultatenMetTrend($leerlingId: String!, $aantal: Int) {
  leerlingVoortgangsdossierLaatsteResultatenMetTrend(
    leerlingId: $leerlingId
    aantal: $aantal
  ) {
    ...RecenteResultatenMetTrendWrapperFields
  }
}
    ${recenteResultatenMetTrendWrapperFields}`;
export const leerlingExamendossierLaatsteResultatenMetTrend = gql`
    query leerlingExamendossierLaatsteResultatenMetTrend($leerlingId: String!, $aantal: Int) {
  leerlingExamendossierLaatsteResultatenMetTrend(
    leerlingId: $leerlingId
    aantal: $aantal
  ) {
    ...RecenteResultatenMetTrendWrapperFields
  }
}
    ${recenteResultatenMetTrendWrapperFields}`;
export const methoden = gql`
    query methoden($vakcodes: [String!]) {
  methoden(vakcodes: $vakcodes) {
    id
    naam
    publisher
    editie
    type
  }
}
    `;
export const hoofdstukken = gql`
    query hoofdstukken($publisherId: ID!, $methodeId: ID!) {
  hoofdstukken(publisherId: $publisherId, methodeId: $methodeId) {
    id
    naam
    subHoofdstukken {
      id
      naam
      inhoud {
        id
        naam
        url
        type
        huiswerkType
        leerdoelen
      }
      leerdoelen
    }
  }
}
    `;
export const recenteMethodes = gql`
    query recenteMethodes($medewerkerUuid: String!) {
  recenteMethodes(medewerkerUuid: $medewerkerUuid) {
    id
    publisher
    naam
    editie
  }
}
    `;
export const notitiestream = gql`
    query notitiestream($notitieContext: NotitieContext!, $contextId: String!, $startSchooljaar: Int, $groepering: NotitieStreamGroepering) {
  notitiestream(
    notitieContext: $notitieContext
    contextId: $contextId
    startSchooljaar: $startSchooljaar
    groepering: $groepering
  ) {
    ...notitieStreamPeriodeFields
  }
}
    ${notitieStreamPeriodeFields}`;
export const zoekBetrokkenen = gql`
    query zoekBetrokkenen($zoekterm: String, $stamgroepId: String, $lesgroepId: String) {
  zoekBetrokkenen(
    zoekterm: $zoekterm
    stamgroepId: $stamgroepId
    lesgroepId: $lesgroepId
  ) {
    stamgroepen {
      ...stamgroepFields
      vestiging {
        ...vestigingFields
      }
    }
    lesgroepen {
      ...LesgroepFields
      vestiging {
        ...vestigingFields
      }
    }
    leerlingen {
      leerling {
        ...partialLeerling
      }
      deelnemerVanContextGroep
    }
  }
}
    ${stamgroepFields}
${vestigingFields}
${lesgroepFields}
${partialLeerling}`;
export const vestigingVakken = gql`
    query vestigingVakken($notitieContext: NotitieContext!, $contextId: String!) {
  vestigingVakken(notitieContext: $notitieContext, contextId: $contextId) {
    ...VakFields
  }
}
    ${vakFields}`;
export const notitieBetrokkeneToegang = gql`
    query notitieBetrokkeneToegang($notitieId: ID!, $notitieContext: NotitieContext!, $contextId: String!) {
  notitieBetrokkeneToegang(
    notitieId: $notitieId
    notitieContext: $notitieContext
    contextId: $contextId
  ) {
    ...notitieBetrokkeneToegangFields
  }
}
    ${notitieBetrokkeneToegangFields}`;
export const notitieboekMenu = gql`
    query notitieboekMenu {
  notitieboekMenu {
    ongelezen {
      ...notitieboekMenuItemFields
    }
    groepen {
      ...notitieboekMenuItemFields
    }
    individueleMentorLeerlingenAanwezig
    mentorLeerlingOngelezenNotitieAanwezig
  }
}
    ${notitieboekMenuItemFields}`;
export const notitieboekMenuSearch = gql`
    query notitieboekMenuSearch($zoekterm: String!) {
  notitieboekMenuSearch(zoekterm: $zoekterm) {
    ...notitieboekMenuItemFields
  }
}
    ${notitieboekMenuItemFields}`;
export const notitieboekMenuIndividueleMentorLeerlingen = gql`
    query notitieboekMenuIndividueleMentorLeerlingen {
  notitieboekMenuIndividueleMentorLeerlingen {
    ...notitieboekMenuGroepFields
  }
}
    ${notitieboekMenuGroepFields}`;
export const notitieboekMenuLesgroepLeerlingen = gql`
    query notitieboekMenuLesgroepLeerlingen($lesgroepId: ID!) {
  notitieboekMenuLesgroepLeerlingen(lesgroepId: $lesgroepId) {
    ...notitieboekMenuGroepFields
  }
}
    ${notitieboekMenuGroepFields}`;
export const notitieboekMenuStamgroepLeerlingen = gql`
    query notitieboekMenuStamgroepLeerlingen($stamgroepId: ID!) {
  notitieboekMenuStamgroepLeerlingen(stamgroepId: $stamgroepId) {
    ...notitieboekMenuGroepFields
  }
}
    ${notitieboekMenuGroepFields}`;
export const ongelezenNotitiesAanwezig = gql`
    query ongelezenNotitiesAanwezig {
  ongelezenNotitiesAanwezig
}
    `;
export const aantalOngelezenLeerlingNotities = gql`
    query aantalOngelezenLeerlingNotities($leerlingId: ID!) {
  aantalOngelezenLeerlingNotities(leerlingId: $leerlingId)
}
    `;
export const aantalOngelezenStamgroepNotities = gql`
    query aantalOngelezenStamgroepNotities($stamgroepId: ID!) {
  aantalOngelezenStamgroepNotities(stamgroepId: $stamgroepId)
}
    `;
export const vastgeprikteNotitiesPreview = gql`
    query vastgeprikteNotitiesPreview($leerlingId: ID!) {
  vastgeprikteNotitiesPreview(leerlingId: $leerlingId) {
    aantalVastgeprikteNotities
    notities {
      ...notitieFields
    }
  }
}
    ${notitieFields}`;
export const vastgeprikteNotities = gql`
    query vastgeprikteNotities($leerlingId: ID!) {
  vastgeprikteNotities(leerlingId: $leerlingId) {
    ...notitieFields
  }
}
    ${notitieFields}`;
export const actueleNotitieItems = gql`
    query actueleNotitieItems($afspraakId: ID!) {
  actueleNotitieItems(afspraakId: $afspraakId) {
    ...actueleNotitieItemFields
  }
}
    ${actueleNotitieItemFields}`;
export const actueleNotities = gql`
    query actueleNotities($context: NotitieContext!, $contextId: String!) {
  actueleNotities(context: $context, contextId: $contextId) {
    vastgeprikteNotities {
      ...notitieFields
    }
    vandaagOfOngelezenNotitiestream {
      ...notitieStreamPeriodeFields
    }
  }
}
    ${notitieFields}
${notitieStreamPeriodeFields}`;
export const projectgroepen = gql`
    query projectgroepen($studiewijzeritem: String!) {
  projectgroepen(studiewijzeritem: $studiewijzeritem) {
    ...projectgroepFields
  }
}
    ${projectgroepFields}`;
export const lesRegistratie = gql`
    query lesRegistratie($afspraak: afspraakInput!, $defaultAanwezig: Boolean!) {
  lesRegistratie(afspraak: $afspraak, defaultAanwezig: $defaultAanwezig) {
    id
    laatstGewijzigdDatum
    overigeVrijVeldDefinities {
      id
      naam
      keuzelijstWaardeMogelijkheden {
        id
        waarde
      }
      vastgezet
      positie
    }
    leerlingRegistraties {
      id
      dirty @client
      waarneming {
        id
        ingevoerdDoor {
          ...ingevoerdDoor
        }
      }
      leerling {
        id
        uuid
        voornaam
        tussenvoegsels
        achternaam
        initialen
        pasfoto
        isJarig
        leerlingnummer
      }
      aanwezig
      absent {
        ...absentieMeldingFields
      }
      teLaat {
        ...absentieMeldingFields
      }
      verwijderd {
        ...absentieMeldingFields
      }
      materiaalVergeten
      huiswerkNietInOrde
      overigeVrijVeldWaarden {
        ...overigeVrijVeldWaardeFields
      }
      absentieRedenenToegestaanVoorDocent {
        ...absentieRedenFields
      }
      onlineDeelname
      notitieboekToegankelijk
    }
  }
}
    ${ingevoerdDoor}
${absentieMeldingFields}
${overigeVrijVeldWaardeFields}
${absentieRedenFields}`;
export const signaleringen = gql`
    query signaleringen($afspraakId: ID!) {
  signaleringen(afspraakId: $afspraakId) {
    id
    periode {
      naam
      begin
      eind
    }
    vrijVeldSignaleringen {
      vrijVeld {
        id
        naam
        vastgezet
        positie
      }
      leerlingSignaleringen {
        ...leerlingSignaleringen
      }
      keuzelijstWaardeSignaleringen {
        keuzelijstWaarde {
          id
          waarde
        }
        leerlingSignaleringen {
          ...leerlingSignaleringen
        }
      }
    }
  }
}
    ${leerlingSignaleringen}`;
export const periode = gql`
    query periode($afspraakId: ID!) {
  periode(afspraakId: $afspraakId) {
    naam
    begin
    eind
  }
}
    `;
export const externeRegistraties = gql`
    query externeRegistraties($afspraakId: ID!) {
  externeRegistraties(afspraakId: $afspraakId) {
    aanwezigWaarnemingen {
      id
      ingevoerdDoor {
        ...ingevoerdDoor
      }
      leerling {
        id
      }
    }
    absentiemeldingen {
      ...absentieMeldingFields
      leerling {
        id
      }
    }
  }
}
    ${ingevoerdDoor}
${absentieMeldingFields}`;
export const signaleringenInstellingen = gql`
    query signaleringenInstellingen($medewerkerUuid: ID!) {
  signaleringenInstellingen(medewerkerUuid: $medewerkerUuid) {
    aantal
    verborgenVrijeVeldenIds
  }
}
    `;
export const cijferPeriodesVanLesgroep = gql`
    query cijferPeriodesVanLesgroep($lesgroepId: ID!) {
  cijferPeriodesVanLesgroep(lesgroepId: $lesgroepId) {
    ...cijferPeriodeFields
  }
}
    ${cijferPeriodeFields}`;
export const voortgangsdossiers = gql`
    query voortgangsdossiers($lesgroepId: ID!) {
  voortgangsdossiers(lesgroepId: $lesgroepId) {
    ...voortgangsdossierFields
  }
}
    ${voortgangsdossierFields}`;
export const getMentorDashboardResultatenContext = gql`
    query getMentorDashboardResultatenContext($leerlingId: ID!) {
  getMentorDashboardResultatenContext(leerlingId: $leerlingId) {
    ...mentorDashboardResultatenContextFields
  }
}
    ${mentorDashboardResultatenContextFields}`;
export const getMentorDashboardExamendossierVoorPlaatsing = gql`
    query getMentorDashboardExamendossierVoorPlaatsing($plaatsingId: ID!, $lichtingId: ID) {
  getMentorDashboardExamendossierVoorPlaatsing(
    plaatsingId: $plaatsingId
    lichtingId: $lichtingId
  ) {
    ...mentorDashboardExamenDossierFields
  }
}
    ${mentorDashboardExamenDossierFields}`;
export const getMentorDashboardVoortgangsdossierVoorLeerling = gql`
    query getMentorDashboardVoortgangsdossierVoorLeerling($leerlingId: ID!, $stamgroepId: ID) {
  getMentorDashboardVoortgangsdossierVoorLeerling(
    leerlingId: $leerlingId
    stamgroepId: $stamgroepId
  ) {
    ...mentorDashboardVoortgangsDossierFields
  }
}
    ${mentorDashboardVoortgangsDossierFields}`;
export const voortgangsdossierMatrixVanLesgroep = gql`
    query voortgangsdossierMatrixVanLesgroep($lesgroepId: ID!, $voortgangsdossierId: ID) {
  voortgangsdossierMatrixVanLesgroep(
    lesgroepId: $lesgroepId
    voortgangsdossierId: $voortgangsdossierId
  ) {
    id
    laatstGewijzigdDatum
    voortgangsdossier {
      ...voortgangsdossierFields
    }
    leerlingen {
      ...partialLeerling
      datumInLesgroepVoorOvernemenResultaten
      notitieboekToegankelijk
    }
    lesgroep {
      ...LesgroepFields
    }
    periodes {
      cijferPeriode {
        ...cijferPeriodeFields
      }
      resultaatkolommen {
        ...matrixResultaatkolomFields
      }
      advieskolommen {
        ...matrixResultaatkolomFields
      }
      periodeGemiddeldeKolom {
        ...matrixResultaatkolomFields
      }
      rapportGemiddeldeKolom {
        ...matrixResultaatkolomFields
      }
      rapportCijferkolom {
        ...matrixResultaatkolomFields
      }
      leerlingMissendeToetsen {
        leerlingUuid
        periode
        toetsafkorting
      }
      bevrorenStatus
    }
  }
}
    ${voortgangsdossierFields}
${partialLeerling}
${lesgroepFields}
${cijferPeriodeFields}
${matrixResultaatkolomFields}`;
export const leerlingVoortgangsdossiers = gql`
    query leerlingVoortgangsdossiers($lesgroepId: ID!, $leerlingId: ID!) {
  leerlingVoortgangsdossiers(lesgroepId: $lesgroepId, leerlingId: $leerlingId) {
    ...voortgangsdossierFields
  }
}
    ${voortgangsdossierFields}`;
export const resultaatLabelLijstenVanVestiging = gql`
    query resultaatLabelLijstenVanVestiging($vestigingId: ID!) {
  resultaatLabelLijstenVanVestiging(vestigingId: $vestigingId) {
    ...resultaatLabelLijstFields
  }
}
    ${resultaatLabelLijstFields}`;
export const toetsSoortenVanVestiging = gql`
    query toetsSoortenVanVestiging($vestigingId: ID!) {
  toetsSoortenVanVestiging(vestigingId: $vestigingId) {
    id
    naam
    defaultWeging
  }
}
    `;
export const voortgangsdossierKolomZichtbaarheid = gql`
    query voortgangsdossierKolomZichtbaarheid($medewerkerUuid: String!, $lesgroepId: ID!) {
  voortgangsdossierKolomZichtbaarheid(
    medewerkerUuid: $medewerkerUuid
    lesgroepId: $lesgroepId
  ) {
    A
    P
    r
  }
}
    `;
export const cijferhistorie = gql`
    query cijferhistorie($voortgangsdossierId: ID!, $lesgroepId: ID!, $cellId: String!) {
  cijferhistorie(
    voortgangsdossierId: $voortgangsdossierId
    lesgroepId: $lesgroepId
    cellId: $cellId
  ) {
    formattedResultaat
    formattedResultaatAfwijkendNiveau
    resultaatLabel
    resultaatLabelAfwijkendNiveau
    voldoende
    voldoendeAfwijkendNiveau
    toetsNietGemaakt
    vrijstelling
    datumInvoer
    rapportCijferEnOverschreven
    rapportCijferEnOverschrevenAfwijkendNiveau
    medewerker {
      voornaam
      tussenvoegsels
      achternaam
    }
  }
}
    `;
export const importeerbareResultatenVanLeerling = gql`
    query importeerbareResultatenVanLeerling($leerlingUUID: String!, $lesgroepId: ID!) {
  importeerbareResultatenVanLeerling(
    leerlingUUID: $leerlingUUID
    lesgroepId: $lesgroepId
  ) {
    periodeNummer
    importeerbareResultaten {
      toetskolom {
        code
        periode
        omschrijving
        type
        ... on IToetskolom {
          weging
        }
        ... on Deeltoetskolom {
          deeltoetsWeging
        }
      }
      resultaat {
        cellId
        herkansingsNummer
        formattedResultaat
        voldoende
        formattedResultaatAfwijkendNiveau
        voldoendeAfwijkendNiveau
        resultaatLabelAfwijkendNiveau {
          afkorting
          voldoende
        }
        resultaatLabel {
          afkorting
          voldoende
        }
        lesgroepId
      }
    }
  }
}
    `;
export const getMentorDashboardVakResultaten = gql`
    query getMentorDashboardVakResultaten($leerlingId: ID!, $vakId: ID!, $periode: Int!) {
  getMentorDashboardVakResultaten(
    leerlingId: $leerlingId
    vakId: $vakId
    periode: $periode
  ) {
    ...vakResultatenFields
  }
}
    ${vakResultatenFields}`;
export const getMentorDashboardSeResultaten = gql`
    query getMentorDashboardSEResultaten($plaatsingId: ID!, $vakId: ID!, $lichtingId: ID) {
  getMentorDashboardSEResultaten(
    plaatsingId: $plaatsingId
    vakId: $vakId
    lichtingId: $lichtingId
  ) {
    toetskolommen {
      ...geldendResultaatFields
    }
    toetsSoortGemiddeldeKolommen {
      toetssoortAfkorting
      toetssoortNaam
      geldendResultaat {
        ...geldendResultaatFields
      }
    }
  }
}
    ${geldendResultaatFields}`;
export const getMentorDashboardCeResultaten = gql`
    query getMentorDashboardCEResultaten($plaatsingId: ID!, $vakId: ID!, $lichtingId: ID) {
  getMentorDashboardCEResultaten(
    plaatsingId: $plaatsingId
    vakId: $vakId
    lichtingId: $lichtingId
  ) {
    score
    geldendResultaat {
      ...geldendResultaatFields
    }
  }
}
    ${geldendResultaatFields}`;
export const roosterDagen = gql`
    query roosterDagen($medewerkerId: String!, $jaar: Int!, $week: Int!) {
  roosterDagen(medewerkerId: $medewerkerId, jaar: $jaar, week: $week) {
    datum
    afspraken {
      ...RoosterAfspraakFields
      ...EigenAfspraakFields
    }
  }
}
    ${roosterAfspraakFields}
${eigenAfspraakFields}`;
export const currentVersion = gql`
    query currentVersion {
  currentVersion
}
    `;
export const stamgroep = gql`
    query stamgroep($id: ID!) {
  stamgroep(id: $id) {
    ...stamgroepFields
  }
}
    ${stamgroepFields}`;
export const sjabloonOverzichtView = gql`
    query sjabloonOverzichtView($medewerkerUuid: String!) {
  sjabloonOverzichtView(medewerkerUuid: $medewerkerUuid) {
    vaksectie {
      id
      uuid
      naam
    }
    sjablonen {
      ...basisSjabloonFields
      gesynchroniseerdeStudiewijzers {
        ...basisStudiewijzerFields
      }
    }
    categorieen {
      ...categorieFields
    }
  }
}
    ${basisSjabloonFields}
${basisStudiewijzerFields}
${categorieFields}`;
export const sjabloonOverzichtViewMetBijlagenQuery = gql`
    query sjabloonOverzichtViewMetBijlagenQuery($medewerkerUuid: String!) {
  sjabloonOverzichtView(medewerkerUuid: $medewerkerUuid) {
    vaksectie {
      id
      uuid
      naam
    }
    sjablonen {
      ...sjabloonFields
    }
    categorieen {
      ...categorieMetBijlagenFields
    }
  }
}
    ${sjabloonFields}
${categorieMetBijlagenFields}`;
export const sjabloon = gql`
    query sjabloon($id: ID!) {
  sjabloon(id: $id) {
    ...sjabloonFields
  }
}
    ${sjabloonFields}`;
export const sjabloonView = gql`
    query sjabloonView($sjabloon: ID!) {
  sjabloonView(sjabloon: $sjabloon) {
    sjabloon {
      ...sjabloonFields
    }
    weken {
      weeknummer
      label
      toekenningen {
        ...toekenningFields
      }
      vakanties {
        naam
      }
      gekoppeldWeeknummer
      periode {
        nummer
        begin
      }
    }
  }
}
    ${sjabloonFields}
${toekenningFields}`;
export const gesynchroniseerdeLesgroepen = gql`
    query gesynchroniseerdeLesgroepen($sjabloon: ID!) {
  gesynchroniseerdeLesgroepen(sjabloon: $sjabloon) {
    id
    naam
  }
}
    `;
export const vaksecties = gql`
    query vaksecties {
  vaksecties {
    id
    uuid
    naam
  }
}
    `;
export const sjablonenGekoppeldAanOudeStudiewijzers = gql`
    query sjablonenGekoppeldAanOudeStudiewijzers {
  sjablonenGekoppeldAanOudeStudiewijzers {
    id
    naam
    gesynchroniseerdeStudiewijzers {
      lesgroep {
        naam
      }
    }
  }
}
    `;
export const studiewijzerOverzichtView = gql`
    query studiewijzerOverzichtView($schooljaar: Int!, $medewerkerUuid: String!) {
  studiewijzerOverzichtView(
    schooljaar: $schooljaar
    medewerkerUuid: $medewerkerUuid
  ) {
    studiewijzers {
      ...studiewijzerFields
    }
    categorieen {
      id
      naam
      studiewijzers {
        ...studiewijzerFields
      }
      inEditMode @client
    }
  }
}
    ${studiewijzerFields}`;
export const synchronisatieStudiewijzerOverzichtView = gql`
    query synchronisatieStudiewijzerOverzichtView($schooljaren: [Int!]!, $medewerkerUuid: String!) {
  synchronisatieStudiewijzerOverzichtView(
    schooljaren: $schooljaren
    medewerkerUuid: $medewerkerUuid
  ) {
    studiewijzers {
      ...studiewijzerFields
    }
    categorieen {
      id
      naam
      studiewijzers {
        ...studiewijzerFields
      }
      inEditMode @client
    }
    schooljaar
  }
}
    ${studiewijzerFields}`;
export const studiewijzer = gql`
    query studiewijzer($id: ID!) {
  studiewijzer(id: $id) {
    ...studiewijzerFields
  }
}
    ${studiewijzerFields}`;
export const cijferPeriodes = gql`
    query cijferPeriodes($studiewijzer: ID!) {
  cijferPeriodes(studiewijzer: $studiewijzer) {
    ...cijferPeriodeFields
  }
}
    ${cijferPeriodeFields}`;
export const cijferPeriodeWekenVanLesgroep = gql`
    query cijferPeriodeWekenVanLesgroep($lesgroep: ID!) {
  cijferPeriodeWekenVanLesgroep(lesgroep: $lesgroep) {
    weeknummer
    periode {
      ...cijferPeriodeFields
    }
  }
}
    ${cijferPeriodeFields}`;
export const cijferPeriodeWekenMetVakantiesVanLesgroep = gql`
    query cijferPeriodeWekenMetVakantiesVanLesgroep($lesgroep: ID!, $studiewijzer: ID!) {
  cijferPeriodeWekenMetVakantiesVanLesgroep(
    lesgroep: $lesgroep
    studiewijzer: $studiewijzer
  ) {
    weeknummer
    periode {
      ...cijferPeriodeFields
    }
    vakantienaam
  }
}
    ${cijferPeriodeFields}`;
export const getLesgroepen = gql`
    query getLesgroepen($schooljaar: Int!, $medewerkerId: ID!) {
  lesgroepen(schooljaar: $schooljaar, medewerkerId: $medewerkerId) {
    ...LesgroepFields
  }
}
    ${lesgroepFields}`;
export const studiewijzerView = gql`
    query studiewijzerView($studiewijzer: ID!) {
  studiewijzerView(studiewijzer: $studiewijzer) {
    studiewijzer {
      ...studiewijzerFields
    }
    weken {
      weeknummer
      periode {
        id
        nummer
        begin
        eind
        isHuidig
      }
      toekenningen {
        ...toekenningFields
      }
      dagen {
        dag
        toekenningen {
          ...toekenningFields
        }
        afspraken {
          toekenningen {
            ...toekenningFields
          }
          afspraak {
            ...AfspraakFields
            ...AfspraakLesgroepenFields
            medewerkers {
              id
              voornaam
              tussenvoegsels
              achternaam
              initialen
              pasfoto
            }
          }
        }
        vakanties {
          naam
        }
      }
    }
  }
}
    ${studiewijzerFields}
${toekenningFields}
${afspraakFields}
${afspraakLesgroepenFields}`;
export const cachedStudiewijzeritem = gql`
    query cachedStudiewijzeritem($id: ID!) {
  studiewijzeritem(id: $id) @client {
    ...itemFields
    projectgroepen {
      ...projectgroepFields
    }
  }
}
    ${itemFields}
${projectgroepFields}`;
export const studiewijzeritem = gql`
    query studiewijzeritem($id: ID!) {
  studiewijzeritem(id: $id) {
    ...itemFields
    projectgroepen {
      ...projectgroepFields
    }
  }
}
    ${itemFields}
${projectgroepFields}`;
export const dagToekenningStudiewijzeritem = gql`
    query dagToekenningStudiewijzeritem($id: ID!) {
  dagToekenningStudiewijzeritem(id: $id) {
    ...itemFields
    projectgroepen {
      ...projectgroepFields
    }
  }
}
    ${itemFields}
${projectgroepFields}`;
export const lesgroepStudiewijzer = gql`
    query lesgroepStudiewijzer($lesgroepIds: [String!]!) {
  lesgroepStudiewijzers(lesgroepIds: $lesgroepIds) {
    ...basisStudiewijzerFields
  }
}
    ${basisStudiewijzerFields}`;
export const zwevendeLesitems = gql`
    query zwevendeLesitems($afspraakId: ID!) {
  zwevendeLesitems(afspraakId: $afspraakId) {
    ...toekenningMutationFields
  }
}
    ${toekenningMutationFields}`;
export const aantalZwevendeLesitems = gql`
    query aantalZwevendeLesitems($afspraakId: ID!) {
  aantalZwevendeLesitems(afspraakId: $afspraakId)
}
    `;
export const afspraakToekenningenVoorLesgroepen = gql`
    query afspraakToekenningenVoorLesgroepen($afspraakId: ID!, $lesgroepVanStudiewijzer: ID!) {
  afspraakToekenningenVoorLesgroepen(
    afspraakId: $afspraakId
    lesgroepVanStudiewijzer: $lesgroepVanStudiewijzer
  ) {
    studiewijzerId
    lesgroep {
      ...LesgroepFields
    }
    afspraakToekenningen {
      ...toekenningFields
    }
  }
}
    ${lesgroepFields}
${toekenningFields}`;
export const werkdrukVoorSelectie = gql`
    query werkdrukVoorSelectie($lesgroepIds: [ID!]!, $peildatum: LocalDate!) {
  werkdrukVoorSelectie(lesgroepIds: $lesgroepIds, peildatum: $peildatum) {
    weeknummer
    weekItems {
      studiewijzerItem {
        ...itemFields
      }
      leerlingUuids
      ingeplandOp
      lesgroepnaam
      vaknaam
      docenten
    }
    dagen {
      dag
      items {
        studiewijzerItem {
          ...itemFields
        }
        leerlingUuids
        ingeplandOp
        lesgroepnaam
        vaknaam
        docenten
      }
    }
    lesgroepen {
      lesgroep {
        ...LesgroepFields
      }
      leerlingen {
        ...partialLeerling
      }
      differentiatiegroepen {
        id
        naam
        kleur
        leerlingen {
          ...partialLeerling
        }
      }
    }
  }
}
    ${itemFields}
${lesgroepFields}
${partialLeerling}`;
export const werkdrukVoorMentorLeerlingen = gql`
    query werkdrukVoorMentorLeerlingen($leerlingIds: [ID!]!, $peildatum: LocalDate!) {
  werkdrukVoorMentorLeerlingen(leerlingIds: $leerlingIds, peildatum: $peildatum) {
    weeknummer
    weekItems {
      studiewijzerItem {
        ...itemFields
      }
      leerlingUuids
      ingeplandOp
      lesgroepnaam
      vaknaam
      docenten
    }
    dagen {
      dag
      items {
        studiewijzerItem {
          ...itemFields
        }
        leerlingUuids
        ingeplandOp
        lesgroepnaam
        vaknaam
        docenten
      }
    }
    lesgroepen {
      lesgroep {
        ...LesgroepFields
      }
      leerlingen {
        ...partialLeerling
      }
      differentiatiegroepen {
        id
        naam
        kleur
        leerlingen {
          ...partialLeerling
        }
      }
    }
  }
}
    ${itemFields}
${lesgroepFields}
${partialLeerling}`;