const CHAVE_DADOS = "controleNaturaLancamentos";
const CHAVE_COMISSAO = "controleNaturaComissaoPadrao";
const CHAVE_ESTOQUE = "controleNaturaEstoque";
const FATOR_CUSTO_70 = 0.70; // O custo representa 70% do preço de venda.

function calcularPrecoVenda(custo) {
  const valor = Number(custo || 0);
  return valor > 0 ? valor / FATOR_CUSTO_70 : 0;
}

function calcularLucroVenda(custo) {
  const venda = calcularPrecoVenda(custo);
  return Math.max(0, venda - Number(custo || 0));
}

let lancamentos = JSON.parse(localStorage.getItem(CHAVE_DADOS)) || [];
let estoque = JSON.parse(localStorage.getItem(CHAVE_ESTOQUE)) || [];

// Compatibilidade: adiciona os novos campos de pagamento aos registros antigos.
lancamentos = lancamentos.map(item => ({
  ...item,
  dataPrevistaPagamento: item.dataPrevistaPagamento || item.data || "",
  dataEfetivaPagamento: item.dataEfetivaPagamento || "",
  statusPagamento: item.statusPagamento || "pendente",
  quantidade: Number(item.quantidade || 1),
  custoUnitario: Number(item.custoUnitario ?? ((Number(item.valor || 0) / Number(item.quantidade || 1)) * FATOR_CUSTO_70)),
  precoVendaUnitario: Number(item.precoVendaUnitario ?? (Number(item.valor || 0) / Number(item.quantidade || 1))),
  valorPago: Number(item.valorPago || 0)
}));

let comissaoPadrao = Number(localStorage.getItem(CHAVE_COMISSAO));
if (!Number.isFinite(comissaoPadrao)) comissaoPadrao = 30;

const form = document.getElementById("formLancamento");
const tipo = document.getElementById("tipo");
const data = document.getElementById("data");
const descricao = document.getElementById("descricao");
const valor = document.getElementById("valor");
const quantidadeLancamento = document.getElementById("quantidadeLancamento");
const custoUnitario = document.getElementById("custoUnitario");
const precoVendaUnitario = document.getElementById("precoVendaUnitario");
const vendedor = document.getElementById("vendedor");
const pagamento = document.getElementById("pagamento");
const dataPrevistaPagamento = document.getElementById("dataPrevistaPagamento");
const dataEfetivaPagamento = document.getElementById("dataEfetivaPagamento");
const statusPagamento = document.getElementById("statusPagamento");
const valorPago = document.getElementById("valorPago");
const campoValorPago = document.getElementById("campoValorPago");
const comissao = document.getElementById("comissao");
const observacao = document.getElementById("observacao");
const idEdicao = document.getElementById("idEdicao");
const campoComissao = document.getElementById("campoComissao");

const tabela = document.getElementById("tabelaLancamentos");
const mensagemVazia = document.getElementById("mensagemVazia");
const contador = document.getElementById("contador");

const filtroTexto = document.getElementById("filtroTexto");
const filtroTipo = document.getElementById("filtroTipo");
const filtroData = document.getElementById("filtroData");

const comissaoPadraoInput = document.getElementById("comissaoPadrao");
const salvarComissaoPadrao = document.getElementById("salvarComissaoPadrao");

const totalEntradas = document.getElementById("totalEntradas");
const totalSaidas = document.getElementById("totalSaidas");
const saldo = document.getElementById("saldo");
const totalComissoes = document.getElementById("totalComissoes");

const tituloFormulario = document.getElementById("tituloFormulario");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");

comissaoPadraoInput.value = comissaoPadrao;
data.value = dataHoje();
dataPrevistaPagamento.value = dataHoje();

function dataHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function salvarDados() {
  localStorage.setItem(CHAVE_DADOS, JSON.stringify(lancamentos));
}

function dinheiro(numero) {
  return Number(numero || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function dataBR(dataISO) {
  if (!dataISO) return "-";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numeroValido(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0;
}

function atualizarComissaoCampo() {
  const ehEntrada = tipo.value === "entrada";
  campoComissao.classList.toggle("oculto", !ehEntrada);

  if (!ehEntrada) {
    comissao.value = "";
  }
}

tipo.addEventListener("change", atualizarComissaoCampo);

function atualizarCampoPagamento() {
  const status = statusPagamento.value;
  campoValorPago.classList.toggle("oculto", status === "pendente");

  if (status === "total") {
    valorPago.value = valor.value || "";
  }

  if (status === "pendente") {
    valorPago.value = "";
  }
}

statusPagamento.addEventListener("change", atualizarCampoPagamento);

function atualizarValoresLancamento() {
  const qtd = Number(quantidadeLancamento.value || 0);
  const custo = Number(custoUnitario.value || 0);

  if (tipo.value === "entrada" && custo > 0 && !precoVendaUnitario.dataset.manual) {
    precoVendaUnitario.value = calcularPrecoVenda(custo).toFixed(2);
  }

  const venda = Number(precoVendaUnitario.value || 0);

  if (tipo.value === "entrada" && qtd > 0 && venda >= 0) {
    valor.value = (qtd * venda).toFixed(2);
  }

  if (statusPagamento.value === "total") valorPago.value = valor.value;
}

custoUnitario.addEventListener("input", () => {
  delete precoVendaUnitario.dataset.manual;
  atualizarValoresLancamento();
});

precoVendaUnitario.addEventListener("input", () => {
  precoVendaUnitario.dataset.manual = "1";
  const qtd = Number(quantidadeLancamento.value || 0);
  const venda = Number(precoVendaUnitario.value || 0);
  if (tipo.value === "entrada" && qtd > 0) valor.value = (qtd * venda).toFixed(2);
  if (statusPagamento.value === "total") valorPago.value = valor.value;
});

quantidadeLancamento.addEventListener("input", atualizarValoresLancamento);

valor.addEventListener("input", () => {
  if (statusPagamento.value === "total") valorPago.value = valor.value;
});

tipo.addEventListener("change", () => {
  if (tipo.value === "entrada") {
    atualizarValoresLancamento();
  }
});

// A comissão do vendedor é independente do custo e do preço de venda.
// Alterar 30% para 27%, por exemplo, muda somente o valor da comissão.
comissao.addEventListener("input", () => {
  if (tipo.value !== "entrada") return;

  const percentual = Number(comissao.value);
  const valorVenda = Number(valor.value || 0);

  if (Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) {
    // Não altera custoUnitario nem precoVendaUnitario.
    // O valor da comissão é recalculado no salvamento.
    const indicador = document.getElementById("previewComissao");
    if (indicador) {
      indicador.textContent = `Comissão: ${dinheiro(valorVenda * percentual / 100)}`;
    }
  }
});

form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valorNumerico = Number(valor.value);
  const quantidadeNumerica = Number(quantidadeLancamento.value);

  if (!numeroValido(valorNumerico)) {
    alert("Informe um valor válido.");
    return;
  }

  let percentual = comissao.value === ""
    ? comissaoPadrao
    : Number(comissao.value);

  if (tipo.value === "entrada") {
    if (!numeroValido(percentual) || percentual > 100) {
      alert("A comissão deve estar entre 0% e 100%.");
      return;
    }
  } else {
    percentual = 0;
  }

  if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica < 1) {
    alert("A quantidade deve ser um número inteiro maior que zero.");
    quantidadeLancamento.focus();
    return;
  }

  const id = idEdicao.value;
  const status = statusPagamento.value || "pendente";
  let pagamentoValor = Number(valorPago.value || 0);

  if (status === "total") pagamentoValor = valorNumerico;

  if (status === "pendente") pagamentoValor = 0;

  if (status === "parcial" && (pagamentoValor <= 0 || pagamentoValor >= valorNumerico)) {
    alert("No pagamento parcial, informe um valor pago maior que zero e menor que o valor total.");
    return;
  }

  if (pagamentoValor > valorNumerico) {
    alert("O valor pago não pode ser maior que o valor do lançamento.");
    return;
  }

  const registro = {
    id: id || crypto.randomUUID(),
    tipo: tipo.value,
    data: data.value,
    descricao: descricao.value.trim(),
    quantidade: quantidadeNumerica,
    custoUnitario: Number(custoUnitario.value || 0),
    precoVendaUnitario: Number(precoVendaUnitario.value || (tipo.value === "entrada" ? valorNumerico / quantidadeNumerica : 0)),
    valor: valorNumerico,
    vendedor: vendedor.value.trim(),
    pagamento: pagamento.value,
    dataPrevistaPagamento: dataPrevistaPagamento.value,
    dataEfetivaPagamento: dataEfetivaPagamento.value,
    statusPagamento: status,
    valorPago: pagamentoValor,
    valorPendente: Math.max(0, valorNumerico - pagamentoValor),
    comissaoPercentual: percentual,
    comissaoValor: tipo.value === "entrada"
      ? valorNumerico * (percentual / 100)
      : 0,
    observacao: observacao.value.trim()
  };

  if (!registro.descricao || !registro.data || !Number.isInteger(quantidadeNumerica) || quantidadeNumerica < 1) {
    alert("Preencha os campos obrigatórios e informe uma quantidade válida.");
    return;
  }

  if (id) {
    const indice = lancamentos.findIndex(item => item.id === id);

    if (indice === -1) {
      alert("Não foi possível localizar este lançamento para edição.");
      return;
    }

    lancamentos[indice] = registro;
  } else {
    lancamentos.push(registro);
  }

  salvarDados();
  renderizar();
  limparFormulario();

  // Confirma que o registro foi persistido no navegador.
  const dadosSalvos = JSON.parse(localStorage.getItem(CHAVE_DADOS) || "[]");
  if (!dadosSalvos.some(item => item.id === registro.id)) {
    alert("O lançamento não foi salvo no navegador. Tente novamente.");
  }
});

