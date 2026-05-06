const SUPABASE_URL = 'https://24b2cd7f-c828-4c16-b786-110a1f767051.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneHZ5d2Z4ZnF1YmxiaHJveHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjA0MDUsImV4cCI6MjA5MzU5NjQwNX0.0f28QBaKP5UNBLlEKnAyHghagaAckxUpZ57rNBEbZ6I';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Storage = {
  KEYS: {
    CONFIG: 'ecoponto_config'
  },

  async getRecords() {
    const { data, error } = await db
      .from('records')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar registros:', error);
      return [];
    }

    return data.map(r => ({
      ...r,
      residuos: typeof r.residuos === 'string' ? JSON.parse(r.residuos) : r.residuos
    }));
  },

  async saveRecord(record) {
    const localId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    record.localId = localId;

    const { data, error } = await db
      .from('records')
      .insert({
        localId,
        data: record.data,
        horario: record.horario,
        placa: record.placa,
        modelo: record.modelo,
        responsavel: record.responsavel,
        tipoVeiculo: record.tipoVeiculo,
        residuos: JSON.stringify(record.residuos),
        observacao: record.observacao
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar:', error);
      return null;
    }

    data.residuos = typeof data.residuos === 'string' ? JSON.parse(data.residuos) : data.residuos;
    return data;
  },

  async deleteRecord(id) {
    const { error } = await db
      .from('records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar:', error);
    }
  },

  async clearAll() {
    const { error } = await db
      .from('records')
      .delete()
      .gt('id', 0);
    
    if (error) {
      console.error('Erro ao limpar:', error);
    }
  },

  async exportJSON() {
    const records = await this.getRecords();
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecoponto_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const records = JSON.parse(e.target.result);
          for (const r of records) {
            await this.saveRecord(r);
          }
          resolve(await this.getRecords());
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  },

  getConfig() {
    const defaultConfig = { theme: 'light' };
    const data = localStorage.getItem(this.KEYS.CONFIG);
    return data ? { ...defaultConfig, ...JSON.parse(data) } : defaultConfig;
  },

  saveConfig(config) {
    localStorage.setItem(this.KEYS.CONFIG, JSON.stringify(config));
  }
};
