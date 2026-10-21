(() => {
  const CHAVE_LANCAMENTOS = "controleNaturaLancamentos";
  const CHAVE_CLIENTES = "controleNaturaClientes";
  const CHAVE_PAGAMENTOS = "controleNaturaPagamentos";
  const $ = id => document.getElementById(id);
  const hoje = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const dinheiro = n => Number(n || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
  const dataBR = s => {
    if (!s) return "—";
    const p = String(s).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : "—";
  };
  const escapar = s => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const ler = chave => { try { const v = JSON.parse(localStorage.getItem(chave) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  let lancamentos = ler(CHAVE_LANCAMENTOS);
  let clientes = ler(CHAVE_CLIENTES);
  let pagamentos = ler(CHAVE_PAGAMENTOS);
  if (!$('filtroMes').value) $('filtroMes').value = hoje().slice(0,7);
  $('filtroDia').value = hoje();
  $('dataRecebimento').value = hoje();

  function salvarTudo() {
    localStorage.setItem(CHAVE_LANCAMENTOS, JSON.stringify(lancamentos));
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
    localStorage.setItem(CHAVE_PAGAMENTOS, JSON.stringify(pagamentos));
  }
  function obterVendas() {
    const idsLancamentos = new Set();
    const vendas = [];
    lancamentos.forEach(l => {
      if (l.tipo === "saida") return;
      const id = String(l.id ?? "");
      if (id) idsLancamentos.add(id);
      const cliente = clientes.find(c => String(c.lancamentoId || "") === id);
      vendas.push({
        id: `l-${id}`, lancamentoId: id, clienteId: cliente?.id || "",
        cliente: l.cliente || cliente?.cliente || "Venda sem cliente informado",
        produto: l.descricao || cliente?.produto || "Venda",
        vendedor: l.vendedor || cliente?.vendedor || "",
        data: l.data || cliente?.dataCompra || "",
        valor: Math.max(0, Number(l.valor || 0)),
        pago: Math.max(0, Number(cliente?.valorPago ?? l.valorPago ?? 0)),
        registroCliente: cliente || null
      });
    });
    clientes.forEach(c => {
      if (c.lancamentoId && idsLancamentos.has(String(c.lancamentoId))) return;
      vendas.push({
        id:`c-${c.id}`, lancamentoId:c.lancamentoId || "", clienteId:c.id,
        cliente:c.cliente || "Cliente", produto:c.produto || "Compra",
        vendedor:c.vendedor || "", data:c.dataCompra || "",
        valor:Math.max(0,Number(c.valor || 0)), pago:Math.max(0,Number(c.valorPago || 0)), registroCliente:c
      });
    });
    return vendas;
  }
  function valorRecebidoHistorico(venda) { return Math.min(venda.valor, Math.max(0, venda.pago)); }
  function atualizarOpcoesCompra() {
    const select = $('compraRecebimento');
    const anterior = select.value;
    const vendas = obterVendas().filter(v => v.valor - valorRecebidoHistorico(v) > 0.009);
    select.innerHTML = '<option value="">Selecione uma compra com saldo pendente</option>' + vendas.map(v =>
      `<option value="${escapar(v.id)}">${escapar(v.cliente)} — ${escapar(v.produto)} (falta ${escapar(dinheiro(v.valor - valorRecebidoHistorico(v)))})</option>`
    ).join('');
    if (vendas.some(v => v.id === anterior)) select.value = anterior;
    atualizarSaldoSelecionado();
  }
  function atualizarSaldoSelecionado() {
    const venda = obterVendas().find(v => v.id === $('compraRecebimento').value);
    $('saldoCompraSelecionada').textContent = venda
      ? `Valor da compra: ${dinheiro(venda.valor)} • Já recebido: ${dinheiro(valorRecebidoHistorico(venda))} • Falta receber: ${dinheiro(venda.valor - valorRecebidoHistorico(venda))}`
      : 'Selecione uma compra para ver o saldo que falta receber.';
    $('valorRecebimento').max = venda ? Math.max(0, venda.valor - valorRecebidoHistorico(venda)).toFixed(2) : '';
  }
  function renderizar() {
    lancamentos = ler(CHAVE_LANCAMENTOS); clientes = ler(CHAVE_CLIENTES); pagamentos = ler(CHAVE_PAGAMENTOS);
    const vendas = obterVendas();
    const totalVendido = vendas.reduce((s,v)=>s+v.valor,0);
    const totalPendente = vendas.reduce((s,v)=>s+Math.max(0,v.valor-valorRecebidoHistorico(v)),0);
    const totalRecebido = Math.max(0,totalVendido-totalPendente);
    const mes = $('filtroMes').value || hoje().slice(0,7);
    const dia = $('filtroDia').value;
    const pagamentosMes = pagamentos.filter(p => String(p.data || '').slice(0,7) === mes);
    const pagamentosDia = pagamentos.filter(p => p.data === dia);
    const vendasMes = vendas.filter(v => String(v.data || '').slice(0,7) === mes).reduce((s,v)=>s+v.valor,0);
    $('totalVendido').textContent = dinheiro(totalVendido);
    $('totalRecebido').textContent = dinheiro(totalRecebido);
    $('totalPendente').textContent = dinheiro(totalPendente);
    $('recebidoMes').textContent = dinheiro(pagamentosMes.reduce((s,p)=>s+Number(p.valor||0),0));
    $('mesSelecionadoTexto').textContent = new Date(`${mes}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    $('vendasMes').textContent = dinheiro(vendasMes);
    $('recebimentosMesDetalhe').textContent = dinheiro(pagamentosMes.reduce((s,p)=>s+Number(p.valor||0),0));
    $('recebimentosDia').textContent = dinheiro(pagamentosDia.reduce((s,p)=>s+Number(p.valor||0),0));

    const porMes = new Map();
    pagamentos.forEach(p => {
      const chave = String(p.data || '').slice(0,7);
      if (!/^\d{4}-\d{2}$/.test(chave)) return;
      porMes.set(chave,(porMes.get(chave)||0)+Number(p.valor||0));
    });
    const meses = [...porMes.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12);
    const maior = Math.max(1,...meses.map(x=>x[1]));
    $('comparacaoMensal').innerHTML = meses.length ? meses.map(([m,v]) => {
      const label = new Date(`${m}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'short',year:'numeric'});
      return `<div class="mes-barra"><span class="mes-barra-label">${escapar(label)}</span><div class="mes-barra-trilho"><div class="mes-barra-preenchimento" style="width:${Math.max(0,v/maior*100)}%"></div></div><span class="mes-barra-valor">${dinheiro(v)}</span></div>`;
    }).join('') : '<p class="mensagem-vazia">Os meses aparecerão aqui depois que você registrar os recebimentos.</p>';

    const filtrados = pagamentos.filter(p => {
      if (dia) return p.data === dia;
      return String(p.data || '').slice(0,7) === mes;
    }).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    $('tabelaRecebimentos').innerHTML = filtrados.map(p => `<tr><td>${dataBR(p.data)}</td><td>${escapar(p.cliente || '—')}</td><td>${escapar(p.produto || '—')}</td><td>${escapar(p.vendedor || '—')}</td><td>${escapar(p.formaPagamento || '—')}</td><td class="valor">${dinheiro(p.valor)}</td><td>${escapar(p.observacao || '—')}</td></tr>`).join('');
    $('contadorRecebimentos').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'pagamento' : 'pagamentos'}`;
    $('mensagemRecebimentosVazia').style.display = filtrados.length ? 'none' : 'block';
    atualizarOpcoesCompra();
  }

  $('compraRecebimento').addEventListener('change', atualizarSaldoSelecionado);
  $('filtroMes').addEventListener('change', () => { $('filtroDia').value = ''; renderizar(); });
  $('filtroDia').addEventListener('change', () => { if ($('filtroDia').value) $('filtroMes').value = $('filtroDia').value.slice(0,7); renderizar(); });
  $('formRecebimento').addEventListener('submit', e => {
    e.preventDefault();
    lancamentos = ler(CHAVE_LANCAMENTOS); clientes = ler(CHAVE_CLIENTES); pagamentos = ler(CHAVE_PAGAMENTOS);
    const venda = obterVendas().find(v => v.id === $('compraRecebimento').value);
    if (!venda) { alert('Selecione uma compra válida.'); return; }
    const valor = Number($('valorRecebimento').value || 0);
    const saldo = Math.max(0, venda.valor - valorRecebidoHistorico(venda));
    if (!Number.isFinite(valor) || valor <= 0) { alert('Informe um valor recebido maior que zero.'); return; }
    if (valor > saldo + 0.009) { alert(`O recebimento não pode ser maior que o saldo pendente de ${dinheiro(saldo)}.`); return; }
    const pagamento = {
      id: crypto.randomUUID(), clienteId:venda.clienteId || '', lancamentoId:venda.lancamentoId || '',
      vendaId:venda.id, cliente:venda.cliente, produto:venda.produto, vendedor:venda.vendedor,
      valor, data:$('dataRecebimento').value, formaPagamento:$('formaRecebimento').value,
      observacao:$('observacaoRecebimento').value.trim(), criadoEm:new Date().toISOString()
    };
    pagamentos.push(pagamento);
    if (venda.clienteId) {
      const c = clientes.find(x => String(x.id) === String(venda.clienteId));
      if (c) {
        c.valorPago = Math.min(Number(c.valor || 0), Number(c.valorPago || 0) + valor);
        c.valorPendente = Math.max(0, Number(c.valor || 0) - c.valorPago);
        c.status = c.valorPendente <= 0.009 ? 'pago' : c.valorPago > 0 ? 'parcial' : 'pendente';
        c.ultimoRecebimentoData = pagamento.data;
      }
    }
    if (venda.lancamentoId) {
      const l = lancamentos.find(x => String(x.id) === String(venda.lancamentoId));
      if (l) {
        l.valorPago = Math.min(Number(l.valor || 0), Number(l.valorPago || 0) + valor);
        l.valorPendente = Math.max(0, Number(l.valor || 0) - l.valorPago);
        l.statusPagamento = l.valorPendente <= 0.009 ? 'total' : l.valorPago > 0 ? 'parcial' : 'pendente';
        l.dataEfetivaPagamento = pagamento.data;
        l.pagamento = pagamento.formaPagamento;
      }
    }
    salvarTudo();
    $('formRecebimento').reset(); $('dataRecebimento').value = hoje(); $('filtroDia').value = pagamento.data; $('filtroMes').value = pagamento.data.slice(0,7);
    renderizar();
    alert('Recebimento registrado com sucesso.');
  });
  renderizar();
})();