function editarLancamento(id) {
  const registro = lancamentos.find(item => item.id === id);
  if (!registro) return;

  idEdicao.value = registro.id;
  tipo.value = registro.tipo;
  data.value = registro.data;
  descricao.value = registro.descricao;
  quantidadeLancamento.value = Number(registro.quantidade || 1);
  custoUnitario.value = Number(registro.custoUnitario || 0).toFixed(2);
  precoVendaUnitario.value = Number(registro.precoVendaUnitario || (Number(registro.valor || 0) / Number(registro.quantidade || 1))).toFixed(2);
  delete precoVendaUnitario.dataset.manual;
  valor.value = Number(registro.valor || 0).toFixed(2);
  vendedor.value = registro.vendedor;
  pagamento.value = registro.pagamento;
  dataPrevistaPagamento.value = registro.dataPrevistaPagamento || registro.data || "";
  dataEfetivaPagamento.value = registro.dataEfetivaPagamento || "";
  statusPagamento.value = registro.statusPagamento || "pendente";
  valorPago.value = Number(registro.valorPago || 0) || "";
  comissao.value = registro.tipo === "entrada"
    ? Number(registro.comissaoPercentual ?? comissaoPadrao)
    : "";
  observacao.value = registro.observacao;

  tituloFormulario.textContent = "Editar lançamento";
  btnSalvar.textContent = "Salvar alterações";
  btnCancelar.classList.remove("oculto");

  atualizarComissaoCampo();
  atualizarCampoPagamento();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function excluirLancamento(id) {
  const registro = lancamentos.find(item => item.id === id);
  if (!registro) return;

  const confirmar = confirm(
    `Excluir "${registro.descricao}" no valor de ${dinheiro(registro.valor)}?`
  );

  if (!confirmar) return;

  lancamentos = lancamentos.filter(item => item.id !== id);
  salvarDados();
  renderizar();

  if (idEdicao.value === id) {
    limparFormulario();
  }
}

btnCancelar.addEventListener("click", limparFormulario);

function limparFormulario() {
  form.reset();
  idEdicao.value = "";
  quantidadeLancamento.value = 1;
  data.value = dataHoje();
  dataPrevistaPagamento.value = dataHoje();
  dataEfetivaPagamento.value = "";
  tipo.value = "entrada";
  statusPagamento.value = "pendente";
  valorPago.value = "";
  comissao.value = "";
  tituloFormulario.textContent = "Novo lançamento";
  btnSalvar.textContent = "Adicionar lançamento";
  btnCancelar.classList.add("oculto");
  atualizarComissaoCampo();
}

salvarComissaoPadrao.addEventListener("click", () => {
  const novaComissao = Number(comissaoPadraoInput.value);

  if (!numeroValido(novaComissao) || novaComissao > 100) {
    alert("A comissão padrão deve estar entre 0% e 100%.");
    return;
  }

  comissaoPadrao = novaComissao;
  localStorage.setItem(CHAVE_COMISSAO, String(comissaoPadrao));

  alert(`Comissão padrão salva em ${comissaoPadrao.toFixed(2)}%.`);
});

function obterFiltrados() {
  const texto = filtroTexto.value.trim().toLowerCase();
  const tipoFiltro = filtroTipo.value;
  const dataFiltro = filtroData.value;

  return lancamentos
    .filter(item => {
      const correspondeTexto =
        !texto ||
        item.descricao.toLowerCase().includes(texto) ||
        item.vendedor.toLowerCase().includes(texto);

      const correspondeTipo =
        !tipoFiltro || item.tipo === tipoFiltro;

      const correspondeData =
        !dataFiltro || item.data === dataFiltro;

      return correspondeTexto && correspondeTipo && correspondeData;
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

[filtroTexto, filtroTipo, filtroData].forEach(elemento => {
  elemento.addEventListener("input", renderizar);
  elemento.addEventListener("change", renderizar);
});

function statusPagamentoTexto(status) {
  const nomes = {
    pendente: "Pendente",
    parcial: "Parcial",
    total: "Total"
  };
  return nomes[status] || "Pendente";
}

function renderizar() {
  const registros = obterFiltrados();

  tabela.innerHTML = "";

  contador.textContent =
    `${registros.length} ${registros.length === 1 ? "registro" : "registros"}`;

  mensagemVazia.style.display = registros.length ? "none" : "block";

  registros.forEach(item => {
    const tr = document.createElement("tr");
    const custoUnit = Number(item.custoUnitario ?? ((Number(item.valor || 0) / Number(item.quantidade || 1)) * FATOR_CUSTO_70));
    const vendaUnit = Number(item.precoVendaUnitario ?? (Number(item.valor || 0) / Number(item.quantidade || 1)));

    const comissaoTexto = item.tipo === "entrada"
      ? `<div class="comissao-info">
           <strong>${dinheiro(item.comissaoValor)}</strong>
           <span class="tag-porcentagem">${Number(item.comissaoPercentual || 0).toFixed(2)}%</span>
         </div>`
      : "-";

    tr.innerHTML = `
      <td class="col-selecao">
        <input class="check-lancamento" type="checkbox" data-id="${escaparAtributo(item.id)}">
      </td>
      <td>${dataBR(item.data)}</td>
      <td>
        <strong>${escaparHTML(item.descricao)}</strong>
        ${item.observacao ? `<br><small>${escaparHTML(item.observacao)}</small>` : ""}
      </td>
      <td><strong>${Number(item.quantidade || 1)}</strong></td>
      <td>${dinheiro(custoUnit)}</td>
      <td>${dinheiro(vendaUnit)}</td>
      <td class="${item.tipo === "entrada" ? "valor-entrada" : "valor-saida"}">
        ${item.tipo === "entrada" ? "+" : "-"} ${dinheiro(item.valor)}
      </td>
      <td>${escaparHTML(item.vendedor) || "-"}</td>
      <td>
        <div class="pagamento-info">
          <strong>${statusPagamentoTexto(item.statusPagamento)}</strong><br>
          <small>Prev.: ${dataBR(item.dataPrevistaPagamento || item.data)}</small><br>
          <small>Efet.: ${dataBR(item.dataEfetivaPagamento)}</small><br>
          <small>Pago: ${dinheiro(item.valorPago || 0)}${Number(item.valorPendente || 0) > 0 ? ` • Restante: ${dinheiro(item.valorPendente)}` : ""}</small>
        </div>
      </td>
      <td>${comissaoTexto}</td>
      <td>
        <div class="botoes">
          <button class="btn-editar" onclick="editarLancamento('${item.id}')">Editar</button>
          <button class="btn-excluir" onclick="excluirLancamento('${item.id}')">Excluir</button>
        </div>
      </td>
    `;

    tabela.appendChild(tr);
  });

  const totalExibido = registros.reduce(
    (total, item) => total + Number(item.valor || 0),
    0
  );
  const totalElemento = document.getElementById("totalLancamentosExibidos");
  if (totalElemento) totalElemento.textContent = dinheiro(totalExibido);

  atualizarResumo();
}

function atualizarResumo() {
  const entradas = lancamentos
    .filter(item => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.valor), 0);

  const saidas = lancamentos
    .filter(item => item.tipo === "saida")
    .reduce((total, item) => total + Number(item.valor), 0);

  const comissoes = lancamentos
    .filter(item => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.comissaoValor || 0), 0);

  totalEntradas.textContent = dinheiro(entradas);
  totalSaidas.textContent = dinheiro(saidas);
  saldo.textContent = dinheiro(entradas - saidas);
  totalComissoes.textContent = dinheiro(comissoes);
}

atualizarComissaoCampo();
renderizar();

// Disponibiliza as funções para os botões da tabela.
window.editarLancamento = editarLancamento;
window.excluirLancamento = excluirLancamento;


// ==================== ESTOQUE ====================

const formEstoque = document.getElementById("formEstoque");
const idEstoqueEdicao = document.getElementById("idEstoqueEdicao");
const produtoEstoque = document.getElementById("produtoEstoque");
const codigoProduto = document.getElementById("codigoProduto");
const quantidadeEstoque = document.getElementById("quantidadeEstoque");
const precoCusto = document.getElementById("precoCusto");
const precoVenda = document.getElementById("precoVenda");
const estoqueMinimo = document.getElementById("estoqueMinimo");
const tabelaEstoque = document.getElementById("tabelaEstoque");
const mensagemEstoqueVazio = document.getElementById("mensagemEstoqueVazio");
const contadorEstoque = document.getElementById("contadorEstoque");
const filtroEstoque = document.getElementById("filtroEstoque");
const totalEstoqueItens = document.getElementById("totalEstoqueItens");
const totalProdutosEstoque = document.getElementById("totalProdutosEstoque");
const tituloEstoque = document.getElementById("tituloEstoque");
const btnSalvarEstoque = document.getElementById("btnSalvarEstoque");
const btnCancelarEstoque = document.getElementById("btnCancelarEstoque");

function salvarEstoque() {
  localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(estoque));
}

precoCusto.addEventListener("input", () => {
  if (!idEstoqueEdicao.value) {
    const custoDigitado = Number(precoCusto.value || 0);
    precoVenda.value = custoDigitado > 0 ? calcularPrecoVenda(custoDigitado).toFixed(2) : "";
  }
});

formEstoque.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const quantidade = Number(quantidadeEstoque.value);
  const custo = Number(precoCusto.value || 0);
  const venda = Number(precoVenda.value || 0);
  const minimo = Number(estoqueMinimo.value || 0);

  if (!produtoEstoque.value.trim()) {
    alert("Informe o nome do produto.");
    return;
  }

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    alert("A quantidade deve ser um número inteiro igual ou maior que zero.");
    return;
  }

  if (custo < 0 || venda < 0 || minimo < 0) {
    alert("Os valores não podem ser negativos.");
    return;
  }

  const id = idEstoqueEdicao.value;

  const produto = {
    id: id || crypto.randomUUID(),
    nome: produtoEstoque.value.trim(),
    codigo: codigoProduto.value.trim(),
    quantidade,
    precoCusto: custo,
    precoVenda: venda,
    estoqueMinimo: minimo
  };

  if (id) {
    const indice = estoque.findIndex(item => item.id === id);
    if (indice !== -1) estoque[indice] = produto;
  } else {
    estoque.push(produto);
  }

  salvarEstoque();
  renderizarEstoque();
  limparFormularioEstoque();
});

