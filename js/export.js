const Export = {
  toExcel(data, filename = 'ecoponto_registros') {
    const headers = ['Data', 'Horário', 'Placa', 'Modelo', 'Responsável', 'Tipo Veículo', 'Resíduos', 'Observação'];
    let csv = headers.join(';') + '\n';
    
    data.forEach(r => {
      const row = [
        r.data,
        r.horario,
        r.placa,
        r.modelo,
        r.responsavel,
        r.tipoVeiculo,
        r.residuos.join(', '),
        r.observacao || ''
      ];
      csv += row.map(v => `"${v}"`).join(';') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  toPDF(data, title = 'Registros Ecoponto') {
    if (typeof window.jspdf === 'undefined') {
      showToast('Biblioteca jsPDF não carregada.', 'warning');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    const headers = [['Data', 'Horário', 'Placa', 'Modelo', 'Responsável', 'Tipo', 'Resíduos']];
    const rows = data.map(r => [
      r.data,
      r.horario,
      r.placa,
      r.modelo,
      r.responsavel,
      r.tipoVeiculo,
      r.residuos.join(', ')
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 125, 50] }
    });

    doc.save(`${title.toLowerCase().replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  }
};

function exportarExcel() {
  const records = Storage.getRecords();
  if (records.length === 0) {
    showToast('Nenhum registro para exportar.', 'warning');
    return;
  }
  Export.toExcel(records);
  showToast('Exportado para Excel (CSV) com sucesso!', 'success');
}

function exportarPDF() {
  if (typeof window.jspdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    
    const autoTable = document.createElement('script');
    autoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js';
    document.head.appendChild(autoTable);
    
    showToast('Carregando biblioteca PDF. Tente novamente em instantes.', 'warning');
    return;
  }
  
  const records = Storage.getRecords();
  if (records.length === 0) {
    showToast('Nenhum registro para exportar.', 'warning');
    return;
  }
  Export.toPDF(records, 'Histórico Ecoponto');
  showToast('PDF gerado com sucesso!', 'success');
}

function exportarRelatorioExcel() {
  const tbody = document.getElementById('relatorioBody');
  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0 || rows[0].querySelector('.empty-state')) {
    showToast('Nenhum dado no relatório.', 'warning');
    return;
  }
  
  const data = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      data.push({
        data: cells[0].textContent,
        horario: cells[1].textContent,
        placa: cells[2].textContent,
        modelo: cells[3].textContent,
        responsavel: cells[4].textContent,
        tipoVeiculo: cells[5].textContent,
        residuos: cells[6].textContent.split(', ')
      });
    }
  });
  
  Export.toExcel(data, 'relatorio_ecoponto');
  showToast('Relatório exportado para Excel!', 'success');
}

function exportarRelatorioPDF() {
  if (typeof window.jspdf === 'undefined') {
    showToast('Carregando biblioteca PDF...', 'warning');
    return;
  }
  
  const tbody = document.getElementById('relatorioBody');
  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0 || rows[0].querySelector('.empty-state')) {
    showToast('Nenhum dado no relatório.', 'warning');
    return;
  }
  
  const data = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      data.push({
        data: cells[0].textContent,
        horario: cells[1].textContent,
        placa: cells[2].textContent,
        modelo: cells[3].textContent,
        responsavel: cells[4].textContent,
        tipoVeiculo: cells[5].textContent,
        residuos: cells[6].textContent.split(', ')
      });
    }
  });
  
  const title = document.getElementById('relatorioTitulo').textContent;
  Export.toPDF(data, title);
  showToast('PDF do relatório gerado!', 'success');
}
