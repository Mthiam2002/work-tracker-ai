# Plan d'implémentation — Work Tracker (heures, salaire, bulletins de paie)

## 1. Résumé du projet

Application web personnelle (NextJS) permettant de :
- Pointer manuellement ses heures de travail (vacations de 12h, y compris de nuit)
- Calculer un salaire estimé (heures × taux horaire courant, basé sur le SMIC)
- Visualiser un calendrier mensuel des vacations
- Consulter un tableau de bord avec les totaux (heures + salaire) par semaine/mois/année
- Stocker et retrouver ses bulletins de paie (upload, triés par année)

Usage personnel (mono-utilisateur pour l'instant), authentification via Clerk.

---

## 2. Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js (App Router) |
| Authentification | Clerk (email + mot de passe généré / Google / Apple) |
| Base de données | Neon (PostgreSQL) |
| ORM | Prisma (recommandé pour Neon + Next.js) |
| Stockage fichiers (bulletins) | Vercel Blob (par défaut — simple avec Next.js/Vercel) |
| Hébergement | Vercel |
| Style | Tailwind CSS + mode sombre/clair (next-themes) |
| Calendrier | react-day-picker ou FullCalendar (à trancher en phase de dev) |

---

## 3. Modèle de données (Neon / Prisma)

### `User`
Géré principalement par Clerk ; table locale minimale pour lier les données.
- `id` (string, = Clerk userId)
- `createdAt`

### `HourlyRate`
Un seul taux "courant" pour la v1 (pas d'historique).
- `id`
- `userId` (FK)
- `rate` (decimal) — taux horaire en €
- `updatedAt`

### `WorkShift` (vacation)
- `id`
- `userId` (FK)
- `startDate` (date) — jour de début
- `startTime` (time)
- `endDate` (date) — jour de fin (peut différer de startDate si vacation de nuit)
- `endTime` (time)
- `breakMinutes` (int, optionnel) — pause informative, rémunérée donc NON déduite
- `totalHours` (decimal, calculé) — durée brute (endDateTime - startDateTime, pause incluse car rémunérée)
- `estimatedPay` (decimal, calculé) — totalHours × taux courant au moment du calcul
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
/settings                → modification du taux horaire courant, thème
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
1. Vue mensuelle, chaque jour avec une vacation affiche un badge (ex: heures ou montant)
2. Clic sur un jour → détail de la vacation, avec boutons modifier/supprimer

### C. Tableau de bord
1. Sélecteur de période (semaine / mois / année)
2. Affichage : total heures, total salaire estimé, nombre de vacations
3. Éventuellement un graphique simple (évolution mensuelle)

### D. Bulletins de paie
1. `/payslips/upload` → upload PDF vers Vercel Blob, saisie de l'année/mois associé
2. `/payslips` → liste groupée par année, téléchargement/consultation

---

## 6. Étapes de développement (ordre recommandé)

1. **Setup projet** : Next.js + Tailwind + Prisma + connexion Neon
2. **Authentification** : intégration Clerk (email, Google, Apple), protection des routes
3. **Modèle de données** : migrations Prisma (`User`, `HourlyRate`, `WorkShift`, `Payslip`)
4. **Paramètres** : page `/settings` pour définir/modifier le taux horaire courant
5. **Pointage** : formulaire d'ajout de vacation + calcul automatique heures/salaire
6. **Édition/suppression** : modification et suppression d'une vacation existante
7. **Calendrier** : vue mensuelle affichant les vacations
8. **Tableau de bord** : agrégations et totaux par semaine/mois/année
9. **Bulletins de paie** : upload (Vercel Blob) + liste triée par année
10. **Thème** : mode sombre/clair
11. **Déploiement** : configuration Vercel + variables d'environnement (Clerk, Neon, Blob)

---

## 7. Assumptions retenues

- Édition/suppression directe des pointages, sans historique d'audit
- Calcul salaire v1 = heures brutes (pause incluse, rémunérée) × taux horaire, sans majoration nuit/dimanche/férié
- Un seul taux horaire courant, pas d'historique de taux
- Pas de Sentry/monitoring en v1
- Pas de règle de rétention/taille de fichiers pour les bulletins
- Stockage fichiers via Vercel Blob (à confirmer si préférence pour UploadThing)

## 8. Risques / points à surveiller

- Si le taux horaire change plus tard (revalorisation SMIC), les vacations passées resteront calculées avec l'ancien taux enregistré au moment du pointage — sauf recalcul manuel
- Les vacations de nuit à cheval sur deux jours nécessitent une logique d'affichage claire dans le calendrier (sur quel jour apparaît la vacation ?)
- Prévoir une limite de taille raisonnable pour l'upload des PDF même sans règle stricte, pour éviter les erreurs silencieuses

---

**Prêt pour l'étape suivante : initialisation du repo NextJS et premier scaffold ?**