function editarProdutoEstoque(id) {
  const produto = estoque.find(item => item.id === id);
  if (!produto) return;

  idEstoqueEdicao.value = produto.id;
  produtoEstoque.value = produto.nome;
  codigoProduto.value = produto.codigo;
  quantidadeEstoque.value = produto.quantidade;
  precoCusto.value = produto.precoCusto;
  precoVenda.value = produto.precoVenda;
  estoqueMinimo.value = produto.estoqueMinimo;

  tituloEstoque.textContent = "Editar produto do estoque";
  btnSalvarEstoque.textContent = "Salvar alterações";
  btnCancelarEstoque.classList.remove("oculto");

  window.scrollTo({ top: document.getElementById("formEstoque").offsetTop - 20, behavior: "smooth" });
}

function excluirProdutoEstoque(id) {
  const produto = estoque.find(item => item.id === id);
  if (!produto) return;

  if (!confirm(`Excluir o produto "${produto.nome}" do estoque?`)) return;

  estoque = estoque.filter(item => item.id !== id);
  salvarEstoque();
  renderizarEstoque();

  if (idEstoqueEdicao.value === id) limparFormularioEstoque();
}

function limparFormularioEstoque() {
  formEstoque.reset();
  idEstoqueEdicao.value = "";
  estoqueMinimo.value = 0;
  tituloEstoque.textContent = "Cadastro de produto em estoque";
  btnSalvarEstoque.textContent = "Adicionar produto";
  btnCancelarEstoque.classList.add("oculto");
}

btnCancelarEstoque.addEventListener("click", limparFormularioEstoque);

filtroEstoque.addEventListener("input", renderizarEstoque);



