
const SUPABASE_URL = "https://lbkmlywgcesytavdjiqv.supabase.co";
const SUPABASE_KEY = "sb_publishable_IyeyWgeNTgyha4HrvxhJPg_1Pm5UvBv";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
const CHAVE_CLIENTES = "controleNaturaClientes";

let clientes = JSON.parse(localStorage.getItem(CHAVE_CLIENTES) || "[]");

clientes = clientes.map(item => {
  const valor = Number(item.valor || 0);
  const pago = Math.max(0, Math.min(valor, Number(item.valorPago || 0)));
  return {
    ...item,
    valor,
    valorPago: pago,
    valorPendente: Math.max(0, valor - pago)
  };
});

const formCliente = document.getElementById("formCliente");
const idCliente = document.getElementById("idCliente");
const nomeCliente = document.getElementById("nomeCliente");
const produtoCliente = document.getElementById("produtoCliente");
const valorCompra = document.getElementById("valorCompra");
const valorPagoCliente = document.getElementById("valorPagoCliente");
const dataCompraCliente = document.getElementById("dataCompraCliente");
const vencimentoCliente = document.getElementById("vencimentoCliente");
const formaPagamentoCliente = document.getElementById("formaPagamentoCliente");
const observacaoCliente = document.getElementById("observacaoCliente");
const vendedorCliente = document.getElementById("vendedorCliente");

const previewPendente = document.getElementById("previewPendente");
const previewStatus = document.getElementById("previewStatus");
const tituloCliente = document.getElementById("tituloCliente");
const btnSalvarCliente = document.getElementById("btnSalvarCliente");
const btnCancelarCliente = document.getElementById("btnCancelarCliente");

const tabelaClientes = document.getElementById("tabelaClientes");
const mensagemClientesVazia = document.getElementById("mensagemClientesVazia");
const contadorClientes = document.getElementById("contadorClientes");
const filtroCliente = document.getElementById("filtroCliente");
const filtroStatusCliente = document.getElementById("filtroStatusCliente");

