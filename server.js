// ============================================================================
//  server.js — Boutique Démo (VOLONTAIREMENT VULNÉRABLE)
// ----------------------------------------------------------------------------
//  Outil de démonstration sécurité. NE JAMAIS déployer à côté d'un vrai
//  service en production. Données 100% fictives (voir data.js).
//
//  Deux failles intégrées, activables/désactivables via le "mode sécurisé" :
//    1) IDOR  — contrôle d'accès cassé sur les commandes (fuite de données).
//    2) LOGIQUE — fraude au remboursement auto-approuvé sans retour.
//
//  Lancement :  node server.js        (failles actives, défaut)
//               SECURE=1 node server.js  (démarre en version corrigée)
// ============================================================================

'use strict';

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { store, totalCommande, reset } = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- Mini-session par cookie (sans dépendance externe) ----------------------
function lireCookie(req, nom) {
  const brut = req.headers.cookie || '';
  const trouve = brut.split(';').map((c) => c.trim()).find((c) => c.startsWith(nom + '='));
  return trouve ? decodeURIComponent(trouve.split('=').slice(1).join('=')) : null;
}

// Middleware : rattache req.client à partir du cookie de session.
app.use((req, res, next) => {
  const token = lireCookie(req, 'sid');
  const clientId = token ? store.sessions[token] : null;
  req.client = clientId ? store.clients.find((c) => c.id === clientId) : null;
  next();
});

function exigeConnexion(req, res, next) {
  if (!req.client) return res.status(401).json({ erreur: 'Vous devez être connecté.' });
  next();
}

// Représentation publique d'un client (jamais le mot de passe).
function clientPublic(c) {
  return { id: c.id, email: c.email, nom: c.nom, telephone: c.telephone, adresse: c.adresse };
}

// ============================================================================
//  API — Authentification & session
// ============================================================================

app.get('/api/session', (req, res) => {
  res.json({ connecte: !!req.client, client: req.client ? clientPublic(req.client) : null, modeSecurise: store.modeSecurise });
});

app.post('/api/register', (req, res) => {
  const { email, motdepasse, nom, telephone, adresse } = req.body || {};
  if (!email || !motdepasse || !nom) return res.status(400).json({ erreur: 'Email, mot de passe et nom sont requis.' });
  if (store.clients.some((c) => c.email.toLowerCase() === String(email).toLowerCase()))
    return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email.' });

  const client = {
    id: store.prochainClientId++,
    email, motdepasse, nom,
    telephone: telephone || '',
    adresse: adresse || '',
  };
  store.clients.push(client);
  ouvrirSession(res, client.id);
  res.json({ client: clientPublic(client) });
});

app.post('/api/login', (req, res) => {
  const { email, motdepasse } = req.body || {};
  const client = store.clients.find((c) => c.email.toLowerCase() === String(email || '').toLowerCase());
  if (!client || client.motdepasse !== motdepasse)
    return res.status(401).json({ erreur: 'Identifiants invalides.' });
  ouvrirSession(res, client.id);
  res.json({ client: clientPublic(client) });
});

