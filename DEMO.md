# Script de démo — à dérouler devant un prospect non technique

Objectif : en **5 minutes**, rendre tangible pourquoi la sécurité de leur site compte.
Public = dirigeant / fondateur. On ne fait **pas** un cours : on montre un impact concret,
en langage métier (données clients, argent, confiance).

**Avant de commencer** (hors écran partagé si possible) :
`node server.js`, ouvrir http://localhost:3000, se connecter avec `lucas@demo.test` / `demo1234`.
Vérifier que la **Vue commerçant** est en mode vulnérable (case décochée). Au besoin,
« Réinitialiser la démo ».

---

## Accroche (20 s)

> « Voici une boutique en ligne tout à fait banale. Je suis connecté comme un client
> normal, avec mon compte. Je vais vous montrer deux problèmes qu’on retrouve très
> souvent sur de vrais sites — et ce qu’ils coûtent. »

---

## Démo 1 — La fuite de données clients (≈ 1 min 30)

**Manipulation :**
1. **Mes commandes** → ouvrir une de mes commandes. Montrer l’adresse dans la barre :
   `…/compte/commande/1045`.
2. « Mon numéro de commande, c’est ce chiffre dans l’adresse. Regardez ce qui se passe
   si je le change… » → cliquer **« ◀ Commande n−1 »** (ou éditer `1045` → `1042`).
3. S’arrêter sur l’écran rouge : nom, adresse, téléphone, email **d’un autre client**.

**Phrases clés :**
> « Je ne suis pas informaticien, je n’ai rien piraté : j’ai juste changé un chiffre dans
> l’adresse. Et j’accède aux coordonnées complètes de vos autres clients. »

**Impact business (ce qui parle à un dirigeant) :**
- Fuite de **données personnelles** → obligation RGPD, risque de plainte CNIL, **amende**.
- **Perte de confiance** client, bad buzz, atteinte à l’image.
- Un concurrent ou un curieux peut **aspirer tout votre fichier clients**.

---

## Démo 2 — La fraude au remboursement (≈ 1 min 30)

**Manipulation :**
1. Sur **une de mes commandes livrées** → « Demander un remboursement ».
2. Montrer le message : **remboursé immédiatement, marchandise non retournée**.
3. Aller en **Vue commerçant** → pointer la **perte sèche** (gros chiffre rouge) et la
   ligne « marchandise non retournée ».

**Phrases clés :**
> « Le client clique, il est remboursé automatiquement… mais personne n’a vérifié qu’il
> a renvoyé le produit. Il garde l’article **et** récupère l’argent. »

**Impact business :**
- **Perte financière directe**, répétable à l’échelle (10, 100 clients…).
- Ce n’est pas un bug technique : c’est une **règle de gestion manquante** dans le parcours.
- Invisible tant qu’on ne regarde pas les chiffres → ça saigne en silence.

---

## Le retournement — « et voici corrigé » (≈ 1 min)

Dans la **Vue commerçant**, cocher **« Mode sécurisé (corrigé) »**, puis **refaire les
deux manipulations** :

1. Rechanger le numéro de commande → **« Accès refusé »** (écran vert). « Là, le site
   vérifie que la commande vous appartient vraiment. »
2. Redemander un remboursement → **« en attente de retour »**, la perte commerçant retombe
   à **0 €**. « L’argent ne part qu’une fois le produit revenu. »

**Phrase de clôture :**
> « La différence entre les deux, ce n’est pas de la magie : ce sont deux vérifications
> au bon endroit. C’est exactement le type de point que je cherche — et corrige — quand
> j’audite un site. »

---

## Rappels pour le présentateur

- Garder le ton **factuel**, pas anxiogène : on montre, on chiffre, on rassure avec le correctif.
- Ne pas entrer dans le code sauf demande explicite. Le public retient **données + argent**.
- Rester honnête sur le périmètre : *« ceci est une maquette ; un audit réel couvre bien
  plus de points, mais le principe est le même. »*
- Entre deux prospects : **« Réinitialiser la démo »** et **décocher** le mode sécurisé.
