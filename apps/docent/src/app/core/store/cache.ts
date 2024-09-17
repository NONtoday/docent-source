import { InMemoryCache } from '@apollo/client/core';
import { HuiswerkType, InboxBericht, LeerlingoverzichtVakSamenvattingQueryVariables, Toekenning } from '@docent/codegen';
import { isDate, parseISO } from 'date-fns';
import { TypedTypePolicies } from '../../../generated/_apollo-helpers';
import possibleTypesData from '../../../generated/_fragment-types';
import { stringToColor } from '../../rooster-shared/utils/color-token-utils';
import { studiewijzerIcon } from '../../rooster-shared/utils/utils';

const readDateField = {
    read: (field: string) => {
        if (isDate(field)) {
            return field;
        }
        return field ? parseISO(field) : null;
    }
};

const toekenningIdFields = (t: Readonly<Toekenning>) => (t.isStartInleverperiode ? ['id', 'isStartInleverperiode'] : ['id']);
const isNieuwField = { read: (cachedValue: boolean) => cachedValue ?? false };

const typePolicies: TypedTypePolicies = {
    Query: {
        fields: {
            afspraak(queryResult, { args, toReference }) {
                return queryResult ?? toReference({ __typename: 'Afspraak', id: args!.id });
            },
            studiewijzer(queryResult, { args, toReference }) {
                return queryResult ?? toReference({ __typename: 'Studiewijzer', id: args!.id });
            },
            sjabloon(queryResult, { args, toReference }) {
                return queryResult ?? toReference({ __typename: 'Sjabloon', id: args!.id });
            },
            studiewijzeritem(queryResult, { args, toReference }) {
                return queryResult ?? toReference({ __typename: 'Studiewijzeritem', id: args!.id });
            },
            inleveropdrachten: {
                merge: false
            },
            inleveropdrachtenVanSchooljaarAankomend: {
                merge: false
            },
            inleveropdrachtenVanSchooljaarVerlopen: {
                merge: false
            },
            lesplanningRoosterPreview: {
                merge: false
            },
            sjabloonOverzichtView: {
                merge: false
            },
            inleveringenConversatie: {
                merge: false
            },
            berichtenVanMedewerker: {
                merge: (existing: InboxBericht[], incoming: InboxBericht[], { args }) => {
                    const merged = existing ? existing.slice(0) : [];
                    if (args) {
                        for (let i = 0; i < incoming.length; ++i) {
                            merged[Number(args.offset) + i] = incoming[i];
                        }
                    } else {
                        merged.push(...incoming);
                    }

                    // push null voor changeDetection
                    merged.push(<any>null);
                    return merged;
                },
                read(existing: InboxBericht[]) {
                    return existing;
                }
            },
            differentiatiegroepen: {
                merge: false
            },
            maatregeltoekenningen: {
                merge: false
            },
            leerlingoverzichtVakSamenvatting: {
                keyArgs: ['leerlingId', 'vakId', 'periode'] as const satisfies (keyof LeerlingoverzichtVakSamenvattingQueryVariables)[],
                read(existing, { args }) {
                    if (args?.isExamen) {
                        return existing;
                    }
                    return existing?.resultaten ? existing : undefined;
                }
            }
        }
    },
    Mutation: {
        fields: {
            updateInleveringenStatus: {
                merge: false
            }
        }
    },
    Afspraak: {
        fields: {
            isNu: {
                read(_, { readField }) {
                    const begin: Readonly<Date | undefined> = readField('begin');
                    const eind: Readonly<Date | undefined> = readField('eind');
                    const currentTime = new Date();

                    return currentTime >= begin! && currentTime <= eind!;
                }
            },
            begin: readDateField,
            eind: readDateField,
            lesgroepen: { merge: false },
            bijlagen: { merge: false },
            participantenEigenAfspraak: { merge: false }
        }
    },
    HerhalendeAfspraak: {
        fields: {
            beginDatum: readDateField,
            eindDatum: readDateField
        }
    },
    Lesgroep: {
        fields: {
            color: {
                read: (_, { readField }) => stringToColor(readField('naam')!) ?? 'primary'
            }
        }
    },
    Stamgroep: {
        fields: {
            color: {
                read: (_, { readField }) => stringToColor(readField('naam')!) ?? 'primary'
            }
        }
    },
    LeerlingRegistratie: {
        fields: {
            dirty: {
                read: (cachedValue) => cachedValue ?? false
            },
            overigeVrijVeldWaarden: { merge: false }
        }
    },
    LeerlingSignalering: {
        fields: {
            afspraken: { merge: false }
        }
    },
    Bijlage: {
        fields: {
            isSelected: {
                read: (cachedValue) => cachedValue ?? false
            },
            differentiatiegroepen: { merge: false },
            differentiatieleerlingen: { merge: false }
        }
    },
    BijlageMap: {
        fields: {
            isSelected: {
                read: (cachedValue) => cachedValue ?? false
            },
            isNew: {
                read: (cachedValue) => cachedValue ?? false
            },
            bijlagen: { merge: false },
            differentiatiegroepen: { merge: false },
            differentiatieleerlingen: { merge: false }
        }
    },
    VaksectieView: {
        keyFields: ['vaksectie', ['uuid'] as any],
        fields: {
            sjablonen: { merge: false },
            categorieen: { merge: false }
        }
    },
    SchoolInterventie: {
        fields: {
            begindatum: readDateField,
            einddatum: readDateField
        }
    },
    StudiewijzerAfspraak: {
        keyFields: ['afspraak', ['id'] as any],
        fields: {
            toekenningen: { merge: false }
        }
    },
    SjabloonCategorie: {
        fields: {
            sjablonen: { merge: false },
            inEditMode: {
                read: (cachedValue) => cachedValue ?? false
            }
        }
    },
    StudiewijzerCategorie: {
        fields: {
            studiewijzers: { merge: false },
            inEditMode: {
                read: (cachedValue) => cachedValue ?? false
            }
        }
    },
    Signalering: {
        fields: {
            afspraken: { merge: false }
        }
    },
    Signaleringen: {
        fields: {
            vrijVeldSignaleringen: { merge: false }
        }
    },
    Studiewijzeritem: {
        fields: {
            isNieuw: isNieuwField,
            icon: {
                read(_, { readField }) {
                    const type: HuiswerkType | undefined = readField('huiswerkType');
                    return studiewijzerIcon(type!);
                }
            },
            projectgroepen: { merge: false },
            ingeplandOp: readDateField
        }
    },
    Projectgroep: {
        fields: {
            leerlingen: { merge: false }
        }
    },
    Sjabloon: {
        fields: {
            isNieuw: isNieuwField,
            gesynchroniseerdeStudiewijzers: {
                merge: false
            }
        }
    },
    Inleverperiode: {
        fields: {
            begin: readDateField,
            eind: readDateField
        }
    },
    Periode: {
        fields: {
            begin: readDateField,
            eind: readDateField
        }
    },
    CijferPeriode: {
        fields: {
            begin: readDateField,
            eind: readDateField
        }
    },
    LesplanNavigatieKeuze: {
        fields: {
            datum: readDateField
        }
    },
    AbsentieMelding: {
        fields: {
            tijdstip: readDateField,
            beginDatumTijd: readDateField,
            eindDatumTijd: readDateField
        }
    },
    Inlevering: {
        fields: {
            inleverdatum: readDateField,
            wijzigingsDatum: readDateField,
            plagiaatInfo: { merge: false }
        }
    },
    RoosterDag: {
        fields: {
            datum: readDateField,
            afspraken: { merge: false }
        }
    },
    Studiewijzer: {
        fields: {
            gesynchroniseerdeSjablonen: { merge: false }
        }
    },
    StudiewijzerDag: {
        fields: {
            dag: readDateField
        }
    },
    Registratie: {
        fields: {
            beginDatumTijd: readDateField,
            eindDatumTijd: readDateField
        }
    },
    RegistratiePeriode: {
        fields: {
            vanaf: readDateField,
            tot: readDateField
        }
    },
    Notitie: {
        fields: {
            createdAt: readDateField,
            lastModifiedAt: readDateField,
            gelezenOp: readDateField
        }
    },
    NotitieboekMenuLeerlingItem: {
        fields: {
            leerlingGroepNamen: {
                merge: (existing, incoming) => (incoming ? incoming : existing)
            },
            leerlingStamgroepNaam: {
                merge: (existing, incoming) => (incoming ? incoming : existing)
            }
        }
    },
    NotitieStreamWeek: {
        fields: {
            start: readDateField,
            eind: readDateField
        }
    },
    LesRegistratie: {
        fields: {
            laatstGewijzigdDatum: readDateField
        }
    },
    WeekToekenning: {
        keyFields: toekenningIdFields as any,
        fields: {
            differentiatiegroepen: { merge: false },
            differentiatieleerlingen: { merge: false }
        }
    },
    DagToekenning: {
        keyFields: toekenningIdFields as any,
        fields: {
            datum: readDateField,
            differentiatiegroepen: { merge: false },
            differentiatieleerlingen: { merge: false }
        }
    },
    AfspraakToekenning: {
        keyFields: toekenningIdFields as any,
        fields: {
            aangemaaktOpDatumTijd: readDateField,
            afgerondOpDatumTijd: readDateField,
            differentiatiegroepen: { merge: false },
            differentiatieleerlingen: { merge: false }
        }
    },
    Boodschap: {
        fields: {
            verzendDatum: readDateField
        }
    },
    Differentiatiegroep: {
        fields: {
            leerlingen: { merge: false }
        }
    },
    Leerling: {
        fields: {
            differentiatiegroepen: { merge: false },
            datumInLesgroepVoorOvernemenResultaten: readDateField,
            geboortedatum: readDateField
        }
    },
    WerkdrukStudiewijzeritem: {
        fields: {
            ingeplandOp: readDateField
        }
    },
    MatrixResultaatkolom: {
        keyFields: ['id', 'herkansingsNummer', 'lesgroepId'],
        fields: {
            resultaten: { merge: false }
        }
    },
    Resultaat: {
        keyFields: ['cellId', 'lesgroepId']
    },
    IToetskolom: {
        fields: {
            datumToets: readDateField
        }
    },
    VakDetailToetsresultaat: {
        fields: {
            geplandeDatumToets: readDateField,
            laatstGewijzigdDatum: readDateField
        }
    },
    VoortgangsdossierMatrix: {
        fields: {
            laatstGewijzigdDatum: readDateField,
            leerlingen: { merge: false }
        }
    },
    HistorischResultaat: {
        fields: {
            datumInvoer: readDateField
        }
    },
    MaatregelToekenning: {
        fields: {
            maatregelDatum: readDateField
        }
    },
    PeriodeAdviesKolom: {
        fields: {
            datumVan: readDateField,
            datumTot: readDateField
        }
    },
    MentordashboardOverzichtPeriodeOptie: {
        fields: {
            vanafDatum: readDateField,
            totDatum: readDateField
        }
    },
    GroepsoverzichtRegistratiesWrapper: {
        fields: {
            vanafDatum: readDateField,
            totDatum: readDateField
        }
    },
    LeerlingoverzichtRegistratiesResponse: {
        fields: {
            vanafDatum: readDateField,
            totDatum: readDateField
        }
    },
    RecentResultaat: {
        fields: {
            laatstGewijzigdDatum: readDateField
        }
    }
};

export const inMemoryCache = new InMemoryCache({
    possibleTypes: possibleTypesData.possibleTypes,
    typePolicies
});