// Registrar venda diretamente pelo estoque, sem precisar da antiga tela de Lançamentos.
function venderProdutoEstoque(id) {
  const produto = estoque.find(item => item.id === id);
  if (!produto) return;

  const quantidadeAtual = Number(produto.quantidade || 0);
  if (quantidadeAtual < 1) {
    alert("Este produto não tem unidades disponíveis no estoque.");
    return;
  }

  const nomeClienteVenda = prompt(`Quem comprou "${produto.nome}"?`);
  if (nomeClienteVenda === null || !nomeClienteVenda.trim()) return;

  const nomeVendedorVenda = prompt(`Informe o nome do vendedor responsável pela venda de "${produto.nome}":`);
  if (nomeVendedorVenda === null || !nomeVendedorVenda.trim()) return;

  const precoUnitario = Number(produto.precoVenda || calcularPrecoVenda(produto.precoCusto) || 0);
  if (!(precoUnitario > 0)) {
    alert("Cadastre um preço de venda válido para este produto antes de vendê-lo.");
    return;
  }

  if (!confirm(`Confirmar venda de 1 unidade de "${produto.nome}" por ${dinheiro(precoUnitario)}?`)) return;

  const dataVenda = dataHoje();
  const idVenda = crypto.randomUUID();
  const percentual = Number(comissaoPadrao || 0);
  const registroVenda = {
    id: idVenda,
    tipo: "entrada",
    data: dataVenda,
    descricao: produto.nome,
    quantidade: 1,
    custoUnitario: Number(produto.precoCusto || 0),
    precoVendaUnitario: precoUnitario,
    valor: precoUnitario,
    vendedor: nomeVendedorVenda.trim(),
    cliente: nomeClienteVenda.trim(),
    pagamento: "",
    dataPrevistaPagamento: dataVenda,
    dataEfetivaPagamento: "",
    statusPagamento: "pendente",
    valorPago: 0,
    valorPendente: precoUnitario,
    comissaoPercentual: percentual,
    comissaoValor: precoUnitario * percentual / 100,
    observacao: "Venda registrada diretamente pelo estoque"
  };

  lancamentos.push(registroVenda);
  salvarDados();

  // Registra a compra na página Clientes / Contas a Receber.
  const chaveClientes = "controleNaturaClientes";
  const clientesAtuais = JSON.parse(localStorage.getItem(chaveClientes) || "[]");
  clientesAtuais.push({
    id: crypto.randomUUID(),
    lancamentoId: idVenda,
    cliente: nomeClienteVenda.trim(),
    produto: produto.nome,
    valor: precoUnitario,
    valorPago: 0,
    valorPendente: precoUnitario,
    dataCompra: dataVenda,
    vencimento: dataVenda,
    formaPagamento: "",
    vendedor: nomeVendedorVenda.trim(),
    status: "pendente",
    observacao: "Venda registrada pelo estoque"
  });
  localStorage.setItem(chaveClientes, JSON.stringify(clientesAtuais));

  // Ao vender a última unidade, o produto deixa de aparecer no estoque.
  produto.quantidade = quantidadeAtual - 1;
  if (produto.quantidade <= 0) {
    estoque = estoque.filter(item => item.id !== id);
  }
  salvarEstoque();
  renderizarEstoque();
  renderizar();
  alert(`Venda registrada. ${produto.quantidade <= 0 ? "O produto saiu do estoque por não haver mais unidades." : `Restam ${produto.quantidade} unidade(s) no estoque.`}`);
}

window.venderProdutoEstoque = venderProdutoEstoque;


