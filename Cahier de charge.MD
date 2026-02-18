# [cite_start]CAHIER DES CHARGES [cite: 1]
# [cite_start]Application de Gestion de Stock - Atelier de Soudure [cite: 2]
### [cite_start]Application Web + Android (APK) [cite: 3]

| Information | Détails |
| :--- | :--- |
| **Version** | [cite_start]2.0 [cite: 4] |
| **Date** | [cite_start]04/01/2026 [cite: 4] |
| **Statut** | [cite_start]En cours de validation [cite: 4] |
| **Plateforme cible** | [cite_start]Web + Android [cite: 4] |

> [cite_start]**Document confidentiel** [cite: 5]

---

## [cite_start]1. Contexte et Présentation du Projet [cite: 14]

### [cite_start]1.1 Contexte [cite: 15]
* [cite_start]Le projet s'inscrit dans la modernisation de la gestion des stocks d'un atelier de soudure[cite: 16].
* [cite_start]Actuellement, aucun outil informatique n'est utilisé, ce qui freine la gestion des approvisionnements[cite: 17].

### [cite_start]1.2 Problématique actuelle [cite: 18]
* [cite_start]Absence de visibilité en temps réel sur les stocks[cite: 19].
* [cite_start]Impossibilité de tracer les mouvements de stock (entrées/sorties)[cite: 19].
* [cite_start]Risque de rupture de stock non anticipé[cite: 19].
* [cite_start]Difficulté à identifier les responsables et pas d'historique de consommation[cite: 20, 21].

### [cite_start]1.3 Objectifs du projet [cite: 22]
* [cite_start]Centraliser les informations dans une base de données[cite: 24].
* [cite_start]Fournir une APK Android pour chaque opérateur[cite: 25].
* [cite_start]Offrir un tableau de bord pour visualiser l'état des stocks en temps réel[cite: 26, 27].
* [cite_start]Alerte visuelle pour les stocks bas et notifications automatisées via Telegram et Email[cite: 28, 29].

### [cite_start]1.4 Plateformes cibles [cite: 30]
* [cite_start]**Android (APK)** : Support principal pour téléphones et tablettes[cite: 31].
* [cite_start]**Web (Navigateur)** : Support secondaire pour PC, Mac, Linux[cite: 31].
* [cite_start]**iOS** : Hors périmètre[cite: 31].

---

## [cite_start]2. Périmètre Fonctionnel [cite: 34]

