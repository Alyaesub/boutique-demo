// ============================================================================
//  data.js — Stockage EN MÉMOIRE + données 100% FICTIVES
// ----------------------------------------------------------------------------
//  Rien ici n'est réel : noms, adresses, téléphones, e-mails sont inventés
//  pour la démonstration. Aucune base externe, tout vit en RAM et se
//  réinitialise à chaque redémarrage du serveur (ou via reset()).
// ============================================================================

'use strict';

// --- Catalogue produits -----------------------------------------------------
const PRODUITS = [
  { id: 1, nom: 'Casque audio sans fil',   prix: 89.0,  emoji: '🎧', desc: 'Réduction de bruit, 30h d’autonomie.' },
  { id: 2, nom: 'Sac à dos urbain',        prix: 59.0,  emoji: '🎒', desc: 'Compartiment ordinateur 15 pouces.' },
  { id: 3, nom: 'Gourde isotherme 750ml',  prix: 24.0,  emoji: '🧴', desc: 'Garde chaud 12h / froid 24h.' },
  { id: 4, nom: 'Lampe de bureau LED',     prix: 39.0,  emoji: '💡', desc: 'Intensité et température réglables.' },
  { id: 5, nom: 'Carnet de notes A5',      prix: 12.5,  emoji: '📓', desc: 'Papier 120g, 200 pages pointillées.' },
  { id: 6, nom: 'T-shirt coton bio',       prix: 19.0,  emoji: '👕', desc: 'Coupe droite, coton certifié.' },
  { id: 7, nom: 'Coque téléphone',         prix: 15.0,  emoji: '📱', desc: 'Antichoc, bords surélevés.' },
  { id: 8, nom: 'Mug céramique',           prix: 14.0,  emoji: '☕', desc: '350ml, passe au lave-vaisselle.' },
];

// --- Comptes clients fictifs ------------------------------------------------
//  NB : mots de passe en clair = SIMPLIFICATION DE DÉMO (ce n'est pas une
//  des 2 failles ciblées, mais c'est à ne jamais faire en production).
const CLIENTS_INITIAUX = [
  {
    id: 1, email: 'lucas@demo.test', motdepasse: 'demo1234',
    nom: 'Lucas Bonnet', telephone: '06 12 34 56 78',
    adresse: '14 rue des Lilas, 31000 Toulouse',
  },
  {
    id: 2, email: 'marie@demo.test', motdepasse: 'demo1234',
    nom: 'Marie Lefebvre', telephone: '06 98 76 54 32',
    adresse: '7 allée des Oliviers, 34000 Montpellier',
  },
  {
    id: 3, email: 'thomas@demo.test', motdepasse: 'demo1234',
    nom: 'Thomas Girard', telephone: '07 44 55 66 77',
    adresse: '22 avenue de la Gare, 13006 Marseille',
  },
  {
    id: 4, email: 'sophie@demo.test', motdepasse: 'demo1234',
    nom: 'Sophie Moreau', telephone: '06 11 22 33 44',
    adresse: '3 impasse du Moulin, 06000 Nice',
  },
];

