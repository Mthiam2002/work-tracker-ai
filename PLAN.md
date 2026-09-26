# Plan d'implémentation — Work Tracker (heures, salaire, bulletins de paie)

## 1. Résumé du projet

Application web personnelle (NextJS) permettant de :
- Pointer manuellement ses heures de travail (vacations de 12h, y compris de nuit)
- Calculer un salaire estimé (heures × taux horaire courant, basé sur le SMIC)
- Visualiser un calendrier mensuel des vacations
- Consulter un tableau de bord avec les totaux (heures + salaire) par semaine/mois/année
- Stocker et retrouver ses bulletins de paie (upload, triés par année)
- Rappeler le pointage en cas d'oubli (bannière in-app si aucune vacation depuis 7 jours)

Usage personnel (mono-utilisateur pour l'instant), authentification via Clerk.

---

## 2. Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js (App Router) |
| Authentification | Clerk (email + mot de passe généré / Google / Apple) |
| Base de données | Neon (PostgreSQL) |
| ORM | Prisma (recommandé pour Neon + Next.js) |
| Stockage fichiers (bulletins) | Vercel Blob, store **privé** (lecture via `/api/payslips/[id]`), PDF 10 Mo max |
| Hébergement | Vercel |
| Style | Tailwind CSS + mode sombre/clair (next-themes, toggle manuel) |
| Calendrier | Vue mensuelle **maison** (tranché : pas de lib externe) |
| E-mails | Resend + Vercel Cron quotidien (`/api/reminders/daily`, 8h UTC) |
| Push web | `web-push` + clés VAPID, réception dans le service worker |
| Export PDF | `pdfkit` (récap mensuel côté serveur) |
| Monitoring | Sentry (`@sentry/nextjs` v11, silencieux sans DSN) |
| PWA | Manifest + icônes maison + service worker minimal (cache assets, repli offline) |

---

## 3. Modèle de données (Neon / Prisma)

### `User`
Géré principalement par Clerk ; table locale pour les préférences et préférences de calcul.
- `id` (string, = Clerk userId), `email`, `createdAt` / `updatedAt`
- Majorations : `nightMult` (0.2), `sundayMult` (0.2), `holidayMult` (1.0), fenêtre nuit `nightStart` (21) / `nightEnd` (6)
- Rappels : `reminderEnabled` (true), `reminderThreshold` (7 j), `lastReminderAt` (anti-spam 7 j partagé e-mail + push)
- Conversion brut → net : `netRatio` (0.77, modifiable)

### `HourlyRate`
**Historisé** (plus de taux unique) : chaque modification crée une ligne.
- `id`, `userId` (FK), `rate` (float, € brut/h), `validFrom` (début de validité), `updatedAt`
- Le pointage utilise le taux en vigueur à la date de la vacation (`getRateForDate`) ; les vacations passées gardent leur `rateSnapshot`

### `WorkShift` (vacation)
- `id`
- `userId` (FK)
- `startDate` (date) — jour de début
- `startTime` (time)
- `endDate` (date) — jour de fin (peut différer de startDate si vacation de nuit)
- `endTime` (time)
- `breakMinutes` (int, optionnel) — pause informative, rémunérée donc NON déduite
- `totalHours` (decimal, calculé) — durée brute (endDateTime - startDateTime, pause incluse car rémunérée)
- `estimatedPay` (decimal, calculé) — totalHours × `rateSnapshot` + `premiumPay`
- `rateSnapshot` — taux figé au moment du pointage (historique SMIC)
- `nightHours` / `sundayHours` / `holidayHours` — ventilation des heures majorées
- `premiumPay` — montant des majorations (taux × heures × multiplicateurs cumulables)
- Net estimé affiché = brut × `User.netRatio` (calcul à l'affichage, non stocké)
- `createdAt` / `updatedAt`

### `Payslip` (bulletin de paie)
- `id`
- `userId` (FK)
- `year` (int) — pour le tri par année
- `month` (int, optionnel)
- `fileUrl` (string) — URL Vercel Blob
- `fileName` (string)
- `uploadedAt`

**Assomption (A2)** : `totalHours` est calculé automatiquement à l'enregistrement (endDateTime - startDateTime, pause incluse car rémunérée), pas besoin de le stocker en dur si vous préférez recalculer à la volée — mais le stocker facilite les agrégations du tableau de bord.

### `PushSubscription` (abonnement push web)
- `id`, `userId` (FK, cascade), `endpoint` (@unique), `p256dh`, `auth`, `createdAt`
- Un abonnement = un appareil ; nettoyage auto des expirés (410/404) par le cron

---

## 4. Pages / Routes (App Router)

```
/                        → landing / redirection vers /dashboard si connecté
/sign-in                 → Clerk
/sign-up                 → Clerk
/dashboard               → tableau de bord (totaux semaine/mois/année)
/calendar                → vue calendrier mensuel des vacations
/shifts/new               → formulaire de pointage (ajout d'une vacation)
/shifts/[id]/edit         → modification d'une vacation
/payslips                → liste des bulletins, filtrés par année
/payslips/upload          → upload d'un nouveau bulletin
/settings                → taux horaire (historisé), majorations, ratio brut→net, rappels e-mail/push
/api/payslips/[id]        → lecture sécurisée d'un bulletin (store privé, session + propriété vérifiées)
/api/exports/csv          → export CSV vacations (tout ou ?year=)
/api/exports/pdf          → récap PDF mensuel (?year=&month=)
/api/backup               → GET export JSON complet, POST restauration par fusion
/api/push/subscribe       → POST/DELETE abonnement push de l'appareil
/api/reminders/daily      → cron quotidien (Vercel, 8h UTC) : e-mail Resend + push, anti-spam 7 j
```

---

## 5. Flux utilisateur principaux

### A. Pointage d'une vacation
1. L'utilisateur va sur `/shifts/new`
2. Renseigne : date de début, heure de début, date de fin (si nuit), heure de fin, pause éventuelle
3. Le système calcule automatiquement `totalHours` et `estimatedPay`
4. Sauvegarde → redirection vers `/calendar` ou `/dashboard`
5. Possibilité de modifier/supprimer depuis le calendrier ou une liste

### B. Consultation du calendrier
1. Vue mensuelle, chaque jour avec une vacation affiche un badge (heures + montant)
2. Liste détail sous le calendrier (triée par date) avec boutons Modifier/Supprimer par vacation

### C. Tableau de bord
1. Trois cartes fixes : semaine en cours (lundi-dimanche), mois en cours, année en cours
2. Affichage par carte : total heures, paie brute + nette estimée, nombre de vacations
3. Graph 6 mois à modes Brut / Net / Heures + recherche texte et pagination des vacations

### D. Bulletins de paie
1. `/payslips/upload` → upload PDF (10 Mo max) vers Vercel Blob **privé**, saisie de l'année/mois associé
2. `/payslips` → liste groupée par année, lecture via `/api/payslips/[id]`, suppression (Blob + base)

### E. Rappels de pointage
1. Bannière in-app (layout protégé) si aucune vacation depuis le seuil (défaut 7 j, modifiable), CTA vers `/shifts/new`
2. E-mail Resend + notification push via cron quotidien (8h UTC), éligibilité = seuil atteint + aucun rappel depuis 7 j

### F. Salaire : majorations + net
1. `/settings` : taux historisé, multiplicateurs nuit/dimanche/férié + fenêtre nuit, ratio brut→net
2. Majoration = heures concernées × taux figé × multiplicateur (cumulables, ex. nuit + dimanche)
3. Net estimé = brut × ratio, affiché partout (jamais stocké)

### G. Exports & sauvegarde
1. `/exports` : récap PDF mensuel (12 derniers mois), CSV tout/par année, sauvegarde JSON complète
2. Restauration JSON par fusion (doublons ignorés, entrées invalides comptées, jamais d'écrasement)

### H. PWA
1. Manifest + icônes maison + service worker (assets en cache, repli offline, jamais les API/PDF)
2. Installable (standalone, `start_url: /dashboard`), notifications push reçues dans le SW

---

## 6. Étapes de développement (ordre recommandé)

1. **Setup projet** : Next.js + Tailwind + Prisma + connexion Neon
2. **Authentification** : intégration Clerk (email, Google, Apple), protection des routes
3. **Modèle de données** : migrations Prisma (`User`, `HourlyRate`, `WorkShift`, `Payslip`)
4. **Paramètres** : page `/settings` pour définir/modifier le taux horaire courant
5. **Pointage** : formulaire d'ajout de vacation + calcul automatique heures/salaire
6. **Édition/suppression** : modification et suppression d'une vacation existante
7. **Calendrier** : vue mensuelle affichant les vacations
8. **Tableau de bord** : cartes semaine/mois/année (brut + net), graph 6 mois multi-modes, recherche + pagination
9. **Bulletins de paie** : upload (Vercel Blob) + liste triée par année
10. **Thème** : mode sombre/clair
11. **Déploiement** : configuration Vercel + variables d'environnement (Clerk, Neon, Blob)
12. **Rappels** : bannière in-app d'oubli de pointage (seuil 7 jours)
13. **Export** : export CSV des vacations seules (date, horaires, nuit, pause, heures, paie brute + nette) via page dédiée `/exports` + API `/api/exports/csv` ; récap PDF mensuel via `/api/exports/pdf`
14. **Net configurable** : ratio brut → net modifiable dans `/settings` (`User.netRatio`, défaut 0.77), utilisé partout (dashboard, calendrier, exports)
15. **Recherche vacations** : composant `ShiftsExplorer` sur `/dashboard` (recherche texte + pagination 5/page via `getShiftsPage`)
16. **Sauvegarde JSON** : `/api/backup` (GET export complet, POST restauration par fusion) + section sur `/exports`
17. **Sentry** : `@sentry/nextjs` v11 silencieux sans DSN (`NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` optionnels)
18. **Rappels push** : VAPID + `PushSubscription` + toggle par appareil dans `/settings`, envoi via cron quotidien (anti-spam partagé avec l'e-mail), réception dans `sw.js`
19. **Majorations + taux historisé** : multiplicateurs nuit/dimanche/férié configurables, `rateSnapshot` par vacation, `getRateForDate`
20. **PWA** : manifest + icônes maison + service worker minimal + métadonnées installabilité

---

## 7. Assumptions retenues

- Édition/suppression directe des pointages, sans historique d'audit
- Calcul salaire = heures brutes (pause incluse, rémunérée) × taux figé au pointage + majorations nuit/dimanche/férié (multiplicateurs cumulables, configurables)
- Taux horaire **historisé** (`validFrom`) : les vacations passées gardent leur taux d'origine
- Net estimé = brut × ratio configurable (défaut 0.77), indicatif, jamais stocké
- Monitoring actif : Sentry `@sentry/nextjs` v11, silencieux sans `NEXT_PUBLIC_SENTRY_DSN`
- Bulletins : store Blob **privé**, PDF uniquement, 10 Mo max, pas de règle de rétention
- Rappels multi-canaux : bannière in-app + e-mail Resend + push web, seuil configurable, anti-spam 7 j partagé

## 8. Risques / points à surveiller

- Taux historisé : les vacations passées gardent leur taux, mais un changement de multiplicateurs n'est pas rétroactif (recalcul manuel via édition si besoin)
- Vacations de nuit affichées sur le jour de début dans le calendrier (badge `+1j`)
- Jours fériés : détectionFR statique côté calcul (à vérifier chaque année : lundi de Pâques, Ascension, etc.)
- Clés VAPID : toute rotation invalide les abonnements existants (réabonnement par appareil requis)
- Télémétrie bloquée par Brave/adblock : les erreurs client de ces navigateurs ne remontent pas dans Sentry
- Upload PDF limité à 10 Mo avec message explicite

---

**État : socle complet et déployé (pause en attendant le premier bulletin de paie). Pistes futures : rapprochement estimé vs réel, tests automatisés, import CSV, archivage annuel.**