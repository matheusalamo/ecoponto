document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizarData(dataStr) {
  if (!dataStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return dataStr;
  const parts = dataStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
  }
  return dataStr;
}

function initApp() {
  setupNavigation();
  setupTheme();
  setupForm();
  setupConfig();
  updateDashboard();
  loadHistorico();
  
  const now = new Date();
  document.getElementById('data').value = getLocalDateString();
  document.getElementById('horario').value = now.toTimeString().slice(0, 5);
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker registrado'))
      .catch(e => console.log('Erro SW:', e));
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = item.dataset.page;
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      pages.forEach(p => p.classList.remove('active'));
      document.getElementById(targetPage).classList.add('active');
      
      document.getElementById('pageTitle').textContent = 
        item.querySelector('span').textContent;
      
      sidebar.classList.remove('open');

      if (targetPage === 'dashboard') updateDashboard();
      if (targetPage === 'historico') loadHistorico();
    });
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

function navigateTo(page) {
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.click();
}

function setupTheme() {
  const config = Storage.getConfig();
  setTheme(config.theme);
  
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  Storage.saveConfig({ ...Storage.getConfig(), theme });
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  
  const toggle = document.getElementById('themeToggle');
  toggle.innerHTML = theme === 'dark' 
    ? '<i class="fas fa-sun"></i> <span>Tema Claro</span>'
    : '<i class="fas fa-moon"></i> <span>Tema Escuro</span>';
}

function setupForm() {
  const form = document.getElementById('cadastroForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const residuos = Array.from(form.querySelectorAll('input[name="residuo"]:checked'))
      .map(cb => cb.value);
    
    if (residuos.length === 0) {
      showToast('Selecione pelo menos um tipo de resíduo.', 'warning');
      return;
    }
    
    const record = {
      data: document.getElementById('data').value,
      horario: document.getElementById('horario').value,
      placa: document.getElementById('placa').value.toUpperCase(),
      modelo: document.getElementById('modelo').value,
      responsavel: document.getElementById('responsavel').value,
      tipoVeiculo: document.getElementById('tipoVeiculo').value,
      residuos: residuos,
      observacao: document.getElementById('observacao').value
    };
    
    record.data = getLocalDateString();
    Storage.saveRecord(record);
    showToast('Registro salvo com sucesso!', 'success');
    
    form.reset();
    const now = new Date();
    document.getElementById('data').value = getLocalDateString();
    document.getElementById('horario').value = now.toTimeString().slice(0, 5);
    
    updateDashboard();
    loadHistorico();
    navigateTo('dashboard');
  });
}

function updateDashboard() {
  const records = Storage.getRecords();
  const hoje = getLocalDateString();
  const hojeRecords = records.filter(r => normalizarData(r.data) === hoje);
  
  document.getElementById('totalVeiculos').textContent = hojeRecords.length;
  
  const totalResiduos = hojeRecords.reduce((acc, r) => acc + r.residuos.length, 0);
  document.getElementById('totalResiduos').textContent = totalResiduos;
  
  document.getElementById('dataHoje').textContent = new Date().toLocaleDateString('pt-BR');
  
  const tbody = document.getElementById('ultimosRegistros').querySelector('tbody');
  const recentes = records.slice(-5).reverse();
  
  if (recentes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum registro recente</td></tr>';
  } else {
    tbody.innerHTML = recentes.map(r => `
      <tr>
        <td>${r.horario}</td>
        <td>${r.placa}</td>
        <td>${r.modelo}</td>
        <td>${r.responsavel}</td>
        <td>${r.residuos.join(', ')}</td>
      </tr>
    `).join('');
  }
}

function loadHistorico(filtered) {
  const records = filtered || Storage.getRecords();
  const tbody = document.getElementById('historicoBody');
  
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Nenhum registro encontrado</td></tr>';
    return;
  }
  
  tbody.innerHTML = records.reverse().map(r => `
    <tr>
      <td>${normalizarData(r.data)}</td>
      <td>${r.horario}</td>
      <td>${r.placa}</td>
      <td>${r.modelo}</td>
      <td>${r.responsavel}</td>
      <td>${r.tipoVeiculo}</td>
      <td>${r.residuos.join(', ')}</td>
      <td>${r.observacao || '-'}</td>
      <td class="action-icons">
        <button onclick="deletarRegistro('${r.id}')" class="delete" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filtrarHistorico() {
  const placaFiltro = document.getElementById('filtroPlaca').value.toLowerCase();
  const dataFiltro = document.getElementById('filtroData').value;
  const veiculoFiltro = document.getElementById('filtroVeiculo').value;
  const residuoFiltro = document.getElementById('filtroResiduo').value;
  
  let records = Storage.getRecords();
  
  if (placaFiltro) {
    records = records.filter(r => r.placa.toLowerCase().includes(placaFiltro));
  }
  if (dataFiltro) {
    records = records.filter(r => r.data === dataFiltro);
  }
  if (veiculoFiltro) {
    records = records.filter(r => r.tipoVeiculo === veiculoFiltro);
  }
  if (residuoFiltro) {
    records = records.filter(r => r.residuos.includes(residuoFiltro));
  }
  
  loadHistorico(records);
}

function limparFiltros() {
  document.getElementById('filtroPlaca').value = '';
  document.getElementById('filtroData').value = '';
  document.getElementById('filtroVeiculo').value = '';
  document.getElementById('filtroResiduo').value = '';
  loadHistorico();
}

function deletarRegistro(id) {
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    Storage.deleteRecord(id);
    updateDashboard();
    loadHistorico();
    showToast('Registro excluído.', 'success');
  }
}

function setupConfig() {}

function fazerBackup() {
  Storage.exportJSON();
  showToast('Backup realizado com sucesso!', 'success');
}

function restaurarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  Storage.importJSON(file)
    .then(() => {
      showToast('Backup restaurado com sucesso!', 'success');
      updateDashboard();
      loadHistorico();
    })
    .catch(() => {
      showToast('Erro ao restaurar backup.', 'error');
    });
}

function limparDados() {
  if (confirm('Tem certeza? Isso apagará TODOS os registros permanentemente.')) {
    Storage.clearAll();
    updateDashboard();
    loadHistorico();
    showToast('Todos os dados foram apagados.', 'success');
  }
}

function gerarPDFExpediente() {
  const hoje = getLocalDateString();
  const registros = Storage.getRecords().filter(r => normalizarData(r.data) === hoje);
  
  if (registros.length === 0) {
    showToast('Nenhum registro encontrado hoje.', 'warning');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Prefeitura de Catanduva - Ecoponto', 14, 22);
  doc.setFontSize(10);
  doc.text(`Data: ${hoje}`, 14, 30);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 36);
  doc.text(`Total de registros: ${registros.length}`, 14, 42);
  
  const headers = [['Horario', 'Placa', 'Modelo', 'Responsavel', 'Tipo', 'Residuos', 'Observacao']];
  const rows = registros.map(r => [
    r.horario,
    r.placa,
    r.modelo,
    r.responsavel,
    r.tipoVeiculo,
    r.residuos.join(', '),
    r.observacao || '-'
  ]);
  
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 48,
    headStyles: { fillColor: [46, 125, 50] },
    styles: { fontSize: 8 }
  });
  
  doc.save(`expediente_${hoje}.pdf`);
  showToast(`PDF do expediente gerado com ${registros.length} registros!`, 'success');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