### [cite_start]2.1 Types de matières premières gérées [cite: 35]
* [cite_start]**Tubes** : Rond, Carré, Rectangulaire (ex: Ø50mm, 40x40mm)[cite: 37].
* [cite_start]**Tôles** : Plate, Perforée, Striée (ex: 2mm, 3mm d'épaisseur)[cite: 37].
* [cite_start]**Profilés** : Cornière, IPN, UPN (ex: $40\times40$, IPN 100)[cite: 37].
* [cite_start]**Baguettes soudure** : Électrodes, Fil MIG/MAG (ex: Ø2.5mm)[cite: 37].

### [cite_start]2.2 Unités de mesure [cite: 38]
* [cite_start]**Tubes et profilés** : Barres de 6 mètres[cite: 40].
* [cite_start]**Tôles** : Feuilles (Grand/Petit format)[cite: 40].
* [cite_start]**Baguettes** : Paquets / Unités[cite: 40].

### [cite_start]2.3 Système d'alertes de stock [cite: 41]
| Indicateur | Seuil | Signification |
| :--- | :--- | :--- |
| **VERT** | > 5 unités | [cite_start]Stock suffisant[cite: 43]. |
| **ORANGE** | 1 à 5 unités | [cite_start]Stock bas - Prévoir commande[cite: 43]. |
| **ROUGE** | 0 unité | [cite_start]Rupture de stock - Action urgente[cite: 43]. |

---

## [cite_start]3. Application Mobile Android [cite: 46]

### [cite_start]3.1 Approche technique [cite: 47]
* [cite_start]Développement en Progressive Web App (PWA) convertie en APK via Trusted Web Activity (TWA)[cite: 48].
* [cite_start]Avantages : Code unique, mises à jour automatiques et installation via fichier APK sans Play Store[cite: 49, 50, 51, 52].

### [cite_start]3.2 Connexion persistante [cite: 53]
* [cite_start]Utilisation de tokens JWT stockés de manière sécurisée (durée de 30 jours)[cite: 55].
* [cite_start]Connexion automatique après la première authentification[cite: 55].
* [cite_start]Déconnexion uniquement manuelle ou par révocation administrative[cite: 55].

### [cite_start]3.3 Prérequis techniques [cite: 67, 70]
* [cite_start]**OS** : Android 7.0 (Nougat) minimum[cite: 68].
* [cite_start]**Connexion** : Internet requise (WiFi ou mobile)[cite: 70].
* [cite_start]**Espace** : Moins de 10 Mo[cite: 70].
* [cite_start]**Mode hors-ligne** : Non supporté[cite: 70].

---

## [cite_start]4. Gestion des Utilisateurs [cite: 74]

### [cite_start]4.1 Rôles et permissions [cite: 75]
* [cite_start]**Administrateur** (1 compte) : Accès complet, gestion des comptes, révocation des sessions, paramétrage et exports[cite: 77, 79, 81, 82, 85].
* [cite_start]**Utilisateur** (3 comptes) : Entrées/sorties, consultation, recherche et accès à son propre historique[cite: 77, 88, 89, 90, 92].

---

## [cite_start]5. Fonctionnalités Détaillées [cite: 97]

### [cite_start]5.1 Dashboard et Gestion [cite: 104, 109]
* [cite_start]**Dashboard** : Vue synthétique, compteur d'alertes, 10 derniers mouvements et actions rapides[cite: 106, 108].
* [cite_start]**Catalogue** : Gestion des références par l'admin (ajout, modif, désactivation)[cite: 110, 111, 112, 113].
* [cite_start]**Mouvements** : Enregistrement des entrées et sorties avec saisie obligatoire de la raison[cite: 114, 116, 117, 120].
* [cite_start]**Historique** : Traçabilité complète filtrable avec export CSV/PDF pour l'admin[cite: 122, 123, 124].

---

## [cite_start]6. Intégrations Externes (n8n) [cite: 133]

### [cite_start]6.1 Rapport hebdomadaire Email [cite: 135]
* [cite_start]Envoyé tous les lundis à 08h00 via Gmail[cite: 136].
* [cite_start]Contenu : État des stocks, alertes, ruptures $(stock=0)$ et Top 5 des consommations[cite: 138, 139, 140, 142].

### [cite_start]6.2 Bot Telegram interactif [cite: 143]
* [cite_start]Commandes : `/stock` (interroger une matière), `/alertes` (lister les urgences), `/resume` (état global)[cite: 146].

---

## [cite_start]7. Architecture Technique [cite: 152]

### [cite_start]7.1 Infrastructure et Stack [cite: 155, 156]
* [cite_start]**Hébergeur** : Hostinger VPS (Ubuntu 24.04), IP 168.231.84.15[cite: 154].
* [cite_start]**Stack** : React.js (Frontend), Node.js/Express (Backend), PostgreSQL (Base de données)[cite: 157].
* [cite_start]**Conteneurisation** : Docker & Docker Compose[cite: 157].
* [cite_start]**API REST** : Endpoints pour l'authentification, le stock, les alertes et les mouvements[cite: 167, 168, 170, 173, 176].

---

## [cite_start]8. Sécurité [cite: 179]
* [cite_start]Mots de passe hashés avec **bcrypt**[cite: 181].
* [cite_start]Protection des données : BDD accessible uniquement en local, backups quotidiens et protection contre les injections SQL[cite: 186, 187, 189].
* [cite_start]Sécurité API : Rate limiting et clé API dédiée pour n8n[cite: 192, 193].

---

## [cite_start]9. Planning de Réalisation [cite: 197]
1. [cite_start]Développement Backend et BDD[cite: 199].
2. [cite_start]Développement Frontend PWA[cite: 199].
3. [cite_start]Intégration authentification persistante[cite: 199].
4. [cite_start]Déploiement VPS (Docker)[cite: 199].
5. [cite_start]Génération APK Android[cite: 199].
6. [cite_start]Workflows n8n et tests finaux[cite: 199, 202].

---

## [cite_start]10. Annexes - Base de données [cite: 214, 215]
* [cite_start]**materials** : id, category_id, name, type, dimensions, unit, quantity, alert_threshold, active[cite: 219].
* [cite_start]**movements** : id, material_id, user_id, type (IN/OUT), quantity, reason, created_at[cite: 221].
* [cite_start]**sessions** : id, user_id, token, device_info, created_at, expires_at, revoked[cite: 228].