app.post('/api/logout', (req, res) => {
  const token = lireCookie(req, 'sid');
  if (token) delete store.sessions[token];
  res.setHeader('Set-Cookie', 'sid=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});

function ouvrirSession(res, clientId) {
  const token = crypto.randomBytes(24).toString('hex');
  store.sessions[token] = clientId;
  res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
}

// ============================================================================
//  API — Catalogue & commandes
// ============================================================================

app.get('/api/products', (req, res) => res.json(store.produits));

// Liste des commandes DU CLIENT CONNECTÉ (correct : filtré par propriétaire).
app.get('/api/orders', exigeConnexion, (req, res) => {
  const miennes = store.commandes
    .filter((c) => c.clientId === req.client.id)
    .map((c) => ({ id: c.id, date: c.date, statut: c.statut, remboursement: c.remboursement, total: totalCommande(c), nbArticles: c.articles.length }));
  res.json(miennes);
});

// Création de commande à partir du panier (envoyé par le front).
app.post('/api/orders', exigeConnexion, (req, res) => {
  const panier = (req.body && req.body.panier) || [];
  if (!Array.isArray(panier) || panier.length === 0)
    return res.status(400).json({ erreur: 'Panier vide.' });

  const articles = [];
  for (const ligne of panier) {
    const p = store.produits.find((x) => x.id === Number(ligne.produitId));
    if (!p) continue;
    const qte = Math.max(1, Math.min(99, Number(ligne.qte) || 1));
    articles.push({ produitId: p.id, nom: p.nom, qte, prix: p.prix });
  }
  if (articles.length === 0) return res.status(400).json({ erreur: 'Aucun produit valide dans le panier.' });

  const cmd = {
    id: store.prochainCommandeId++,
    clientId: req.client.id,
    date: new Date().toISOString().slice(0, 10),
    livraison: { nom: req.client.nom, telephone: req.client.telephone, email: req.client.email, adresse: req.client.adresse },
    articles,
    statut: 'en préparation',
    remboursement: 'aucun',
    marchandiseRetournee: false,
  };
  store.commandes.push(cmd);
  res.json({ id: cmd.id });
});

// ----------------------------------------------------------------------------
//  >>> FAILLE 1 — IDOR (contrôle d'accès cassé) <<<
//  Détail d'une commande par son identifiant.
//  Le serveur vérifie que l'utilisateur est CONNECTÉ, mais PAS que la
//  commande lui appartient. En changeant l'id (1043 -> 1042), un client
//  voit la commande d'un autre : nom, adresse, téléphone, email, contenu.
//
//  Le "mode sécurisé" (store.modeSecurise) rétablit le contrôle de propriété.
// ----------------------------------------------------------------------------
app.get('/api/orders/:id', exigeConnexion, (req, res) => {
  const id = Number(req.params.id);
  const cmd = store.commandes.find((c) => c.id === id);
  if (!cmd) return res.status(404).json({ erreur: 'Commande introuvable.' });

  if (store.modeSecurise && cmd.clientId !== req.client.id) {
    // ✅ Correctif : on refuse l'accès à la commande d'autrui.
    return res.status(403).json({ erreur: "Accès refusé : cette commande ne vous appartient pas." });
  }

  // ⚠️ En mode vulnérable, on renvoie la commande SANS vérifier le propriétaire.
  res.json({
    id: cmd.id,
    date: cmd.date,
    statut: cmd.statut,
    remboursement: cmd.remboursement,
    marchandiseRetournee: cmd.marchandiseRetournee,
    livraison: cmd.livraison,              // <-- données personnelles qui fuient
    articles: cmd.articles,
    total: totalCommande(cmd),
    aMoi: cmd.clientId === req.client.id,  // indicateur pour la démo (avant/après)
  });
});

// Marquer une commande comme "livrée" (raccourci de démo).
app.post('/api/orders/:id/deliver', exigeConnexion, (req, res) => {
  const cmd = trouverCommandeDuClient(req, res);
  if (!cmd) return;
  cmd.statut = 'livrée';
  res.json({ ok: true, statut: cmd.statut });
});

// ----------------------------------------------------------------------------
//  >>> FAILLE 2 — LOGIQUE MÉTIER (fraude au remboursement) <<<
//  Le remboursement est auto-approuvé : l'argent repart vers le client
//  sans aucune vérification du retour de la marchandise. Le client garde
//  le produit ET récupère l'argent.
//
//  Le "mode sécurisé" transforme la demande en "en attente de retour" :
//  aucun argent n'est rendu tant que le commerçant n'a pas constaté le retour.
// ----------------------------------------------------------------------------
app.post('/api/orders/:id/refund', exigeConnexion, (req, res) => {
  const cmd = trouverCommandeDuClient(req, res);
  if (!cmd) return;
  if (cmd.statut !== 'livrée')
    return res.status(400).json({ erreur: 'Le remboursement n’est possible qu’après livraison.' });
  if (cmd.remboursement === 'remboursée')
    return res.status(400).json({ erreur: 'Commande déjà remboursée.' });

  if (store.modeSecurise) {
    // ✅ Correctif : demande enregistrée, mais AUCUN argent rendu. Le
    //    commerçant doit valider le retour avant tout remboursement.
    cmd.remboursement = 'en attente de retour';
    return res.json({ ok: true, remboursement: cmd.remboursement, montant: 0, message: 'Demande enregistrée. Remboursement conditionné au retour de la marchandise.' });
  }

  // ⚠️ Mode vulnérable : on rembourse immédiatement, sans exiger le retour.
  cmd.remboursement = 'remboursée';
  cmd.marchandiseRetournee = false; // le client ne renvoie rien
  res.json({ ok: true, remboursement: cmd.remboursement, montant: totalCommande(cmd), message: 'Remboursement approuvé automatiquement.' });
});

// Helper : récupère une commande en EXIGEANT qu'elle appartienne au client.
//  (Les actions d'écriture sont, elles, correctement protégées : la faille
//   d'accès ne concerne volontairement que la lecture du détail.)
function trouverCommandeDuClient(req, res) {
  const id = Number(req.params.id);
  const cmd = store.commandes.find((c) => c.id === id);
  if (!cmd) { res.status(404).json({ erreur: 'Commande introuvable.' }); return null; }
  if (cmd.clientId !== req.client.id) { res.status(403).json({ erreur: 'Action non autorisée.' }); return null; }
  return cmd;
}

// ============================================================================
//  API — Vue commerçant (impact business)
// ============================================================================
app.get('/api/merchant/summary', (req, res) => {
  const commandes = store.commandes.map((c) => ({
    id: c.id, client: c.livraison.nom, date: c.date, statut: c.statut,
    remboursement: c.remboursement, marchandiseRetournee: c.marchandiseRetournee,
    total: totalCommande(c),
  }));

  // Pertes = commandes remboursées dont la marchandise n'est PAS revenue.
  const fraudes = commandes.filter((c) => c.remboursement === 'remboursée' && !c.marchandiseRetournee);
  const perte = fraudes.reduce((s, c) => s + c.total, 0);
  const enAttente = commandes.filter((c) => c.remboursement === 'en attente de retour');

  res.json({
    modeSecurise: store.modeSecurise,
    commandes,
    perteTotale: perte,
    nbFraudes: fraudes.length,
    idsFraudes: fraudes.map((c) => c.id),
    nbEnAttente: enAttente.length,
  });
});

// ============================================================================
//  API — Mode sécurisé (toggle avant/après) & réinitialisation démo
// ============================================================================
app.get('/api/mode', (req, res) => res.json({ modeSecurise: store.modeSecurise }));

app.post('/api/mode', (req, res) => {
  store.modeSecurise = !!(req.body && req.body.securise);
  res.json({ modeSecurise: store.modeSecurise });
});

app.post('/api/reset', (req, res) => {
  const secu = store.modeSecurise; // on conserve le mode courant
  reset();
  store.modeSecurise = secu;
  res.json({ ok: true });
});

// ============================================================================
//  Pages (front statique) + routes "jolies URL"
// ============================================================================
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

const page = (f) => (req, res) => res.sendFile(path.join(__dirname, 'public', f));
app.get('/', page('index.html'));
app.get('/panier', page('panier.html'));
app.get('/connexion', page('connexion.html'));
app.get('/compte', page('compte.html'));
app.get('/compte/commande/:id', page('commande.html'));
app.get('/commercant', page('commercant.html'));

app.listen(PORT, () => {
  const mode = store.modeSecurise ? 'SÉCURISÉ (corrigé)' : 'VULNÉRABLE';
  console.log('\n  Boutique Démo — serveur démarré');
  console.log(`  →  http://localhost:${PORT}`);
  console.log(`  →  Mode actuel : ${mode}`);
  console.log('  ⚠  Environnement de démonstration volontairement vulnérable. Données fictives.\n');
});
