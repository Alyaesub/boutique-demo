// app.js — helpers partagés par toutes les pages (vanilla JS, aucune dépendance)
'use strict';

const api = {
  async get(url) { const r = await fetch(url); return r.json(); },
  async post(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data };
  },
};

const euros = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

// --- Panier (côté client, localStorage) ------------------------------------
const Panier = {
  lire() { try { return JSON.parse(localStorage.getItem('panier') || '[]'); } catch (e) { return []; } },
  ecrire(p) { localStorage.setItem('panier', JSON.stringify(p)); Panier.majBadge(); },
  ajouter(produitId) {
    const p = Panier.lire();
    const l = p.find((x) => x.produitId === produitId);
    if (l) l.qte++; else p.push({ produitId, qte: 1 });
    Panier.ecrire(p);
  },
  retirer(produitId) { Panier.ecrire(Panier.lire().filter((x) => x.produitId !== produitId)); },
  vider() { Panier.ecrire([]); },
  total() { return Panier.lire().reduce((s, l) => s + l.qte, 0); },
  majBadge() {
    const el = document.querySelector('.cart-count');
    if (el) el.textContent = Panier.total();
  },
};

// --- En-tête commun (bandeau + nav) injecté sur chaque page -----------------
async function monterEntete(actif) {
  const sess = await api.get('/api/session');
  const who = sess.connecte
    ? `<a href="/compte" class="who">👤 ${sess.client.nom}</a> <a href="#" id="logout">Se déconnecter</a>`
    : `<a href="/connexion">Se connecter</a>`;

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="warn-banner">⚠️ <b>Environnement de démonstration volontairement vulnérable</b> — données 100% fictives, usage pédagogique uniquement</div>
    <nav class="nav">
      <a href="/" class="brand">Boutique<span>Démo</span></a>
      <a href="/">Boutique</a>
      <a href="/commercant">Vue commerçant</a>
      <span class="spacer"></span>
      <a href="/panier" class="badge-cart">🛒 Panier <span class="cart-count">0</span></a>
      ${who}
    </nav>
  `);

  Panier.majBadge();
  const lo = document.getElementById('logout');
  if (lo) lo.addEventListener('click', async (e) => { e.preventDefault(); await api.post('/api/logout'); location.href = '/'; });
  return sess;
}

// Badge de statut -> classe de couleur
function pillStatut(s) {
  const map = {
    'en préparation': 'gray', 'expédiée': 'blue', 'livrée': 'green',
    'aucun': 'gray', 'remboursée': 'red', 'en attente de retour': 'amber',
  };
  return `<span class="pill ${map[s] || 'gray'}">${s}</span>`;
}
