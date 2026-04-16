# 💰 Lias veckopeng

En premium, mobil-först Progressive Web App (PWA) designad för att göra hantering av veckopeng rolig, lärorik och givande. Byggd med en estetik som blandar spelvärlden med banktjänster, hjälper den barn att lära sig om att spendera, ge och spara inför sina drömmar.

---

## 🌟 Upplevelsen

### För barnet (Lia)
Appen är designad för att vara färgstark, interaktiv och uppmuntrande:

*   **De tre hinkarna**: 
    *   🛍️ **Spendera**: Pengar för veckans nöjen och godsaker.
    *   🎁 **Ge bort**: Pengar för att hjälpa andra (t.ex. Hundstallet, WWF, Barncancerfonden).
    *   🏦 **Spara**: Pengar som läggs undan för långsiktiga sparmål.
*   **Automatisk lönedag**: Varje fredag kl. 16:00 sätter appen automatiskt in veckopengen (60 kr uppdelat som 40/10/10) med en firande animation.
*   **Drömmål**: Skapa "Drömmar" med egna bilder och målsättningar. Se framstegsmätaren fyllas i takt med att **Spara**-hinken växer.
*   **Hjältedonations**: När **Ge bort**-hinken når 100 kr låses en speciell donationsknapp upp med beskrivningar av vilken skillnad pengarna gör för den valda välgörenhetsorganisationen.
*   **Visuell glädje**: Konfettiregn vid lönedag, bekräftade donationer och när ett drömmål nås till 100%.
*   **Fullständig historik**: En skrollbar lista över alla transaktioner grupperade per vecka.
*   **Mörkt läge**: En snygg inställning för användning under kvällstid.

### För föräldern
Föräldern behåller kontrollen genom ett dolt admin-gränssnitt:

*   **Dolt admin-tillträde**: Nås via `/admin`-routen eller kugghjulsikonen i instrumentpanelen.
*   **PIN-skydd**: Skyddas av en enkel 4-siffrig PIN-kod (`1234` som standard) för att förhindra oavsiktliga ändringar.
*   **Justering av saldo**: Lägg till eller dra av pengar manuellt från valfri hink (t.ex. vid utförda sysslor eller större inköp).
*   **Återställ timer**: Återställ veckotimern vid behov för testning eller manuell synkronisering.

---

## 🏗️ Teknisk arkitektur

### Teknikstack
-   **Frontend**: [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
-   **Tillstånd (State)**: [Pinia](https://pinia.vuejs.org/) med modulär butiksstruktur
-   **Backend**: [Firebase Firestore](https://firebase.google.com/docs/firestore) för data & [Auth](https://firebase.google.com/docs/auth) för säkerhet
-   **Persistens**: [VueUse](https://vueuse.org/) `useLocalStorage` för robust offline-stöd
-   **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) för installerbarhet och service workers
-   **Animationer**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
-   **Lokalisering**: [vue-i18n](https://vue-i18n.intlify.dev/) (Svenska som modersmål)

### Butiksstruktur (Stores)
-   `allowance.ts`: Hanterar saldon i hinkar, transaktioner och logik för insättningar.
-   `dreams.ts`: Hanterar sparmål och bilddata (lagras som base64).
-   `theme.ts`: Hanterar persistens för ljust/mörkt läge.
-   `auth.ts`: Hanterar Firebase-inloggning.

### Strategi för synkronisering
Appen använder en **Write-Through Cache**-strategi:
1.  Allt tillstånd sparas omedelbart i `localStorage` för omedelbar respons offline.
2.  Asynkron synkronisering till Firestore sker i bakgrunden.
3.  Vid appstart laddas data först från `localStorage` (snabbt), och uppdateras sedan från Firestore (pålitligt).

---

## 🚀 Installation & Utveckling

### Förutsättningar
-   Node.js (v20+ rekommenderas)
-   Ett Firebase-projekt

### Installation
1.  Klona lagringsplatsen och installera beroenden:
    ```sh
    npm install
    ```
2.  **Firebase-konfiguration**: 
    -   Kopiera ditt konfigurationsobjekt från Firebase Console.
    -   Klistra in det i `scripts/pasted_secret_config.js`.
    -   Kör hjälpskriptet för att generera `.env`-filen:
        ```sh
        npm run generate-env
        ```

### Utveckling
```sh
npm run dev
```

### Testning & Validering
Projektet använder en strikt valideringspipeline:
```sh
npm run validate   # Kör Lint -> Type-check -> Unit Tests -> Build
```
-   **Enhetstester**: `npm run test:unit` (Vitest). Inkluderar fullständiga mockar för Firebase och tidskritisk logik för insättningar.
-   **Typ-kontroll**: `npm run type-check` (vue-tsc).
-   **Linting**: `npm run lint` (ESLint).

---

## 🔮 Framtida planer & idéer

*   **Sysslosystem**: En dedikerad flik för "Uppgifter" där Lia kan tjäna extra pengar genom att slutföra överenskomna sysslor hemma.
*   **Ränta**: Små månatliga "räntebonusar" i **Spara**-hinken för att lära ut kraften i ränta-på-ränta.
*   **Fotogalleri**: Ett sätt att arkivera uppfyllda drömmar med ett foto på den faktiska prylen när den väl är inköpt.
*   **Rösthälsningar**: Integration med en lokal AI-modell för att ge uppmuntrande rösthälsningar eller "ekonomitips" med en rolig röst.
*   **Budgetplanering**: Ett enkelt verktyg för att "öronmärka" pengar inom Spendera-hinken för specifika kommande händelser (t.ex. bio med kompisar).
*   **Flera barn**: Möjlighet för föräldrar att växla mellan olika barnprofiler med separata saldon.

---

*Skapad med ❤️ till Lia.*