// --- Commandes fictives pré-remplies ----------------------------------------
//  Chaque commande embarque un "snapshot" des coordonnées de livraison :
//  c'est précisément ce qui fuite via la faille IDOR.
const COMMANDES_INITIALES = [
  {
    id: 1040, clientId: 2, date: '2026-10-28',
    livraison: { nom: 'Marie Lefebvre', telephone: '06 98 76 54 32', email: 'marie@demo.test', adresse: '7 allée des Oliviers, 34000 Montpellier' },
    articles: [ { produitId: 1, nom: 'Casque audio sans fil', qte: 1, prix: 89.0 } ],
    statut: 'livrée', remboursement: 'aucun', marchandiseRetournee: false,
  },
  {
    id: 1041, clientId: 3, date: '2026-10-30',
    livraison: { nom: 'Thomas Girard', telephone: '07 44 55 66 77', email: 'thomas@demo.test', adresse: '22 avenue de la Gare, 13006 Marseille' },
    articles: [ { produitId: 2, nom: 'Sac à dos urbain', qte: 1, prix: 59.0 }, { produitId: 3, nom: 'Gourde isotherme 750ml', qte: 2, prix: 24.0 } ],
    statut: 'livrée', remboursement: 'aucun', marchandiseRetournee: false,
  },
  {
    id: 1042, clientId: 4, date: '2026-11-02',
    livraison: { nom: 'Sophie Moreau', telephone: '06 11 22 33 44', email: 'sophie@demo.test', adresse: '3 impasse du Moulin, 06000 Nice' },
    articles: [ { produitId: 4, nom: 'Lampe de bureau LED', qte: 1, prix: 39.0 }, { produitId: 8, nom: 'Mug céramique', qte: 1, prix: 14.0 } ],
    statut: 'expédiée', remboursement: 'aucun', marchandiseRetournee: false,
  },
  {
    id: 1043, clientId: 2, date: '2026-11-05',
    livraison: { nom: 'Marie Lefebvre', telephone: '06 98 76 54 32', email: 'marie@demo.test', adresse: '7 allée des Oliviers, 34000 Montpellier' },
    articles: [ { produitId: 6, nom: 'T-shirt coton bio', qte: 3, prix: 19.0 } ],
    statut: 'livrée', remboursement: 'aucun', marchandiseRetournee: false,
  },
  {
    id: 1044, clientId: 3, date: '2026-11-08',
    livraison: { nom: 'Thomas Girard', telephone: '07 44 55 66 77', email: 'thomas@demo.test', adresse: '22 avenue de la Gare, 13006 Marseille' },
    articles: [ { produitId: 5, nom: 'Carnet de notes A5', qte: 2, prix: 12.5 } ],
    statut: 'livrée', remboursement: 'aucun', marchandiseRetournee: false,
  },
  {
    id: 1045, clientId: 1, date: '2026-11-12',
    livraison: { nom: 'Lucas Bonnet', telephone: '06 12 34 56 78', email: 'lucas@demo.test', adresse: '14 rue des Lilas, 31000 Toulouse' },
    articles: [ { produitId: 7, nom: 'Coque téléphone', qte: 1, prix: 15.0 }, { produitId: 3, nom: 'Gourde isotherme 750ml', qte: 1, prix: 24.0 } ],
    statut: 'livrée', remboursement: 'aucun', marchandiseRetournee: false,
  },
];

// --- Store en mémoire -------------------------------------------------------
const store = {
  produits: PRODUITS,
  clients: [],
  commandes: [],
  sessions: {},        // token -> clientId
  prochainClientId: 1,
  prochainCommandeId: 1,
  // Mode sécurisé : false = failles actives (défaut démo), true = version corrigée
  modeSecurise: process.env.SECURE === '1',
};

// Calcule le total TTC d'une commande à partir de ses articles.
function totalCommande(cmd) {
  return cmd.articles.reduce((s, a) => s + a.prix * a.qte, 0);
}

// (Re)initialise entièrement les données fictives. Pratique entre deux démos.
function reset() {
  store.clients = CLIENTS_INITIAUX.map((c) => ({ ...c }));
  store.commandes = COMMANDES_INITIALES.map((c) => ({
    ...c,
    livraison: { ...c.livraison },
    articles: c.articles.map((a) => ({ ...a })),
  }));
  // Les sessions sont volontairement conservées : réinitialiser les données
  // entre deux démos ne doit pas déconnecter le présentateur.
  store.prochainClientId = Math.max(...store.clients.map((c) => c.id)) + 1;
  store.prochainCommandeId = Math.max(...store.commandes.map((c) => c.id)) + 1;
}

reset();

module.exports = { store, totalCommande, reset };
