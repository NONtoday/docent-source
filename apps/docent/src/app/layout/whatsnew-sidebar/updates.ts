export interface WhatsNewUpdate {
    id: number;
    titel: string;
    text: string;
    detail?: string;
    unread?: boolean;
}

/***
 *    STAPPENPLAN UPDATES TOEVOEGEN:
 *
 * 1. update object toevoegen aan de updates array
 * 2. latestDevUpdateId updaten naar het laatste id
 */
export const latestDevUpdateId = 136;

export const whatsnewUpdates: WhatsNewUpdate[] = [
    {
        id: 136,
        titel: 'Inzicht in notities uit vorige schooljaren',
        text: `In het notitieboek van een leerling kun je nu eenvoudig notities uit eerdere schooljaren terugzoeken. Dit helpt je om een completer beeld van een leerling te krijgen. Zo kun je bijvoorbeeld snel checken of er incidenten zijn geweest vorig schooljaar, of bekijken of dat bepaald gedrag vorig jaar ook al speelde.`,
        detail: `
        <div class="text">
        <h1>Inzicht in notities uit vorige schooljaren</h1>
        <p>In het notitieboek van een leerling kun je nu eenvoudig notities uit eerdere schooljaren terugzoeken. Dit helpt je om een completer beeld van een leerling te krijgen. Zo kun je bijvoorbeeld snel checken of er incidenten zijn geweest vorig schooljaar, of bekijken of dat bepaald gedrag vorig jaar ook al speelde.</p>
        <p><img src="../../../assets/img/whatsnew/notities-schooljaren.png" width="100%" height="auto"></img></p>
        </div>
        `
    },
    {
        id: 135,
        titel: 'Leerlingoverzicht voor mentoren',
        text: `Met het leerlingoverzicht krijg je als mentor inzicht in actualiteiten en trends op het gebied van afwezigheid, registraties, resultaten en cijferontwikkeling van een mentorleerling. Waar het groepsoverzicht je helpt opvallende leerlingen te signaleren in de groep, gaat het leerlingoverzicht helpen de mentorleerling beter te begrijpen.
        <br><br><a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/22751366923025-Leerlingoverzicht-voor-mentoren" target="_blank">📄 Lees het uitleg artikel</a>
        <br><br><i>Ter info: deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i>
        `,
        detail: `
        <div class="text">
        <h1>Leerlingoverzicht voor mentoren</h1>
        <br>
        <a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/22751366923025-Leerlingoverzicht-voor-mentoren" target="_blank">📄 Lees het uitleg artikel</a>
        <br><br><i>Ter info: deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i></p>

        <p><img src="../../../assets/img/whatsnew/leerlingoverzicht.png" width="100%" height="auto"></img></p>
        <br/>
        <h3><p>💡 Enkele functies uitgelicht</p><h3>

        <p><h2>Inzicht in actuele registraties</h2></p>
        <p>Je ziet direct de actuele registraties per categorie binnen het ingestelde tijdsvak van de leerling. Ook kun je instellen welke registraties in beeld moeten zijn voor de leerling. Ook heb je direct zicht op indicaties, maatregelen en vastgeprikte notities.</p>
        <p><img src="../../../assets/img/whatsnew/leerlingoverzicht-inzicht-act-registraties.png" width="100%" height="auto"></img></p>

        <p><h2>Verdiepende statistieken en patronen</h2></p>
        <p>Verdiepende statistieken en patronen achter registraties geven je nieuwe inzichten. Zo zie je naast statistieken over totalen ook eenvoudig bij welke vakken en op welke momenten de registraties zijn gedaan. Daarnaast zie je ook of er toetsmomenten waren, welke maatregelen er lopen en kun je statistieken vergelijken door te navigeren naar eerdere tijdsvakken. </P>
        <p><img src="../../../assets/img/whatsnew/leerlingoverzicht-verdiepende.png" width="100%" height="auto"></img></p>

        <p><h2>Inzichten in resultaten</h2></p>
        <p>Je hebt een totaaloverzicht van hoe de mentorleerling er cijfermatig voor staat op basis van de rapportcijfers (R) en schoolexamen (SE) per vak. Zo zie je direct welke vakken er op niveau zijn of (extra) aandacht nodig hebben. Ook kun je eenvoudig gemiddelde per vak vergelijken met de stamgroep en parallelklassen</P>
        <p><img src="../../../assets/img/whatsnew/leerlingoverzicht-inzicht-in-resultaten.png" width="100%" height="auto"></img></p>

        <p><h2>Vaksamenvatting, cijfertrend en gemiste toetsen</h2></p>
        <p>Door te klikken op een vak krijg je een compacte samenvatting van het vak. Per vak zie je gemiddelden, gemiste toetsen en de cijfertrend. Naast alle toetsresultaten, zie je ook het aantal registraties voor het vak en de ingevoerde opmerking van de vakdocent voor die periode.</P>
        <p><img src="../../../assets/img/whatsnew/leerlingoverzicht-vaksamenvatting.png" width="100%" height="auto"></img></p>

        </div>
        `
    },
    {
        id: 134,
        titel: 'Altijd meest actuele resultaat op groepsoverzicht',
        text: `Op het groepsoverzicht van het mentordashboard wordt nu per vak het R-cijfer getoond van de periode waarin het laatste toetsresultaat is behaald. Hierdoor behoud je altijd een compleet overzicht, ook als er net een nieuwe periode is gestart. Daarnaast zijn ook registraties zonder vak zichtbaar gemaakt in het registratie vakoverzicht van een mentorleerling.`,
        detail: `
        <div class="text">
        <h1>Altijd meest actuele resultaat op groepsoverzicht</h1>
        <br>
        <p>Op het groepsoverzicht van het mentordashboard wordt nu per vak het R-cijfer getoond van de periode waarin het laatste toetsresultaat is behaald. Hierdoor behoud je altijd een compleet overzicht, ook als er net een nieuwe periode is gestart.</p>
        <p><img src="../../../assets/img/whatsnew/actueel-resultaat-groepsoverzicht.png" width="100%" height="auto"></img></p>
        <br>
        <b>Registraties zonder vak</b>
        <br>
        <p>In het registratie vakoverzicht van een mentorleerling worden nu ook registraties getoond die gedaan zijn op afspraken waarbij geen vak bekend is. Deze zijn in te zien in de rij 'Geen vak' onderaan de vakkenlijst.</p>
        <p><img src="../../../assets/img/whatsnew/registraties-zonder-vak.png" width="100%" height="auto"></img></p>
        </div>
        `
    },
    {
        id: 133,
        titel: 'Cijfertrends en laatste resultaten inzien',
        text: `In het groepsoverzicht voor mentoren zie je nu per leerling een algemene trendindicatie over recent behaalde resultaten in de voortgang- en examendossiers. Zo kun je direct zien of er cijfermatig een stijgende of dalende trend gaande is bij een leerling. Ook kun je inzien welke resultaten er zijn behaald, zodat je weet waar de trend op gebaseerd is.
        <i>Ter info: deze informatie is alleen zichtbaar voor mentoren en is onderdeel van een betaalde module. Vraag je applicatiebeheerder voor meer informatie.</i>`,
        detail: `
        <div class="text">
        <h1>Cijfertrends en laatste resultaten inzien</h1>
        <p>In het groepsoverzicht voor mentoren zie je nu per leerling een algemene trendindicatie over recent behaalde resultaten in de voortgang- en examendossiers. Zo kun je direct zien of er cijfermatig een stijgende of dalende trend gaande is bij een leerling. Ook kun je inzien welke resultaten er zijn behaald, zodat je weet waar de trend op gebaseerd is.</p>
        <b>Cijfertrend per leerling</b><br>
        <p>Op basis van de laatste resultaten is per leerling te zien of er cijfermatig een stijgende 🟢, stabiele ⚪️, dalende 🟠 of sterk dalende 🔴 ontwikkeling te zien is ten opzichte van alle resultaten dit schooljaar.</p>
        <p><img src="../../../assets/img/whatsnew/cijfertrend-per-leerling.png" width="100%" height="auto"></img></p>
        <br>
        <b>Laatste resultaten</b><br>
        <p>Onder de tab 'laatste resultaten' in de leerling-verdieping kun je de meest recent behaalde resultaten zien waar de cijfertrend op gebaseerd is. Afhankelijk van het totaal aantal resultaten dit schooljaar zijn dit er 10, 5 of 2. Klik op 'Laad eerdere resultaten' om alle eerder behaalde resultaten van dit schooljaar terug te zien.</p>
        <p><img src="../../../assets/img/whatsnew/laatste-resultaten.png" width="100%" height="auto"></img></p>
        <br>
        <b>Cijfertrend per vak</b><br>
        <p>In het resultatenoverzicht van een mentorleerling zie je nu ook de cijfertrend per vak. Zo heb je naast de gemiddeldes per vak, een extra indicator om in te schatten bij welke vakken het goed gaat of waar aandacht aan besteed moet worden.</p>
        <p><img src="../../../assets/img/whatsnew/cijfertrend-per-vak.png" width="100%" height="auto"></img></p>
        `
    },
    {
        id: 131,
        titel: 'Bijlagen aan notities toevoegen',
        text: `Het is nu mogelijk om bijlagen aan notities van leerlingen of groepen te hangen. Zo kun je documenten aan een notitie hangen die aanvullende informatie geven bij een notitie of bijvoorbeeld eenvoudig een plattegrond voor je groep met je collega's delen.`,
        detail: `
        <div class="text">
        <h1>Bijlagen aan notities toevoegen</h1>
        <p>Het is nu mogelijk om bijlagen aan notities van leerlingen of groepen te hangen. Zo kun je documenten aan een notitie hangen die aanvullende informatie geven bij een notitie of bijvoorbeeld eenvoudig een plattegrond voor je groep met je collega's delen. </p>

        <p><img src="../../../assets/img/whatsnew/bijlage-notities-toevoegen.png" width="100%" height="auto"></img></p>`
    },
    {
        id: 130,
        titel: 'Groepsoverzicht op mentordashboard voor individuele mentoren',
        text: `Het <b>groepsoverzicht</b> op het mentordashboard in Somtoday Docent is nu ook voor mentoren beschikbaar die mentor zijn van individuele mentorleerlingen uit verschillende stampgroepen.
        <br/><br/>
        Het <b>groepsoverzicht</b> geeft jou als mentor inzicht in actualiteit en trends op het gebied van registraties en resultaten binnen je mentorgroep, zodat je eenvoudig kunt signaleren welke mentorleerling jouw aandacht het hardst nodig heeft.</p>
        <a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/18524961760785-Mentordashboard-groepsoverzicht-" target="_blank">📄 Lees het uitleg artikel</a><br><br>
        <i>Ter info:<p>deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i>
        `,
        detail: `
        <div class="text">
        <h1>Groepsoverzicht op mentordashboard</h1>
        <p>Het <b>groepsoverzicht</b> op het mentordashboard in Somtoday Docent is nu ook voor mentoren beschikbaar die mentor zijn van individuele mentorleerlingen uit verschillende stampgroepen.
        <br/><br/>
        Het <b>groepsoverzicht</b> geeft jou als mentor inzicht in actualiteit en trends op het gebied van registraties en resultaten binnen je mentorgroep, zodat je eenvoudig kunt signaleren welke mentorleerling jouw aandacht het hardst nodig heeft.</p>
        <a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/18524961760785-Mentordashboard-groepsoverzicht-" target="_blank">📄 Lees de uitleg</a><br><br>
        <i>Ter info:<p>deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i>

        <p><img src="../../../assets/img/whatsnew/groepsoverzicht-overzicht.jpg" width="100%" height="auto"></img></p>

        <br/>
        <h3><p>💡 Inzicht in actuele registraties</p><h3>
        <br/>

        <h4>Inzicht in actuele registraties</h4>
        <p>Het groepsoverzicht bevat dezelfde informatie voor individuele mentorleerlingen als voor stamgroepen, met één belangrijk verschil: Bij het kiezen van een tijdsvak om inzicht te krijgen in de data en trends van de absentieregistratie van je leerlingen, kun je geen periode kiezen, omdat de periodes in lengtes kunnen verschillen bij mentorleerlingen uit verschillende stamgroepen. </p>
        <p><img src="../../../assets/img/whatsnew/inzicht-actuele-registraties.png" width="100%" height="auto"></img></p>

        </div>
        `
    },
    {
        id: 129,
        titel: 'Groepsoverzicht op mentordashboard',
        text: `Het groepsoverzicht op het mentordashboard in Somtoday Docent geeft jou als mentor inzicht in actualiteit en trends op het gebied van registraties en resultaten binnen je mentorgroep, zodat je eenvoudig kunt signaleren welke mentorleerling jouw aandacht het hardst nodig heeft.
        <a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/18524961760785-Mentordashboard-groepsoverzicht-" target="_blank">📄 Lees de uitleg</a><br><br>
        <i>Ter info:<p>deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i>
        `,
        detail: `
        <div class="text">
        <h1>Groepsoverzicht op mentordashboard</h1>
            <p>Het groepsoverzicht op het mentordashboard in Somtoday Docent geeft jou als mentor inzicht in actualiteit en trends op het gebied van registraties en resultaten binnen je mentorgroep, zodat je eenvoudig kunt signaleren welke mentorleerling jouw aandacht het hardst nodig heeft.</p>
        <a href="https://somtoday-servicedesk.zendesk.com/hc/nl/articles/18524961760785-Mentordashboard-groepsoverzicht-" target="_blank">📄 Lees de uitleg</a><br><br>
        <i>Ter info:<p>deze functionaliteit is alleen beschikbaar voor mentoren en is onderdeel van een betaalde module. Deze module moet geactiveerd zijn op jouw school om gebruik te kunnen maken van dit overzicht. Vraag je applicatiebeheerder voor meer informatie.</i>

        <p><img src="../../../assets/img/whatsnew/groepsoverzicht-overzicht.jpg" width="100%" height="auto"></img></p>

        <br/>
        <h3><p>💡Enkele functies uitgelicht</p><h3>
        <br/>

        <h4>Inzicht in actuele registraties</h4>
        <p>Je ziet direct welke leerlingen er qua aantal registraties en absentie opvallen binnen een ingesteld tijdsvak. Ook kun je zelf instellen vanaf hoeveel registraties leerlingen per registratiecategorie getoond mogen worden. </p>
        <p><img src="../../../assets/img/whatsnew/inzicht-actuele-registraties.png" width="100%" height="auto"></img></p>

        <h4>Verdiepende statistieken en patronen</h4>
        <p>Verdiepende statistieken en patronen achter registraties geven je nieuwe inzichten. Zo zie je naast statistieken over totalen ook eenvoudig bij welke vakken en op welke momenten in de week de meeste registraties worden gedaan. Daarnaast zie je ook of er toetsmomenten waren, welke maatregelen er lopen en kun je statistieken vergelijken door te navigeren naar eerdere tijdsvakken. </p>
        <p><img src="../../../assets/img/whatsnew/verdiepende-statistieken.png" width="100%" height="auto"></img></p>

        <h4>Inzichten in resultaten</h4>
        <p>Je hebt een totaaloverzicht over hoe mentorleerlingen er cijfermatig voor staan op basis van de rapportcijfers (R) en schoolexamen (SE) per vak. Het overzicht sorteert leerlingen automatisch over kolommen op basis van het aantal vakken (zwaar) onvoldoende. Je kunt zelf bijstellen welke cijferwaarde telt als (zwaar) onvoldoende en bij hoeveel vakken een leerling getoond moet worden in een kolom. Zo zie je direct welke leerlingen er op niveau zijn of (extra) aandacht nodig hebben.</p>
        <p><img src="../../../assets/img/whatsnew/inzicht-in-resultaten.png" width="100%" height="auto"></img></p>

        <h4>Vakoverzicht, cijfertrend en gemiste toetsen</h4>
        <p>Door te klikken op een leerling zie je een compact vakkenoverzicht. Per vak zie je advies, actueel gemiddelde (R of SE) en cijfertrend. Een cijfertrend laat zien of er een stijgende of dalende trend te zien is in de laatste behaalde resultaten ten opzichte van alle eerder behaalde resultaten voor het vak dit schooljaar.</p>
        <p><img src="../../../assets/img/whatsnew/vakoverzicht-cijfertrend-gemiste-toetsen.png" width="100%" height="auto"></img></p>

        <h4>Notitieboek bij de hand</h4>
        <p>Via het groepsoverzicht heb je ook het complete notitieboek van de gehele stamgroep bij de hand, zo heb je naast alle informatie op het groepsoverzicht ook alle actuele notities bij de hand.</p>
        <p><img src="../../../assets/img/whatsnew/notitieboek-bij-de-hand.png" width="100%" height="auto"></img></p>

        <h4>Doorontwikkeling</h4>
        <p>Tijdens de ontwikkeling hebben we veel waardevolle feedback mogen ontvangen van verschillende mentoren. Op basis hiervan worden er dit schooljaar veel nieuwe features toegevoegd om het mentordashboard als geheel verder te verrijken. Bekijk regelmatig het <a href="https://portal.productboard.com/somtodaydocent/1-somtoday-docent-ideeenbord" target="_blank">ideeënbord</a> voor de actuele planning. </p>

        </div>
        `
    }
];
