async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      `Falha na comunicação com o servidor (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function fetchCatalogSpells(forceRefresh = false) {
  const query = forceRefresh ? '?refresh=true' : '';
  return requestJson(`/api/spells${query}`);
}

export function fetchLibrarySummary() {
  return requestJson('/api/library/summary');
}

export function fetchFavorites() {
  return requestJson('/api/favorites');
}

export function addFavoriteSpell(spell) {
  return requestJson('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({
      index: spell?.index,
      spell,
    }),
  });
}

export function removeFavoriteSpell(apiIndex) {
  return requestJson(`/api/favorites/${encodeURIComponent(apiIndex)}`, {
    method: 'DELETE',
  });
}

export function fetchGrimoires() {
  return requestJson('/api/grimoires');
}

export function fetchGrimoireById(grimoireId) {
  return requestJson(`/api/grimoires/${grimoireId}`);
}

export function createGrimoire({ name, description }) {
  return requestJson('/api/grimoires', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export function updateGrimoire(grimoireId, { name, description }) {
  return requestJson(`/api/grimoires/${grimoireId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  });
}

export function deleteGrimoire(grimoireId) {
  return requestJson(`/api/grimoires/${grimoireId}`, {
    method: 'DELETE',
  });
}

export function addSpellToGrimoire(grimoireId, spell) {
  return requestJson(`/api/grimoires/${grimoireId}/spells`, {
    method: 'POST',
    body: JSON.stringify({
      index: spell?.index,
      spell,
    }),
  });
}

export function removeSpellFromGrimoire(grimoireId, apiIndex) {
  return requestJson(
    `/api/grimoires/${grimoireId}/spells/${encodeURIComponent(apiIndex)}`,
    {
      method: 'DELETE',
    }
  );
}
