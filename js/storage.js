const Storage = {
  KEYS: {
    RECORDS: 'ecoponto_records',
    CONFIG: 'ecoponto_config'
  },

  getRecords() {
    const data = localStorage.getItem(this.KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  saveRecord(record) {
    const records = this.getRecords();
    record.id = Date.now().toString();
    records.push(record);
    localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
    return record;
  },

  deleteRecord(id) {
    let records = this.getRecords();
    records = records.filter(r => r.id !== id);
    localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
  },

  updateRecord(id, updated) {
    const records = this.getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...updated };
      localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
    }
  },

  getConfig() {
    const defaultConfig = {
      theme: 'light'
    };
    const data = localStorage.getItem(this.KEYS.CONFIG);
    return data ? { ...defaultConfig, ...JSON.parse(data) } : defaultConfig;
  },

  saveConfig(config) {
    localStorage.setItem(this.KEYS.CONFIG, JSON.stringify(config));
  },

  clearAll() {
    localStorage.removeItem(this.KEYS.RECORDS);
  },

  exportJSON() {
    const records = this.getRecords();
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecoponto_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const records = JSON.parse(e.target.result);
          localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
          resolve(records);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }
};
