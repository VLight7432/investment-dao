export function readVersionedRecord({ key, version, validate, label }) {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return { record: null, error: null };

    const record = JSON.parse(storedValue);
    if (record?.version !== version || !validate(record)) {
      return { record: null, error: `Le ${label} enregistré sur cet appareil est incomplet.` };
    }

    return { record, error: null };
  } catch {
    return { record: null, error: `Le ${label} local ne peut pas être lu dans ce navigateur.` };
  }
}

export function saveVersionedRecord({ key, record, label }) {
  try {
    localStorage.setItem(key, JSON.stringify(record));
    return { record, error: null };
  } catch {
    return {
      record: null,
      error: `Impossible d’enregistrer ce ${label} localement. Vérifiez les réglages de votre navigateur.`,
    };
  }
}

export function removeLocalRecord({ key, label }) {
  try {
    localStorage.removeItem(key);
    return { error: null };
  } catch {
    return {
      error: `Impossible de supprimer ce ${label} localement. Vérifiez les réglages de votre navigateur.`,
    };
  }
}