function renderizarEstoque() {
  const texto = filtroEstoque.value.trim().toLowerCase();

  const produtos = estoque.filter(item =>
    Number(item.quantidade || 0) > 0 &&
    (!texto ||
      item.nome.toLowerCase().includes(texto) ||
      String(item.codigo || "").toLowerCase().includes(texto))
  );

  tabelaEstoque.innerHTML = "";
  contadorEstoque.textContent =
    `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`;
  mensagemEstoqueVazio.style.display = produtos.length ? "none" : "block";

  produtos.forEach(item => {
    let status;

    if (item.quantidade === 0) {
      status = '<span class="estoque-zerado">Sem estoque</span>';
    } else if (item.estoqueMinimo > 0 && item.quantidade <= item.estoqueMinimo) {
      status = '<span class="alerta-estoque">Estoque baixo</span>';
    } else {
      status = '<span class="estoque-ok">Normal</span>';
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="col-selecao">
        <input class="check-estoque" type="checkbox" data-id="${escaparAtributo(item.id)}">
      </td>
      <td><strong>${escaparHTML(item.nome)}</strong></td>
      <td><strong>${Number(item.quantidade || 0)}</strong></td>
      <td>${Number(item.estoqueMinimo || 0)}</td>
      <td>${dinheiro(item.precoCusto)}</td>
      <td>${dinheiro(item.precoVenda)}</td>
      <td>${status}</td>
      <td>
        <div class="botoes">
          <button class="btn-editar" onclick="editarProdutoEstoque('${item.id}')">Editar</button>
          <button class="btn-vendido" onclick="venderProdutoEstoque('${item.id}')">💰 Vendido</button>
          <button class="btn-excluir" onclick="excluirProdutoEstoque('${item.id}')">Excluir</button>
        </div>
      </td>
    `;

    tabelaEstoque.appendChild(tr);
  });

  atualizarResumoEstoque();

  const totalValor = estoque.reduce(
    (total, item) => total + Number(item.quantidade || 0) * Number(item.precoCusto || 0), 0
  );
  const totalValorElemento = document.getElementById("totalValorEstoque");
  if (totalValorElemento) totalValorElemento.innerHTML = `<strong>${dinheiro(totalValor)}</strong>`;

  const selecionarTodos = document.getElementById("selecionarTodosEstoque");
  if (selecionarTodos) selecionarTodos.checked = produtos.length > 0 &&
    produtos.every(item => document.querySelector(`.check-estoque[data-id="${CSS.escape(item.id)}"]`)?.checked);
}

function atualizarResumoEstoque() {
  const quantidadeTotal = estoque.reduce(
    (total, item) => total + Number(item.quantidade || 0), 0
  );

  totalEstoqueItens.textContent = quantidadeTotal;
  totalProdutosEstoque.textContent = estoque.length;
}

window.editarProdutoEstoque = editarProdutoEstoque;
window.excluirProdutoEstoque = excluirProdutoEstoque;

renderizarEstoque();


// ==================== SELEÇÃO E EDIÇÃO EM MASSA ====================

const selecionarTodosEstoque = document.getElementById("selecionarTodosEstoque");
const selecionarTodosLancamentos = document.getElementById("selecionarTodosLancamentos");
const btnEditarSelecionadosEstoque = document.getElementById("btnEditarSelecionadosEstoque");
const btnEditarSelecionadosLancamentos = document.getElementById("btnEditarSelecionadosLancamentos");

const modalEdicaoMassa = document.getElementById("modalEdicaoMassa");
const tituloEdicaoMassa = document.getElementById("tituloEdicaoMassa");
const massaVendedor = document.getElementById("massaVendedor");
const massaComissao = document.getElementById("massaComissao");
const massaStatus = document.getElementById("massaStatus");
const massaMinimo = document.getElementById("massaMinimo");
const massaCusto = document.getElementById("massaCusto");
const massaVenda = document.getElementById("massaVenda");
const massaQuantidade = document.getElementById("massaQuantidade");
const massaVendedorInput = document.getElementById("massaVendedorInput");
const massaComissaoInput = document.getElementById("massaComissaoInput");
const massaStatusInput = document.getElementById("massaStatusInput");
const massaMinimoInput = document.getElementById("massaMinimoInput");
const massaCustoInput = document.getElementById("massaCustoInput");
const massaVendaInput = document.getElementById("massaVendaInput");
const massaQuantidadeInput = document.getElementById("massaQuantidadeInput");

let modoEdicaoMassa = "";
let idsEdicaoMassa = [];

function abrirEdicaoMassa(modo) {
  const classe = modo === "estoque" ? ".check-estoque:checked" : ".check-lancamento:checked";
  idsEdicaoMassa = [...document.querySelectorAll(classe)].map(el => el.dataset.id);

  if (!idsEdicaoMassa.length) {
    alert("Selecione pelo menos um item para editar.");
    return;
  }

  modoEdicaoMassa = modo;
  tituloEdicaoMassa.textContent =
    `${modo === "estoque" ? "Editar estoque" : "Editar lançamentos"} (${idsEdicaoMassa.length} selecionado(s))`;

  massaVendedor.classList.toggle("oculto", modo !== "lancamento");
  massaComissao.classList.toggle("oculto", modo !== "lancamento");
  massaStatus.classList.toggle("oculto", modo !== "lancamento");

  massaMinimo.classList.toggle("oculto", modo !== "estoque");
  massaCusto.classList.toggle("oculto", modo !== "estoque");
  massaVenda.classList.toggle("oculto", modo !== "estoque");
  massaQuantidade.classList.toggle("oculto", modo !== "estoque");

  massaVendedorInput.value = "";
  massaComissaoInput.value = "";
  massaStatusInput.value = "";
  massaMinimoInput.value = "";
  massaCustoInput.value = "";
  massaVendaInput.value = "";
  massaQuantidadeInput.value = "";

  modalEdicaoMassa.classList.remove("oculto");
}

function fecharEdicaoMassa() {
  modalEdicaoMassa.classList.add("oculto");
  idsEdicaoMassa = [];
  modoEdicaoMassa = "";
}

document.getElementById("btnFecharEdicaoMassa").addEventListener("click", fecharEdicaoMassa);
document.getElementById("btnCancelarEdicaoMassa").addEventListener("click", fecharEdicaoMassa);

document.getElementById("btnSalvarEdicaoMassa").addEventListener("click", () => {
  if (!idsEdicaoMassa.length) return;

  if (modoEdicaoMassa === "estoque") {
    const temQuantidade = massaQuantidadeInput.value !== "";
    const temMinimo = massaMinimoInput.value !== "";
    const temCusto = massaCustoInput.value !== "";
    const temVenda = massaVendaInput.value !== "";

    if (!temQuantidade && !temMinimo && !temCusto && !temVenda) {
      alert("Informe pelo menos um campo para alterar.");
      return;
    }

    estoque.forEach(item => {
      if (!idsEdicaoMassa.includes(item.id)) return;

      if (temQuantidade) item.quantidade = Number(massaQuantidadeInput.value);
      if (temMinimo) item.estoqueMinimo = Number(massaMinimoInput.value);

      if (temCusto) {
        item.precoCusto = Number(massaCustoInput.value);
        if (!temVenda) item.precoVenda = calcularPrecoVenda(item.precoCusto);
      }

      if (temVenda) item.precoVenda = Number(massaVendaInput.value);
    });

    salvarEstoque();
    renderizarEstoque();
  } else {
    const temVendedor = massaVendedorInput.value.trim() !== "";
    const temComissao = massaComissaoInput.value !== "";
    const temStatus = massaStatusInput.value !== "";

    if (!temVendedor && !temComissao && !temStatus) {
      alert("Informe pelo menos um campo para alterar.");
      return;
    }

    lancamentos.forEach(item => {
      if (!idsEdicaoMassa.includes(item.id)) return;

      if (temVendedor) item.vendedor = massaVendedorInput.value.trim();

      if (temComissao && item.tipo === "entrada") {
        const percentual = Number(massaComissaoInput.value);
        if (percentual < 0 || percentual > 100) return;
        item.comissaoPercentual = percentual;
        item.comissaoValor = Number(item.valor || 0) * percentual / 100;
      }

      if (temStatus) {
        item.statusPagamento = massaStatusInput.value;

        if (item.statusPagamento === "total") {
          item.valorPago = Number(item.valor || 0);
          item.valorPendente = 0;
          item.dataEfetivaPagamento = item.dataEfetivaPagamento || dataHoje();
        } else if (item.statusPagamento === "pendente") {
          item.valorPago = 0;
          item.valorPendente = Number(item.valor || 0);
        }
      }
    });

    salvarDados();
    renderizar();
  }

  fecharEdicaoMassa();
  alert("Alterações salvas com sucesso.");
});

selecionarTodosEstoque?.addEventListener("change", () => {
  document.querySelectorAll(".check-estoque").forEach(check => {
    check.checked = selecionarTodosEstoque.checked;
  });
});

selecionarTodosLancamentos?.addEventListener("change", () => {
  document.querySelectorAll(".check-lancamento").forEach(check => {
    check.checked = selecionarTodosLancamentos.checked;
  });
});

btnEditarSelecionadosEstoque?.addEventListener("click", () => abrirEdicaoMassa("estoque"));
btnEditarSelecionadosLancamentos?.addEventListener("click", () => abrirEdicaoMassa("lancamento"));

document.addEventListener("change", (evento) => {
  if (evento.target.matches(".check-estoque") && !evento.target.checked && selecionarTodosEstoque) {
    selecionarTodosEstoque.checked = false;
  }
  if (evento.target.matches(".check-lancamento") && !evento.target.checked && selecionarTodosLancamentos) {
    selecionarTodosLancamentos.checked = false;
  }
});

// ==================== IMPORTAÇÃO POR PRINT (OCR) ====================

const arquivoPrint = document.getElementById("arquivoPrint");
const arquivoPrintLancamento = document.getElementById("arquivoPrintLancamento");
const btnImportarPrint = document.getElementById("btnImportarPrint");
const btnImportarPrintLancamento = document.getElementById("btnImportarPrintLancamento");
const modalImportacao = document.getElementById("modalImportacao");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelarImportacao = document.getElementById("btnCancelarImportacao");
const btnImportarSelecionados = document.getElementById("btnImportarSelecionados");
const tabelaImportacao = document.getElementById("tabelaImportacao");
const statusOCR = document.getElementById("statusOCR");
const progressoOCR = document.getElementById("progressoOCR");
const barraOCR = document.getElementById("barraOCR");
const textoProgressoOCR = document.getElementById("textoProgressoOCR");
const mensagemOCR = document.getElementById("mensagemOCR");
const selecionarTodosImportacao = document.getElementById("selecionarTodosImportacao");
const destinoImportacao = document.getElementById("destinoImportacao");
const ajudaDestinoImportacao = document.getElementById("ajudaDestinoImportacao");
const thVendedorImportacao = document.getElementById("thVendedorImportacao");
const thComissaoImportacao = document.getElementById("thComissaoImportacao");

let produtosImportacao = [];

function selecionarPrint(destino) {
  destinoImportacao.value = destino;
  atualizarAjudaDestino();
  if (destino === "estoque") arquivoPrint.click();
  else arquivoPrintLancamento.click();
}

btnImportarPrint.addEventListener("click", () => selecionarPrint("estoque"));
btnImportarPrintLancamento.addEventListener("click", () => selecionarPrint("lancamento"));

arquivoPrint.addEventListener("change", async () => {
  const arquivo = arquivoPrint.files[0];
  if (!arquivo) return;
  destinoImportacao.value = "estoque";
  abrirModalImportacao();
  await lerPrintComOCR(arquivo);
  arquivoPrint.value = "";
});

arquivoPrintLancamento.addEventListener("change", async () => {
  const arquivo = arquivoPrintLancamento.files[0];
  if (!arquivo) return;
  destinoImportacao.value = "lancamento";
  abrirModalImportacao();
  await lerPrintComOCR(arquivo);
  arquivoPrintLancamento.value = "";
});

function atualizarAjudaDestino() {
  if (!ajudaDestinoImportacao) return;

  const ehLancamento = destinoImportacao.value === "lancamento";

  ajudaDestinoImportacao.innerHTML = ehLancamento
    ? "O valor do print é o <strong>CUSTO</strong>. A venda será custo ÷ 0,70. Informe o vendedor e a comissão (padrão 30%, mas pode alterar)."
    : "O valor do print é o <strong>CUSTO</strong>. A venda será calculada por custo ÷ 0,70 (30% de lucro sobre a venda). A quantidade será adicionada ao estoque.";

  if (thVendedorImportacao) thVendedorImportacao.classList.toggle("oculto", !ehLancamento);
  if (thComissaoImportacao) thComissaoImportacao.classList.toggle("oculto", !ehLancamento);
}

destinoImportacao.addEventListener("change", () => {
  atualizarAjudaDestino();
  if (produtosImportacao.length) renderizarImportacao();
});

function abrirModalImportacao() {
  modalImportacao.classList.remove("oculto");
  tabelaImportacao.innerHTML = "";
  mensagemOCR.classList.add("oculto");
  progressoOCR.classList.add("oculto");
  statusOCR.textContent = "Preparando leitura...";
  selecionarTodosImportacao.checked = true;
  atualizarAjudaDestino();
}

function fecharModalImportacao() {
  modalImportacao.classList.add("oculto");
  produtosImportacao = [];
}

btnFecharModal.addEventListener("click", fecharModalImportacao);
btnCancelarImportacao.addEventListener("click", fecharModalImportacao);

modalImportacao.addEventListener("click", (evento) => {
  if (evento.target === modalImportacao) fecharModalImportacao();
});

selecionarTodosImportacao.addEventListener("change", () => {
  document.querySelectorAll(".check-importacao").forEach(check => {
    check.checked = selecionarTodosImportacao.checked;
  });
});

async function lerPrintComOCR(arquivo) {
  try {
    if (typeof Tesseract === "undefined") {
      throw new Error("A biblioteca de leitura de imagem não foi carregada.");
    }

    progressoOCR.classList.remove("oculto");
    statusOCR.textContent = "Lendo o print...";
    barraOCR.style.width = "0%";

    const resultado = await Tesseract.recognize(
      arquivo,
      "por+eng",
      {
        logger: mensagem => {
          if (mensagem.status === "recognizing text") {
            const percentual = Math.round((mensagem.progress || 0) * 100);
            barraOCR.style.width = `${percentual}%`;
            textoProgressoOCR.textContent = `Lendo imagem... ${percentual}%`;
          } else if (mensagem.status) {
            textoProgressoOCR.textContent = "Preparando leitura...";
          }
        }
      }
    );

    const texto = resultado.data.text || "";
    produtosImportacao = interpretarTextoOCR(texto, resultado.data.words || []);

    progressoOCR.classList.add("oculto");

    if (!produtosImportacao.length) {
      statusOCR.textContent = "Não consegui identificar produtos automaticamente.";
      mensagemOCR.textContent =
        "Tente usar um print mais nítido, com a lista inteira visível.";
      mensagemOCR.classList.remove("oculto");
      return;
    }

    statusOCR.textContent =
      `${produtosImportacao.length} produto(s) encontrado(s). Confira os dados antes de importar.`;
    renderizarImportacao();
  } catch (erro) {
    console.error(erro);
    progressoOCR.classList.add("oculto");
    statusOCR.textContent = "Erro ao ler o print.";
    mensagemOCR.textContent = erro.message || "Não foi possível processar a imagem.";
    mensagemOCR.classList.remove("oculto");
  }
}

function interpretarTextoOCR(texto, palavrasOCR = []) {
  if (Array.isArray(palavrasOCR) && palavrasOCR.length > 10) {
    const porPosicao = interpretarOCRPorPosicao(palavrasOCR);
    if (porPosicao.length) return porPosicao;
  }

  const linhas = texto.split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const encontrados = [];
  for (const linha of linhas) {
    const valorMatch = linha.match(/(?:R\$\s*)?(\d{1,6}(?:[.,]\d{2}))(?!\d)/);
    if (!valorMatch) continue;
    const valor = parseNumeroBR(valorMatch[1]);
    const codigos = [...linha.matchAll(/\b\d{4,8}\b/g)].map(m => m[0]);
    const codigo = codigos.length ? codigos[0] : "";
    const qtdMatch = linha.match(/(?:qtd|qtde|quantidade)\s*[:\-]?\s*(\d{1,3})/i);
    let quantidade = qtdMatch ? Number(qtdMatch[1]) : null;
    if (quantidade === null) {
      const pequenos = [...linha.matchAll(/\b([1-9]\d?)\b/g)].map(m => Number(m[1]));
      quantidade = pequenos.length ? pequenos[0] : 1;
    }
    const pontosMatch = linha.match(/(?:pontos?|pts?)\s*[:\-]?\s*(\d{1,5})/i);
    const pontos = pontosMatch ? Number(pontosMatch[1]) : 0;
    const nome = linha.replace(/R\$\s*\d{1,6}(?:[.,]\d{2})/gi, "").replace(/\b\d{1,8}\b/g, " ").replace(/\b(qtd|qtde|quantidade|pontos?|pts?|referência|referencia|valor)\b/gi, " ").replace(/[|;]+/g, " ").replace(/\s+/g, " ").trim();
    if (!nome || nome.length < 3) continue;
    encontrados.push({nome, codigo, quantidade: Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 1, pontos, valor});
  }
  return removerDuplicadosImportacao(encontrados);
}

function interpretarOCRPorPosicao(words) {
  const validas = words.map(w => ({...w, text: String(w.text || "").trim()})).filter(w => w.text && w.bbox && Number.isFinite(w.bbox.left));
  if (!validas.length) return [];
  const largura = Math.max(...validas.map(w => w.bbox.right || 0), 1);
  const ordenadas = [...validas].sort((a,b) => a.bbox.top-b.bbox.top);
  const grupos = [];
  const tolerancia = 12;
  for (const w of ordenadas) {
    const cy=(w.bbox.top+w.bbox.bottom)/2;
    let g=grupos.find(x=>Math.abs(x.cy-cy)<=tolerancia);
    if(!g){g={cy,words:[]};grupos.push(g);}
    g.words.push(w); g.cy=g.words.reduce((s,x)=>s+(x.bbox.top+x.bbox.bottom)/2,0)/g.words.length;
  }
  const out=[];
  for(const g of grupos){
    const ws=g.words.sort((a,b)=>a.bbox.left-b.bbox.left);
    const money=ws.find(w=>/\d{1,6}[.,]\d{2}/.test(w.text));
    if(!money) continue;
    const vm=money.text.match(/(\d{1,6}[.,]\d{2})/); if(!vm) continue;
    const valor=parseNumeroBR(vm[1]); if(!valor) continue;
    const cx=w=>((w.bbox.left+w.bbox.right)/2)/largura;
    const qtd=ws.find(w=>{const x=cx(w),t=w.text.replace(/\D/g,""); return x>=.54&&x<=.66&&/^\d{1,2}$/.test(t);});
    const pts=ws.find(w=>{const x=cx(w),t=w.text.replace(/\D/g,""); return x>=.64&&x<=.75&&/^\d{1,4}$/.test(t);});
    const cod=ws.find(w=>cx(w)<.62&&/\d{4,8}/.test(w.text)&&!/\d+[.,]\d{2}/.test(w.text));
    const nomeWords=ws.filter(w=>{const x=cx(w),t=w.text; return x>=.42&&x<=.61&&!/^natura$/i.test(t)&&!/\d{4,8}/.test(t)&&!/\d+[.,]\d{2}/.test(t)&&!/^c[oó]d/i.test(t);});
    let nome=nomeWords.map(w=>w.text).join(" ").replace(/^natura\s*/i,"").trim();
    if(nome.length<3) continue;
    out.push({nome,codigo:cod?(cod.text.match(/\d{4,8}/)||[""])[0]:"",quantidade:qtd?Number(qtd.text.replace(/\D/g,"")):1,pontos:pts?Number(pts.text.replace(/\D/g,"")):0,valor});
  }
  return removerDuplicadosImportacao(out);
}

function removerDuplicadosImportacao(lista){
  return lista.filter((p,i,a)=>a.findIndex(o=>o.nome.toLowerCase()===p.nome.toLowerCase()&&o.codigo===p.codigo&&o.valor===p.valor)===i);
}

function parseNumeroBR(valorTexto) {
  let texto = String(valorTexto).replace(/\s/g, "");

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function escaparAtributo(texto) {
  return escaparHTML(texto).replaceAll("`", "&#096;");
}

function renderizarImportacao() {
  tabelaImportacao.innerHTML = "";
  const ehLancamento = destinoImportacao.value === "lancamento";

  produtosImportacao.forEach((produto, indice) => {
    const existente = !ehLancamento
      ? encontrarProdutoExistente(produto.codigo, produto.nome)
      : null;
    const custo = Number(produto.valor || 0);
    const venda = calcularPrecoVenda(custo);
    const valorTotal = venda * Number(produto.quantidade || 1);
    const comissao = Number(produto.comissaoPercentual ?? comissaoPadrao);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input class="check-importacao" type="checkbox" data-indice="${indice}" checked></td>
      <td>
        <input class="campo-importacao" data-campo="nome" data-indice="${indice}"
               value="${escaparAtributo(produto.nome)}">
        ${existente ? `<small class="produto-existente">⚠️ Já cadastrado — quantidade será somada</small>` : ""}
      </td>
      <td>
        <input class="campo-importacao curto" data-campo="codigo" data-indice="${indice}"
               value="${escaparAtributo(produto.codigo)}">
      </td>
      <td>
        <input class="campo-importacao numero" type="number" min="1" step="1"
               data-campo="quantidade" data-indice="${indice}" value="${produto.quantidade}">
      </td>
      <td>
        <strong>${dinheiro(custo)}</strong>
        <small class="descricao-importacao">Custo do print</small>
        <input class="campo-importacao numero" type="hidden" data-campo="valor" data-indice="${indice}" value="${custo.toFixed(2)}">
      </td>
      <td>
        <strong>${dinheiro(venda)}</strong>
        <small class="descricao-importacao">Custo ÷ 0,70</small>
      </td>
      <td>
        <strong>${dinheiro(ehLancamento ? valorTotal : Number(produto.quantidade || 1) * custo)}</strong>
        <small class="descricao-importacao">${ehLancamento ? "Total da venda" : "Valor do estoque"}</small>
      </td>
      ${ehLancamento ? `
        <td>
          <input class="campo-importacao" data-campo="vendedor" data-indice="${indice}"
                 value="${escaparAtributo(produto.vendedor || "")}" placeholder="Nome">
        </td>
        <td>
          <input class="campo-importacao numero" type="number" min="0" max="100" step="0.01"
                 data-campo="comissaoPercentual" data-indice="${indice}" value="${comissao.toFixed(2)}">
        </td>
      ` : ""}
    `;

    tabelaImportacao.appendChild(tr);
  });

  document.querySelectorAll(".campo-importacao").forEach(campo => {
    campo.addEventListener("input", () => {
      const indice = Number(campo.dataset.indice);
      const nomeCampo = campo.dataset.campo;
      if (!produtosImportacao[indice]) return;
      produtosImportacao[indice][nomeCampo] =
        ["quantidade", "valor", "pontos", "comissaoPercentual"].includes(nomeCampo)
          ? Number(campo.value)
          : campo.value;
    });
  });
}

function encontrarProdutoExistente(codigo, nome) {
  if (codigo) {
    const porCodigo = estoque.find(item => item.codigo === codigo);
    if (porCodigo) return porCodigo;
  }

  return estoque.find(item =>
    item.nome.trim().toLowerCase() === nome.trim().toLowerCase()
  );
}

btnImportarSelecionados.addEventListener("click", () => {
  const selecionados = [...document.querySelectorAll(".check-importacao:checked")]
    .map(check => produtosImportacao[Number(check.dataset.indice)])
    .filter(Boolean);

  if (!selecionados.length) {
    alert("Selecione pelo menos um produto.");
    return;
  }

  if (destinoImportacao.value === "estoque") {
    importarParaEstoque(selecionados);
  } else {
    importarParaLancamentos(selecionados);
  }
});

function importarParaEstoque(selecionados) {
  let novos = 0;
  let atualizados = 0;

  for (const produtoImportado of selecionados) {
    const custo = Number(produtoImportado.valor || 0);
    const venda = calcularPrecoVenda(custo);
    const produtoExistente = encontrarProdutoExistente(
      produtoImportado.codigo,
      produtoImportado.nome
    );

    if (produtoExistente) {
      produtoExistente.quantidade += Number(produtoImportado.quantidade || 0);
      produtoExistente.precoCusto = custo;
      produtoExistente.precoVenda = venda;
      atualizados++;
    } else {
      estoque.push({
        id: crypto.randomUUID(),
        nome: String(produtoImportado.nome).trim(),
        codigo: String(produtoImportado.codigo || "").trim(),
        quantidade: Number(produtoImportado.quantidade || 0),
        precoCusto: custo,
        precoVenda: venda,
        estoqueMinimo: 0
      });
      novos++;
    }
  }

  salvarEstoque();
  renderizarEstoque();
  fecharModalImportacao();

  alert(
    `Importação para o estoque concluída!\n\n` +
    `Novos produtos: ${novos}\n` +
    `Produtos com quantidade somada: ${atualizados}\n\n` +
    `O valor do print foi usado como CUSTO.\n` +
    `Preço de venda = custo ÷ 0,70.`
  );
}

function importarParaLancamentos(selecionados) {
  const dataLancamento = dataHoje();
  let total = 0;

  for (const produto of selecionados) {
    const quantidade = Number(produto.quantidade || 1);
    const custoUnitario = Number(produto.valor || 0);
    const vendaUnitario = calcularPrecoVenda(custoUnitario);
    const valorTotal = quantidade * vendaUnitario;
    const percentualComissao = Number(produto.comissaoPercentual ?? comissaoPadrao);
    const vendedorNome = String(produto.vendedor || "").trim();
    const lucroTotal = quantidade * calcularLucroVenda(custoUnitario);

    lancamentos.push({
      id: crypto.randomUUID(),
      tipo: "entrada",
      data: dataLancamento,
      descricao: String(produto.nome).trim(),
      valor: valorTotal,
      quantidade: quantidade,
      vendedor: vendedorNome,
      pagamento: "",
      dataPrevistaPagamento: dataLancamento,
      dataEfetivaPagamento: "",
      statusPagamento: "pendente",
      valorPago: 0,
      valorPendente: valorTotal,
      comissaoPercentual: Number.isFinite(percentualComissao) ? percentualComissao : comissaoPadrao,
      comissaoValor: valorTotal * ((Number.isFinite(percentualComissao) ? percentualComissao : comissaoPadrao) / 100),
      observacao:
        `Importado por print • Custo unitário: ${dinheiro(custoUnitario)} • ` +
        `Venda unitária: ${dinheiro(vendaUnitario)} • Lucro 30%: ${dinheiro(lucroTotal)}` +
        `${produto.codigo ? ` • Código: ${produto.codigo}` : ""}` +
        `${produto.pontos ? ` • Pontos: ${produto.pontos}` : ""}`
    });

    total += valorTotal;
  }

  salvarDados();
  renderizar();
  fecharModalImportacao();

  alert(
    `Importação para lançamentos concluída!\n\n` +
    `Total de vendas: ${dinheiro(total)}\n` +
    `O print foi tratado como CUSTO e a venda foi calculada por custo ÷ 0,70.`
  );
}


// ==================== EXPORTAÇÕES ====================

function nomeArquivoData(prefixo, extensao) {
  const agora = new Date();
  const dataArquivo = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  return `${prefixo}_${dataArquivo}.${extensao}`;
}

function exportarLancamentosExcel() {
  if (typeof XLSX === "undefined") {
    alert("A biblioteca do Excel não foi carregada. Verifique sua internet e tente novamente.");
    return;
  }

  const registros = obterFiltrados();
  if (!registros.length) {
    alert("Não há lançamentos para exportar com os filtros atuais.");
    return;
  }

  const dados = registros.map(item => ({
    Data: dataBR(item.data),
    Descrição: item.descricao,
    Quantidade: Number(item.quantidade || 1),
    "Custo unitário": Number(item.custoUnitario ?? ((Number(item.valor || 0) / Number(item.quantidade || 1)) * FATOR_CUSTO_70)),
    "Venda unitária": Number(item.precoVendaUnitario ?? (Number(item.valor || 0) / Number(item.quantidade || 1))),
    "Valor total": Number(item.valor || 0),
    Vendedor: item.vendedor || "",
    "Data prevista": dataBR(item.dataPrevistaPagamento || item.data),
    "Data efetiva": dataBR(item.dataEfetivaPagamento),
    "Status pagamento": statusPagamentoTexto(item.statusPagamento),
    "Valor pago": Number(item.valorPago || 0),
    "Valor pendente": Number(item.valorPendente ?? Math.max(0, Number(item.valor || 0) - Number(item.valorPago || 0))),
    "Comissão %": Number(item.comissaoPercentual || 0),
    "Comissão valor": Number(item.comissaoValor || 0),
    Observação: item.observacao || ""
  }));

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
  XLSX.writeFile(wb, nomeArquivoData("lancamentos_natura", "xlsx"));
}

function exportarEstoqueExcel() {
  if (typeof XLSX === "undefined") {
    alert("A biblioteca do Excel não foi carregada. Verifique sua internet e tente novamente.");
    return;
  }

  if (!estoque.length) {
    alert("Não há produtos no estoque para exportar.");
    return;
  }

  const dados = estoque.map(item => ({
    Produto: item.nome,
    Quantidade: Number(item.quantidade || 0),
    "Estoque mínimo": Number(item.estoqueMinimo || 0),
    "Preço de custo": Number(item.precoCusto || 0),
    "Preço de venda": Number(item.precoVenda || 0),
    Status: item.quantidade === 0 ? "Sem estoque" : (item.estoqueMinimo > 0 && item.quantidade <= item.estoqueMinimo ? "Estoque baixo" : "Normal")
  }));

  dados.push({
    Produto: "TOTAL DO ESTOQUE",
    Quantidade: "",
    "Estoque mínimo": "",
    "Preço de custo": "",
    "Preço de venda": "",
    Status: dinheiro(estoque.reduce(
      (total, item) => total + Number(item.quantidade || 0) * Number(item.precoCusto || 0), 0
    ))
  });

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  XLSX.writeFile(wb, nomeArquivoData("estoque_natura", "xlsx"));
}

function exportarLancamentosPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("A biblioteca do PDF não foi carregada. Verifique sua internet e tente novamente.");
    return;
  }

  const registros = obterFiltrados();
  if (!registros.length) {
    alert("Não há lançamentos para exportar com os filtros atuais.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("Relatório de Lançamentos - Natura", 14, 14);
  doc.setFontSize(9);
  doc.text(`Gerado em ${dataBR(dataHoje())}`, 14, 20);

  const linhas = registros.map(item => [
    dataBR(item.data),
    item.descricao,
    String(item.quantidade || 1),
    dinheiro(item.custoUnitario ?? ((Number(item.valor || 0) / Number(item.quantidade || 1)) * FATOR_CUSTO_70)),
    dinheiro(item.precoVendaUnitario ?? (Number(item.valor || 0) / Number(item.quantidade || 1))),
    dinheiro(item.valor),
    item.vendedor || "-",
    statusPagamentoTexto(item.statusPagamento),
    dataBR(item.dataPrevistaPagamento || item.data),
    dataBR(item.dataEfetivaPagamento),
    dinheiro(item.valorPago || 0),
    dinheiro(item.valorPendente || 0),
    `${Number(item.comissaoPercentual || 0).toFixed(2)}% (${dinheiro(item.comissaoValor || 0)})`
  ]);

  const totalVendas = registros
    .filter(item => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  doc.autoTable({
    startY: 25,
    head: [["Data", "Produto", "Qtd.", "Custo unit.", "Venda unit.", "Valor total", "Vendedor", "Status", "Prevista", "Efetiva", "Pago", "Pendente", "Comissão"]],
    body: [
      ...linhas,
      [
        { content: "TOTAL DAS VENDAS", colSpan: 5, styles: { fontStyle: "bold" } },
        { content: dinheiro(totalVendas), styles: { fontStyle: "bold" } },
        "", "", "", "", "", "", ""
      ]
    ],
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fontSize: 7 },
    margin: { left: 8, right: 8 }
  });

  doc.save(nomeArquivoData("lancamentos_natura", "pdf"));
}

function exportarEstoquePDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("A biblioteca do PDF não foi carregada. Verifique sua internet e tente novamente.");
    return;
  }

  if (!estoque.length) {
    alert("Não há produtos no estoque para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("Relatório de Estoque - Natura", 14, 14);
  doc.setFontSize(9);
  doc.text(`Gerado em ${dataBR(dataHoje())}`, 14, 20);

  const linhas = estoque.map(item => [
    item.nome,
    String(item.quantidade),
    String(item.estoqueMinimo),
    dinheiro(item.precoCusto),
    dinheiro(item.precoVenda),
    item.quantidade === 0 ? "Sem estoque" : (item.estoqueMinimo > 0 && item.quantidade <= item.estoqueMinimo ? "Estoque baixo" : "Normal")
  ]);

  const totalValorEstoque = estoque.reduce(
    (total, item) => total + Number(item.quantidade || 0) * Number(item.precoCusto || 0), 0
  );

  doc.autoTable({
    startY: 25,
    head: [["Produto", "Qtd.", "Mínimo", "Custo", "Venda", "Status"]],
    body: [
      ...linhas,
      [
        { content: "TOTAL DO ESTOQUE", colSpan: 5, styles: { fontStyle: "bold" } },
        { content: dinheiro(totalValorEstoque), styles: { fontStyle: "bold" } }
      ]
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fontSize: 8 },
    margin: { left: 10, right: 10 }
  });

  doc.save(nomeArquivoData("estoque_natura", "pdf"));
}

const btnExportarExcel = document.getElementById("btnExportarExcel");
const btnExportarPDF = document.getElementById("btnExportarPDF");
const btnExportarEstoqueExcel = document.getElementById("btnExportarEstoqueExcel");
const btnExportarEstoquePDF = document.getElementById("btnExportarEstoquePDF");

btnExportarExcel.addEventListener("click", exportarLancamentosExcel);
btnExportarPDF.addEventListener("click", exportarLancamentosPDF);
btnExportarEstoqueExcel.addEventListener("click", exportarEstoqueExcel);
btnExportarEstoquePDF.addEventListener("click", exportarEstoquePDF);