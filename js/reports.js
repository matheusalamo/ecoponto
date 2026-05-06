const Reports = {
  diario() {
    const hoje = new Date().toISOString().slice(0, 10);
    return Storage.getRecords().filter(r => r.data === hoje);
  },

  semanal() {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    return Storage.getRecords().filter(r => {
      const dataRecord = new Date(r.data);
      return dataRecord >= seteDiasAtras && dataRecord <= hoje;
    });
  },

  mensal() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    return Storage.getRecords().filter(r => {
      const [ano, mes] = r.data.split('-').map(Number);
      return mes - 1 === mesAtual && ano === anoAtual;
    });
  },

  render(data, titulo) {
    const tbody = document.getElementById('relatorioBody');
    const statsDiv = document.getElementById('relatorioStats');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum registro encontrado no período</td></tr>';
      statsDiv.innerHTML = '';
      return;
    }

    // Render table
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.data}</td>
        <td>${r.horario}</td>
        <td>${r.placa}</td>
        <td>${r.modelo}</td>
        <td>${r.responsavel}</td>
        <td>${r.tipoVeiculo}</td>
        <td>${r.residuos.join(', ')}</td>
      </tr>
    `).join('');

    // Stats
    const totalVeiculos = data.length;
    const tiposVeiculo = {};
    const tiposResiduo = {};
    
    data.forEach(r => {
      tiposVeiculo[r.tipoVeiculo] = (tiposVeiculo[r.tipoVeiculo] || 0) + 1;
      r.residuos.forEach(res => {
        tiposResiduo[res] = (tiposResiduo[res] || 0) + 1;
      });
    });

    statsDiv.innerHTML = `
      <h4>Resumo do Período</h4>
      <p><strong>Total de Registros:</strong> ${totalVeiculos}</p>
      <p><strong>Por Tipo de Veículo:</strong> ${Object.entries(tiposVeiculo).map(([k,v]) => `${k}: ${v}`).join(' | ')}</p>
      <p><strong>Por Tipo de Resíduo:</strong> ${Object.entries(tiposResiduo).map(([k,v]) => `${k}: ${v}`).join(' | ')}</p>
    `;
  }
};

function gerarRelatorio(tipo) {
  const output = document.getElementById('relatorioResultado');
  const titulo = document.getElementById('relatorioTitulo');
  
  output.style.display = 'block';
  let data = [];
  
  switch(tipo) {
    case 'diario':
      data = Reports.diario();
      titulo.textContent = 'Relatório Diário - ' + new Date().toLocaleDateString('pt-BR');
      break;
    case 'semanal':
      data = Reports.semanal();
      titulo.textContent = 'Relatório Semanal - Últimos 7 dias';
      break;
    case 'mensal':
      data = Reports.mensal();
      titulo.textContent = 'Relatório Mensal - ' + new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      break;
  }
  
  Reports.render(data, titulo.textContent);
  showToast(`Relatório gerado com ${data.length} registros.`, 'success');
}