function dinheiro(numero) {
  return Number(numero || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function dataHoje() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

function dataBR(dataISO) {
  if (!dataISO) return "-";
  const partes = dataISO.split("-");
  if (partes.length !== 3) return "-";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function salvarClientes() {
  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

function sincronizarPagamentoComLancamento(registro) {
  if (!registro.lancamentoId) return;

  const chaveLancamentos = "controleNaturaLancamentos";
  const lancamentos = JSON.parse(localStorage.getItem(chaveLancamentos) || "[]");
  const indice = lancamentos.findIndex(item => item.id === registro.lancamentoId);
  if (indice === -1) return;

  const lancamento = lancamentos[indice];
  const valor = Number(lancamento.valor || registro.valor || 0);
  const pago = Math.max(0, Math.min(valor, Number(registro.valorPago || 0)));

  lancamento.valorPago = pago;
  lancamento.valorPendente = Math.max(0, valor - pago);
  lancamento.statusPagamento = pago >= valor ? "total" : pago > 0 ? "parcial" : "pendente";
  lancamento.dataPrevistaPagamento = registro.vencimento || lancamento.dataPrevistaPagamento || lancamento.data || "";
  lancamento.pagamento = registro.formaPagamento || lancamento.pagamento || "";
  lancamento.dataEfetivaPagamento = pago >= valor ? (lancamento.dataEfetivaPagamento || dataHoje()) : "";

  localStorage.setItem(chaveLancamentos, JSON.stringify(lancamentos));
}

function obterStatus(valor, pago) {
  const total = Number(valor || 0);
  const recebido = Number(pago || 0);

  if (total > 0 && recebido >= total) return "pago";
  if (recebido > 0) return "parcial";
  return "pendente";
}

function statusTexto(status) {
  return {
    pendente: "Pendente",
    parcial: "Parcial",
    pago: "Pago"
  }[status] || "Pendente";
}

function classeStatus(status) {
  return {
    pendente: "status-pendente",
    parcial: "status-parcial",
    pago: "status-pago"
  }[status] || "status-pendente";
}

function atualizarPrevia() {
  const total = Math.max(0, Number(valorCompra.value || 0));
  let pago = Math.max(0, Number(valorPagoCliente.value || 0));

  if (pago > total) {
    pago = total;
    valorPagoCliente.value = total.toFixed(2);
  }

  const pendente = Math.max(0, total - pago);
  const status = obterStatus(total, pago);

  previewPendente.textContent = dinheiro(pendente);
  previewPendente.className = pendente > 0 ? "valor-pendente" : "valor-pago";
  previewStatus.textContent = statusTexto(status);
  previewStatus.className = `status-cliente ${classeStatus(status)}`;
}

[valorCompra, valorPagoCliente].forEach(campo => {
  campo.addEventListener("input", atualizarPrevia);
});

formCliente.addEventListener("submit", evento => {
  evento.preventDefault();

  const total = Number(valorCompra.value || 0);
  const pago = Number(valorPagoCliente.value || 0);

  if (!nomeCliente.value.trim()) {
    alert("Informe quem comprou.");
    return;
  }

  if (!produtoCliente.value.trim()) {
    alert("Informe o produto.");
    return;
  }

  if (!Number.isFinite(total) || total <= 0) {
    alert("Informe um valor de compra maior que zero.");
    return;
  }

  if (!Number.isFinite(pago) || pago < 0 || pago > total) {
    alert("O valor já pago não pode ser menor que zero nem maior que o valor da compra.");
    return;
  }

  const status = obterStatus(total, pago);
  const registro = {
    id: idCliente.value || crypto.randomUUID(),
    cliente: nomeCliente.value.trim(),
    produto: produtoCliente.value.trim(),
    valor: total,
    valorPago: pago,
    valorPendente: Math.max(0, total - pago),
    dataCompra: dataCompraCliente.value || dataHoje(),
    vencimento: vencimentoCliente.value || "",
    formaPagamento: formaPagamentoCliente.value || "",
    vendedor: vendedorCliente ? vendedorCliente.value.trim() : "",
    status,
    lancamentoId: (clientes.find(item => item.id === idCliente.value) || {}).lancamentoId || "",
    observacao: observacaoCliente.value.trim()
  };

  const indice = clientes.findIndex(item => item.id === registro.id);

  if (indice >= 0) {
    clientes[indice] = registro;
  } else {
    clientes.push(registro);
  }

  salvarClientes();
  sincronizarPagamentoComLancamento(registro);
  renderizarClientes();
  limparFormularioCliente();
});

function editarCliente(id) {
  const registro = clientes.find(item => item.id === id);
  if (!registro) return;

  idCliente.value = registro.id;
  nomeCliente.value = registro.cliente || "";
  produtoCliente.value = registro.produto || "";
  valorCompra.value = Number(registro.valor || 0).toFixed(2);
  valorPagoCliente.value = Number(registro.valorPago || 0).toFixed(2);
  dataCompraCliente.value = registro.dataCompra || dataHoje();
  vencimentoCliente.value = registro.vencimento || "";
  formaPagamentoCliente.value = registro.formaPagamento || "";
  observacaoCliente.value = registro.observacao || "";
  if (vendedorCliente) vendedorCliente.value = registro.vendedor || "";

  tituloCliente.textContent = "Editar compra / conta a receber";
  btnSalvarCliente.textContent = "Salvar alterações";
  btnCancelarCliente.classList.remove("oculto");

  atualizarPrevia();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirCliente(id) {
  const registro = clientes.find(item => item.id === id);
  if (!registro) return;

  if (!confirm(`Excluir a compra de "${registro.cliente}" no valor de ${dinheiro(registro.valor)}?`)) {
    return;
  }

  clientes = clientes.filter(item => item.id !== id);
  salvarClientes();
  renderizarClientes();

  if (idCliente.value === id) {
    limparFormularioCliente();
  }
}

function limparFormularioCliente() {
  formCliente.reset();
  idCliente.value = "";
  dataCompraCliente.value = dataHoje();
  valorPagoCliente.value = "0";
  if (vendedorCliente) vendedorCliente.value = "";
  tituloCliente.textContent = "Nova compra / conta a receber";
  btnSalvarCliente.textContent = "Adicionar compra";
  btnCancelarCliente.classList.add("oculto");
  atualizarPrevia();
}

btnCancelarCliente.addEventListener("click", limparFormularioCliente);

function obterClientesFiltrados() {
  const texto = filtroCliente.value.trim().toLowerCase();
  const statusFiltro = filtroStatusCliente.value;

  return clientes
    .map(item => {
      const valor = Number(item.valor || 0);
      const pago = Math.max(0, Math.min(valor, Number(item.valorPago || 0)));
      return {
        ...item,
        valor,
        valorPago: pago,
        valorPendente: Math.max(0, valor - pago),
        status: obterStatus(valor, pago)
      };
    })
    .filter(item => {
      const textoOk =
        !texto ||
        String(item.cliente || "").toLowerCase().includes(texto) ||
        String(item.produto || "").toLowerCase().includes(texto);

      const statusOk = !statusFiltro || item.status === statusFiltro;
      return textoOk && statusOk;
    })
    .sort((a, b) => String(b.dataCompra || "").localeCompare(String(a.dataCompra || "")));
}

function renderizarClientes() {
  const registros = obterClientesFiltrados();

  tabelaClientes.innerHTML = "";
  contadorClientes.textContent =
    `${registros.length} ${registros.length === 1 ? "registro" : "registros"}`;

  mensagemClientesVazia.style.display = registros.length ? "none" : "block";

  const totalFiltrado = registros.reduce(
    (soma, item) => soma + Math.max(0, Number(item.valor || 0) - Number(item.valorPago || 0)),
    0
  );
  const totalFiltradoEl = document.getElementById("totalFiltradoPendente");
  if (totalFiltradoEl) totalFiltradoEl.textContent = dinheiro(totalFiltrado);

  registros.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${escaparHTML(item.cliente)}</strong></td>
      <td>${escaparHTML(item.vendedor || "-")}</td>
      <td>
        <strong>${escaparHTML(item.produto)}</strong>
        ${item.observacao ? `<br><small>${escaparHTML(item.observacao)}</small>` : ""}
      </td>
      <td>${dataBR(item.dataCompra)}</td>
      <td><strong>${dinheiro(item.valor)}</strong></td>
      <td class="valor-pago">${dinheiro(item.valorPago)}</td>
      <td class="${item.valorPendente > 0 ? "valor-pendente" : "valor-pago"}">
        ${dinheiro(item.valorPendente)}
      </td>
      <td>${dataBR(item.vencimento)}</td>
      <td>
        <span class="status-cliente ${classeStatus(item.status)}">
          ${statusTexto(item.status)}
        </span>
        ${item.formaPagamento ? `<br><small>${escaparHTML(item.formaPagamento)}</small>` : ""}
      </td>
      <td>
        <div class="botoes">
          <button class="btn-editar" onclick="editarCliente('${item.id}')">Editar</button>
          <button class="btn-excluir" onclick="excluirCliente('${item.id}')">Excluir</button>
        </div>
      </td>
    `;

    tabelaClientes.appendChild(tr);
  });

  atualizarResumoClientes();
}

function atualizarResumoClientes() {
  const total = clientes.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  const pago = clientes.reduce((soma, item) => soma + Number(item.valorPago || 0), 0);
  const pendente = clientes.reduce((soma, item) => soma + Math.max(0, Number(item.valor || 0) - Number(item.valorPago || 0)), 0);
  const abertos = clientes.filter(item => Math.max(0, Number(item.valor || 0) - Number(item.valorPago || 0)) > 0).length;

  document.getElementById("totalAReceber").textContent = dinheiro(total);
  document.getElementById("totalPagoClientes").textContent = dinheiro(pago);
  document.getElementById("totalPendenteClientes").textContent = dinheiro(pendente);
  document.getElementById("comprasEmAberto").textContent = abertos;
}

[filtroCliente, filtroStatusCliente].forEach(elemento => {
  elemento.addEventListener("input", renderizarClientes);
  elemento.addEventListener("change", renderizarClientes);
});

function nomeArquivoData(prefixo, extensao) {
  const agora = new Date();
  const data = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  return `${prefixo}_${data}.${extensao}`;
}

function exportarClientesExcel() {
  if (typeof XLSX === "undefined") {
    alert("A biblioteca do Excel não foi carregada. Verifique sua internet.");
    return;
  }

  if (!clientes.length) {
    alert("Não há compras cadastradas para exportar.");
    return;
  }

  const dados = clientes.map(item => {
    const valor = Number(item.valor || 0);
    const pago = Number(item.valorPago || 0);
    const pendente = Math.max(0, valor - pago);

    return {
      Cliente: item.cliente,
      Vendedor: item.vendedor || "",
      Produto: item.produto,
      "Data da compra": dataBR(item.dataCompra),
      "Valor da compra": valor,
      "Já pago": pago,
      "Falta pagar": pendente,
      Vencimento: dataBR(item.vencimento),
      "Forma de pagamento": item.formaPagamento || "",
      Status: statusTexto(obterStatus(valor, pago)),
      Observação: item.observacao || ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contas a receber");
  XLSX.writeFile(wb, nomeArquivoData("clientes_contas_receber", "xlsx"));
}

function exportarClientesPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("A biblioteca do PDF não foi carregada. Verifique sua internet.");
    return;
  }

  if (!clientes.length) {
    alert("Não há compras cadastradas para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.text("Clientes / Contas a Receber - Natura", 14, 14);
  doc.setFontSize(9);
  doc.text(`Gerado em ${dataBR(dataHoje())}`, 14, 20);

  const linhas = clientes.map(item => {
    const valor = Number(item.valor || 0);
    const pago = Number(item.valorPago || 0);
    const pendente = Math.max(0, valor - pago);

    return [
      item.cliente || "-",
      item.vendedor || "-",
      item.produto || "-",
      dataBR(item.dataCompra),
      dinheiro(valor),
      dinheiro(pago),
      dinheiro(pendente),
      dataBR(item.vencimento),
      statusTexto(obterStatus(valor, pago))
    ];
  });

  doc.autoTable({
    startY: 25,
    head: [["Cliente", "Vendedor", "Produto", "Data", "Valor", "Pago", "Falta", "Vencimento", "Status"]],
    body: linhas,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fontSize: 8 },
    margin: { left: 8, right: 8 }
  });

  doc.save(nomeArquivoData("clientes_contas_receber", "pdf"));
}

document.getElementById("btnExportarClientesExcel").addEventListener("click", exportarClientesExcel);
document.getElementById("btnExportarClientesPDF").addEventListener("click", exportarClientesPDF);

window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;

limparFormularioCliente();
renderizarClientes();
