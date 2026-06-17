const $ = (id) => document.getElementById(id);
const camposOcorrencia = ["nome", "telefone", "empresa", "cnpj", "problema", "solucao", "obs"];
const camposVisita = ["visitaEmpresa", "zona", "ns", "endereco", "periodo", "contato", "responsavel", "observacao"];
const camposRevendaEmail = ["revendaRazaoSocial", "revendaCnpj", "revendaDefeito"];
const camposBugReport = [
  "bugCnpj",
  "bugNome",
  "bugUsuarios",
  "bugEquipamentos",
  "bugValorPago",
  "bugTipoEquipamento",
  "bugDominioCliente",
  "bugUrgencia",
  "bugDescricao"
];

let currentModel = "ocorrencia";
let registros = [];
let ultimoResultadoFiltrado = null;
let editingId = null;
let bugReportAberto = false;
let revendaEmailAberto = false;
const ultimoBugAuto = {
  cnpj: "",
  empresa: "",
  descricao: ""
};
const ultimoRevendaAuto = {
  razao: "",
  cnpj: "",
  defeito: ""
};

const mostrarStatus = (msg, erro = false) => {
  const st = $("status");
  if (!st) return;
  st.textContent = msg;
  st.classList.toggle("error", !!erro);
  st.style.display = "inline-block";
  clearTimeout(mostrarStatus._t);
  mostrarStatus._t = setTimeout(() => (st.style.display = "none"), 3500);
};

const escapeHtml = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

function setModelo(modelo) {
  if (modelo === "visita" && currentModel === "ocorrencia") preencherVisitaComOcorrencia();
  currentModel = modelo;
  $("btnModeloOcorrencia")?.classList.toggle("active", modelo === "ocorrencia");
  $("btnModeloVisita")?.classList.toggle("active", modelo === "visita");
  $("btnModeloOcorrencia")?.setAttribute("aria-pressed", String(modelo === "ocorrencia"));
  $("btnModeloVisita")?.setAttribute("aria-pressed", String(modelo === "visita"));
  $("formOcorrencia")?.classList.toggle("active", modelo === "ocorrencia");
  $("formVisita")?.classList.toggle("active", modelo === "visita");
  $("tituloModelo").textContent = modelo === "ocorrencia" ? "Ocorrência" : "Visita Técnica";
  atualizarRotuloBotaoPrincipal();
  atualizarPreview();
}

function preencherCampoSeVazio(id, valor) {
  const el = $(id);
  const novoValor = String(valor || "").trim();
  if (el && !el.value.trim() && novoValor) el.value = novoValor;
}

function preencherVisitaComOcorrencia() {
  preencherCampoSeVazio("visitaEmpresa", $("empresa")?.value);
  preencherCampoSeVazio("responsavel", $("nome")?.value);
  preencherCampoSeVazio("contato", $("telefone")?.value);
  preencherCampoSeVazio("observacao", $("problema")?.value || $("obs")?.value);

  if (revendaEmailAberto) {
    preencherCampoSeVazio("revendaRazaoSocial", $("empresa")?.value || $("nome")?.value);
    preencherCampoSeVazio("revendaCnpj", $("cnpj")?.value);
    preencherCampoSeVazio("revendaDefeito", $("problema")?.value || $("obs")?.value);
  }
}

function setBugReportAberto(aberto) {
  bugReportAberto = !!aberto;
  $("bugReportFields").hidden = !bugReportAberto;
  $("toggleBugReport")?.setAttribute("aria-expanded", String(bugReportAberto));
  document.querySelector(".bug-report")?.classList.toggle("open", bugReportAberto);
  if (bugReportAberto) preencherBugReportComOcorrencia();
  atualizarRotuloBotaoPrincipal();
  atualizarPreview();
}

function setRevendaEmailAberto(aberto) {
  revendaEmailAberto = !!aberto;
  $("revendaEmailFields").hidden = !revendaEmailAberto;
  $("toggleRevendaEmail")?.setAttribute("aria-expanded", String(revendaEmailAberto));
  document.querySelector(".revenda-email")?.classList.toggle("open", revendaEmailAberto);
  if (revendaEmailAberto) preencherRevendaEmailComVisita();
  atualizarRotuloBotaoPrincipal();
  atualizarPreview();
}

function preencherAutomatico(id, valor, chave) {
  const el = $(id);
  const novoValor = String(valor || "");
  if (!el || !novoValor.trim()) return;
  if (!el.value.trim() || el.value === ultimoBugAuto[chave]) {
    el.value = novoValor;
    ultimoBugAuto[chave] = novoValor;
  }
}

function preencherBugReportComOcorrencia() {
  preencherAutomatico("bugCnpj", $("cnpj")?.value, "cnpj");
  preencherAutomatico("bugNome", $("empresa")?.value || $("nome")?.value, "empresa");
  preencherAutomatico("bugDescricao", $("problema")?.value, "descricao");
}

function preencherAutomaticoRevenda(id, valor, chave) {
  const el = $(id);
  const novoValor = String(valor || "");
  if (!el || !novoValor.trim()) return;
  if (!el.value.trim() || el.value === ultimoRevendaAuto[chave]) {
    el.value = novoValor;
    ultimoRevendaAuto[chave] = novoValor;
  }
}

function preencherRevendaEmailComVisita() {
  preencherAutomaticoRevenda("revendaRazaoSocial", $("visitaEmpresa")?.value || $("responsavel")?.value, "razao");
  preencherAutomaticoRevenda("revendaCnpj", $("cnpj")?.value, "cnpj");
  preencherAutomaticoRevenda("revendaDefeito", $("observacao")?.value, "defeito");
}

function limparControleAutoBug() {
  ultimoBugAuto.cnpj = "";
  ultimoBugAuto.empresa = "";
  ultimoBugAuto.descricao = "";
}

function limparControleAutoRevenda() {
  ultimoRevendaAuto.razao = "";
  ultimoRevendaAuto.cnpj = "";
  ultimoRevendaAuto.defeito = "";
}

function atualizarRotuloBotaoPrincipal() {
  const btn = $("copyBtn");
  if (!btn) return;
  if (currentModel === "ocorrencia" && bugReportAberto) btn.textContent = "Copiar bug em tabela e salvar";
  else if (currentModel === "visita" && revendaEmailAberto) btn.textContent = "Copiar e-mail e salvar";
  else if (currentModel === "visita") btn.textContent = "Copiar visita e salvar";
  else btn.textContent = "Copiar ocorrência e salvar";
}

function atualizarDataHora() {
  const d = new Date();
  $("data").value = d.toLocaleDateString("pt-BR");
  $("hora").value = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function montarTextoOcorrencia(obj) {
  const linhas = [
    "----------------------------------------",
    "Tipo: Ocorrência",
    `Data: ${obj.data ?? ""}`,
    `Hora: ${obj.hora ?? ""}`,
    `Cliente: ${obj.nome ?? ""}`,
    `Telefone: ${obj.telefone ?? ""}`,
    `Empresa: ${obj.empresa ?? ""}`,
    `CNPJ: ${obj.cnpj ?? ""}`,
    `Problema: ${obj.problema ?? ""}`,
    `Solução: ${obj.solucao ?? ""}`,
    `Observações: ${obj.obs ?? ""}`
  ];

  if (Number(obj.bug_ativo || 0)) linhas.push("", montarTextoBugReport(obj));

  return linhas.join("\n");
}

function montarTextoBugReport(obj) {
  return [
    "Poderiam checar e enviar esse pedido de bug para a engenharia checar por favor?",
    "",
    `CNPJ: ${obj.bug_cnpj || obj.cnpj || ""}`,
    `Empresa: ${obj.bug_nome || obj.empresa || obj.nome || ""}`,
    `Nº de usuários: ${obj.bug_usuarios ?? ""}`,
    `Nº de equipamentos: ${obj.bug_equipamentos ?? ""}`,
    `Valor pago: ${obj.bug_valor_pago ?? ""}`,
    `Tipo de equipamento: ${obj.bug_tipo_equipamento ?? ""}`,
    `Domínio do cliente: ${obj.bug_dominio_cliente ?? ""}`,
    `Urgência: ${obj.bug_urgencia ?? ""}`,
    "",
    "Descrição do bug:",
    `${obj.bug_descricao ?? ""}`
  ].join("\n");
}

function montarTextoVisita(obj) {
  const linhas = [
    `Empresa: ${obj.empresa ?? ""}`,
    `Nº DA ZONA: ${obj.zona ?? ""}`,
    `NS: ${obj.ns ?? ""}`,
    `ENDEREÇO: ${obj.endereco ?? ""}`,
    `PERÍODO: ${obj.periodo ?? ""}`,
    `CONTATO: ${obj.contato ?? ""}`,
    `Nome do responsável: ${obj.responsavel ?? ""}`,
    `OBSERVAÇÃO: ${obj.observacao ?? ""}`
  ];

  if (Number(obj.revenda_email_ativo || 0)) linhas.push("", "E-mail fora da região:", "", montarTextoRevendaEmail(obj));

  return linhas.join("\n");
}

function montarTextoRevendaEmail(obj) {
  return [
    "Bom dia, Tudo bem?",
    "",
    "Pode conectar revenda para o cliente abaixo:",
    "",
    `Razão social (Empresa): ${obj.revenda_razao_social || obj.empresa || obj.responsavel || ""}`,
    `CNPJ: ${obj.revenda_cnpj ?? ""}`,
    `NS: ${obj.ns ?? ""}`,
    `Endereço: ${obj.endereco ?? ""}`,
    `Defeito: ${obj.revenda_defeito ?? ""}`,
    `Contato: ${obj.contato ?? ""}`,
    `OBS: ${obj.observacao ?? obj.obs ?? ""}`
  ].join("\n");
}

function montarTextoRegistroCampos(obj) {
  return obj.tipo === "visita" ? montarTextoVisita(obj) : montarTextoOcorrencia(obj);
}

function montarPreviewBugReport(obj) {
  const valor = (v) => escapeHtml(v || "-");
  const linhas = [
    ["CNPJ", obj.bug_cnpj || obj.cnpj],
    ["Empresa", obj.bug_nome || obj.empresa || obj.nome],
    ["Nº usuários", obj.bug_usuarios],
    ["Nº equipamentos", obj.bug_equipamentos],
    ["Valor pago", obj.bug_valor_pago],
    ["Tipo do equipamento", obj.bug_tipo_equipamento],
    ["Domínio do Cliente", obj.bug_dominio_cliente],
    ["Urgência", obj.bug_urgencia]
  ].map(([rotulo, conteudo]) => `
    <tr>
      <th>${escapeHtml(rotulo)}</th>
      <td>${valor(conteudo)}</td>
    </tr>
  `).join("");

  return `
    <div class="bug-preview-doc">
      <p class="bug-preview-intro">Poderiam checar e enviar esse pedido de bug para a engenharia checar por favor?</p>
      <table class="bug-preview-table">
        <tbody>${linhas}</tbody>
      </table>
      <div class="bug-preview-description">
        <strong>Descrição do bug:</strong>
        <p>${valor(obj.bug_descricao)}</p>
      </div>
    </div>
  `;
}

function montarHtmlBugReportParaCopia(obj) {
  const valor = (v) => escapeHtml(v || "-").replace(/\n/g, "<br>");
  const linhas = [
    ["CNPJ", obj.bug_cnpj || obj.cnpj],
    ["Empresa", obj.bug_nome || obj.empresa || obj.nome],
    ["Nº usuários", obj.bug_usuarios],
    ["Nº equipamentos", obj.bug_equipamentos],
    ["Valor pago", obj.bug_valor_pago],
    ["Tipo do equipamento", obj.bug_tipo_equipamento],
    ["Domínio do Cliente", obj.bug_dominio_cliente],
    ["Urgência", obj.bug_urgencia]
  ].map(([rotulo, conteudo]) => `
    <tr>
      <th style="border:1.5px solid #777;padding:10px 14px;text-align:left;width:32%;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#111827;">${escapeHtml(rotulo)}</th>
      <td style="border:1.5px solid #777;padding:10px 14px;text-align:left;font-family:Arial,sans-serif;font-size:16px;color:#303846;">${valor(conteudo)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#202733;max-width:780px;">
      <p style="margin:0 0 18px;font-size:17px;font-weight:700;">Poderiam checar e enviar esse pedido de bug para a engenharia checar por favor?</p>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;border:1.5px solid #777;background:#fff;">
        <tbody>${linhas}</tbody>
      </table>
      <p style="margin:24px 0 8px;font-size:17px;font-weight:700;">Descrição do bug:</p>
      <p style="margin:0;font-size:16px;color:#303846;white-space:pre-wrap;">${valor(obj.bug_descricao)}</p>
    </div>
  `;
}

function coletarDoFormulario() {
  const base = {
    data: $("data")?.value,
    hora: $("hora")?.value
  };

  if (currentModel === "visita") {
    return {
      ...base,
      tipo: "visita",
      empresa: $("visitaEmpresa")?.value,
      zona: $("zona")?.value,
      ns: $("ns")?.value,
      endereco: $("endereco")?.value,
      periodo: $("periodo")?.value,
      contato: $("contato")?.value,
      responsavel: $("responsavel")?.value,
      observacao: $("observacao")?.value,
      obs: $("observacao")?.value,
      revenda_email_ativo: revendaEmailAberto ? 1 : 0,
      revenda_razao_social: $("revendaRazaoSocial")?.value,
      revenda_cnpj: $("revendaCnpj")?.value,
      revenda_defeito: $("revendaDefeito")?.value
    };
  }

  return {
    ...base,
    tipo: "ocorrencia",
    nome: $("nome")?.value,
    telefone: $("telefone")?.value,
    empresa: $("empresa")?.value,
    cnpj: $("cnpj")?.value,
    problema: $("problema")?.value,
    solucao: $("solucao")?.value,
    obs: $("obs")?.value,
    bug_ativo: bugReportAberto ? 1 : 0,
    bug_cnpj: $("bugCnpj")?.value,
    bug_nome: $("bugNome")?.value,
    bug_usuarios: $("bugUsuarios")?.value,
    bug_equipamentos: $("bugEquipamentos")?.value,
    bug_valor_pago: $("bugValorPago")?.value,
    bug_tipo_equipamento: $("bugTipoEquipamento")?.value,
    bug_dominio_cliente: $("bugDominioCliente")?.value,
    bug_urgencia: $("bugUrgencia")?.value,
    bug_descricao: $("bugDescricao")?.value
  };
}

function atualizarPreview() {
  const dados = coletarDoFormulario();
  const preview = $("preview");
  if (dados.tipo === "ocorrencia" && Number(dados.bug_ativo || 0)) {
    preview.classList.add("visual");
    preview.innerHTML = montarPreviewBugReport(dados);
    return;
  }

  preview.classList.remove("visual");
  preview.textContent = montarTextoRegistroCampos(dados);
}

function validarCamposObrigatorios(dados = coletarDoFormulario()) {
  let obrigatorios = [];
  let contexto = "";

  if (dados.tipo === "ocorrencia" && Number(dados.bug_ativo || 0)) {
    contexto = "relatório de bug";
    obrigatorios = [
      ["bugCnpj", dados.bug_cnpj, "CNPJ"],
      ["bugNome", dados.bug_nome, "Empresa"],
      ["bugUrgencia", dados.bug_urgencia, "Urgência"],
      ["bugDescricao", dados.bug_descricao, "Descrição do bug"]
    ];
  } else if (dados.tipo === "ocorrencia") {
    contexto = "ocorrência";
    obrigatorios = [
      ["nome", dados.nome, "Nome"],
      ["empresa", dados.empresa, "Empresa"],
      ["problema", dados.problema, "Problema"]
    ];
  } else if (dados.tipo === "visita" && Number(dados.revenda_email_ativo || 0)) {
    contexto = "e-mail fora da região";
    obrigatorios = [
      ["revendaRazaoSocial", dados.revenda_razao_social, "Razão social (Empresa)"],
      ["revendaCnpj", dados.revenda_cnpj, "CNPJ"],
      ["ns", dados.ns, "NS"],
      ["endereco", dados.endereco, "Endereço"],
      ["revendaDefeito", dados.revenda_defeito, "Defeito"],
      ["contato", dados.contato, "Contato"]
    ];
  } else {
    contexto = "visita técnica";
    obrigatorios = [
      ["visitaEmpresa", dados.empresa, "Empresa / Razão social"],
      ["ns", dados.ns, "NS"],
      ["endereco", dados.endereco, "Endereço"],
      ["contato", dados.contato, "Contato"]
    ];
  }

  const faltando = obrigatorios.find(([, valor]) => !String(valor || "").trim());
  if (!faltando) return true;

  if (dados.tipo === "ocorrencia" && Number(dados.bug_ativo || 0)) setBugReportAberto(true);
  if (dados.tipo === "visita" && Number(dados.revenda_email_ativo || 0)) setRevendaEmailAberto(true);
  mostrarStatus(`Preencha ${faltando[2]} em ${contexto}.`, true);
  $(faltando[0])?.focus();
  return false;
}

async function copiarTexto(txt, mensagem = "Texto copiado.") {
  try {
    await navigator.clipboard.writeText(txt);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  mostrarStatus(mensagem);
}

async function copiarHtml(html, texto, mensagem = "Texto copiado.") {
  try {
    if (!window.ClipboardItem) throw new Error("Clipboard HTML indisponível.");
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([texto], { type: "text/plain" })
      })
    ]);
    mostrarStatus(mensagem);
  } catch {
    await copiarTexto(texto, `${mensagem} Se o destino não aceitar tabela, será colado como texto.`);
  }
}

function limparFormularioAtual() {
  const campos = currentModel === "visita" ? [...camposVisita, ...camposRevendaEmail] : [...camposOcorrencia, ...camposBugReport];
  campos.forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  if (currentModel === "ocorrencia") setBugReportAberto(false);
  if (currentModel === "visita") setRevendaEmailAberto(false);
  limparControleAutoBug();
  limparControleAutoRevenda();
  atualizarPreview();
}

async function api(path, options = {}) {
  const resposta = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a ação.");
  return dados;
}

async function carregarHistorico(lista = null) {
  if (!lista) {
    const dados = await api("/api/registros");
    registros = dados.registros;
    lista = registros;
  }

  const container = $("historyList");
  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = '<div class="history-item"><div class="history-content">Nenhum registro encontrado.</div></div>';
    return;
  }

  lista.forEach((r) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const content = document.createElement("div");
    content.className = "history-content";
    content.innerHTML = r.tipo === "visita" ? renderVisita(r) : renderOcorrencia(r);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const edit = document.createElement("button");
    edit.className = "btn-edit";
    edit.type = "button";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => entrarModoEdicao(r));

    const del = document.createElement("button");
    del.className = "btn-del";
    del.type = "button";
    del.title = "Excluir";
    del.setAttribute("aria-label", "Excluir registro");
    del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4V5h4V4a1 1 0 0 1 1-1Zm1 2v0h4V5h-4Zm-3 2v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H7Zm3 3h2v7h-2v-7Zm4 0h2v7h-2v-7Z"/></svg>';
    del.addEventListener("click", () => excluirRegistro(r.id));

    actions.append(edit, del);
    item.append(content, actions);
    container.appendChild(item);
  });
}

function carimboEditado(r) {
  return r.atualizado_em ? ' <span class="editado">(editado)</span>' : "";
}

function renderOcorrencia(r) {
  const bug = Number(r.bug_ativo || 0) ? `
    <br><span class="badge bug">Relatório de bug</span><br>
    <b>CNPJ:</b> ${escapeHtml(r.bug_cnpj || r.cnpj || "-")}<br>
    <b>Empresa:</b> ${escapeHtml(r.bug_nome || r.empresa || r.nome || "-")}<br>
    <b>Nº de usuários:</b> ${escapeHtml(r.bug_usuarios || "-")}<br>
    <b>Nº de equipamentos:</b> ${escapeHtml(r.bug_equipamentos || "-")}<br>
    <b>Valor pago:</b> ${escapeHtml(r.bug_valor_pago || "-")}<br>
    <b>Tipo de equipamento:</b> ${escapeHtml(r.bug_tipo_equipamento || "-")}<br>
    <b>Domínio do cliente:</b> ${escapeHtml(r.bug_dominio_cliente || "-")}<br>
    <b>Urgência:</b> ${escapeHtml(r.bug_urgencia || "-")}<br>
    <b>Descrição do bug:</b> ${escapeHtml(r.bug_descricao || "-")}
  ` : "";

  return `
    <span class="badge ocorrencia">Ocorrência</span><br>
    <b>${escapeHtml(r.data)} ${escapeHtml(r.hora)}</b>${carimboEditado(r)}<br>
    <b>Cliente:</b> ${escapeHtml(r.nome || "-")}<br>
    <b>Telefone:</b> ${escapeHtml(r.telefone || "-")}<br>
    <b>Empresa:</b> ${escapeHtml(r.empresa || "-")}<br>
    <b>CNPJ:</b> ${escapeHtml(r.cnpj || "-")}<br>
    <b>Problema:</b> ${escapeHtml(r.problema || "-")}<br>
    <b>Solução:</b> ${escapeHtml(r.solucao || "-")}<br>
    <b>Obs:</b> ${escapeHtml(r.obs || "-")}
    ${bug}
  `;
}

function renderVisita(r) {
  const revenda = Number(r.revenda_email_ativo || 0) ? `
    <br><span class="badge revenda">E-mail fora da região</span><br>
    <b>Razão social (Empresa):</b> ${escapeHtml(r.revenda_razao_social || r.empresa || r.responsavel || "-")}<br>
    <b>CNPJ:</b> ${escapeHtml(r.revenda_cnpj || "-")}<br>
    <b>Defeito:</b> ${escapeHtml(r.revenda_defeito || "-")}
  ` : "";

  return `
    <span class="badge visita">Visita Técnica</span><br>
    <b>${escapeHtml(r.data)} ${escapeHtml(r.hora)}</b>${carimboEditado(r)}<br>
    <b>Empresa:</b> ${escapeHtml(r.empresa || "-")}<br>
    <b>Nº DA ZONA:</b> ${escapeHtml(r.zona || "-")}<br>
    <b>NS:</b> ${escapeHtml(r.ns || "-")}<br>
    <b>ENDEREÇO:</b> ${escapeHtml(r.endereco || "-")}<br>
    <b>PERÍODO:</b> ${escapeHtml(r.periodo || "-")}<br>
    <b>CONTATO:</b> ${escapeHtml(r.contato || "-")}<br>
    <b>Nome do responsável:</b> ${escapeHtml(r.responsavel || "-")}<br>
    <b>OBSERVAÇÃO:</b> ${escapeHtml(r.observacao || r.obs || "-")}
    ${revenda}
  `;
}

function entrarModoEdicao(registro) {
  limparControleAutoBug();
  limparControleAutoRevenda();
  document.querySelector('.tab-btn[data-tab="registro"]')?.click();
  setModelo(registro.tipo === "visita" ? "visita" : "ocorrencia");
  $("data").value = registro.data || "";
  $("hora").value = registro.hora || "";

  [...camposOcorrencia, ...camposVisita].forEach((id) => {
    const el = $(id);
    if (el) el.value = registro[id] || "";
  });
  $("visitaEmpresa").value = registro.empresa || "";
  camposRevendaEmail.forEach((id) => {
    const el = $(id);
    const chave = id.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
    if (el) el.value = registro[chave] || "";
  });
  camposBugReport.forEach((id) => {
    const el = $(id);
    const chave = id.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
    if (el) el.value = registro[chave] || "";
  });
  if (registro.tipo === "visita") $("observacao").value = registro.observacao || registro.obs || "";
  setBugReportAberto(registro.tipo !== "visita" && Number(registro.bug_ativo || 0));
  setRevendaEmailAberto(registro.tipo === "visita" && Number(registro.revenda_email_ativo || 0));

  editingId = registro.id;
  $("copyBtn").hidden = true;
  $("saveEditBtn").hidden = false;
  atualizarPreview();
  mostrarStatus("Modo de edição ativo. Faça as alterações e salve.");
}

function sairModoEdicao() {
  editingId = null;
  $("saveEditBtn").hidden = true;
  $("copyBtn").hidden = false;
  atualizarRotuloBotaoPrincipal();
}

async function salvarRegistro(dados = null) {
  if (currentModel === "ocorrencia" && bugReportAberto) preencherBugReportComOcorrencia();
  if (currentModel === "visita" && revendaEmailAberto) preencherRevendaEmailComVisita();
  dados = dados || coletarDoFormulario();
  if (!validarCamposObrigatorios(dados)) return false;
  try {
    await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(dados)
    });
    mostrarStatus("Registro salvo com sucesso!");
    await carregarHistorico();
    return true;
  } catch (erro) {
    mostrarStatus(erro.message, true);
    return false;
  }
}

async function salvarEdicao() {
  if (editingId == null) return;
  if (currentModel === "ocorrencia" && bugReportAberto) preencherBugReportComOcorrencia();
  if (currentModel === "visita" && revendaEmailAberto) preencherRevendaEmailComVisita();
  const dados = coletarDoFormulario();
  if (!validarCamposObrigatorios(dados)) return;
  try {
    await api(`/api/registros/${editingId}`, {
      method: "PUT",
      body: JSON.stringify(dados)
    });
    mostrarStatus("Edição salva com sucesso!");
    sairModoEdicao();
    await carregarHistorico();
  } catch (erro) {
    mostrarStatus(erro.message, true);
  }
}

async function excluirRegistro(id) {
  if (!confirm("Excluir este registro?")) return;
  try {
    await api(`/api/registros/${id}`, { method: "DELETE" });
    if (editingId === id) sairModoEdicao();
    mostrarStatus("Registro excluído.");
    await carregarHistorico();
  } catch (erro) {
    mostrarStatus(erro.message, true);
  }
}

async function aplicarFiltros() {
  const params = new URLSearchParams({
    inicio: $("filtroInicio").value,
    fim: $("filtroFim").value,
    cliente: $("filtroCliente").value,
    empresa: $("filtroEmpresa").value,
    telefone: $("filtroTelefone").value,
    cnpj: $("filtroCNPJ").value,
    busca: $("buscaGeral").value
  });
  const dados = await api(`/api/registros?${params.toString()}`);
  ultimoResultadoFiltrado = dados.registros;
  carregarHistorico(ultimoResultadoFiltrado);
}

function exportarComoTXT(lista, nomeArquivo) {
  const conteudo = [...lista].reverse().map(montarTextoRegistroCampos).join("\n\n");
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarStatus("Arquivo TXT gerado para download.");
}

function prepararEventos() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      $(btn.dataset.tab)?.classList.add("active");
    });
  });

  $("btnModeloOcorrencia").addEventListener("click", () => setModelo("ocorrencia"));
  $("btnModeloVisita").addEventListener("click", () => setModelo("visita"));
  $("toggleBugReport").addEventListener("click", () => setBugReportAberto(!bugReportAberto));
  $("toggleRevendaEmail").addEventListener("click", () => setRevendaEmailAberto(!revendaEmailAberto));
  [...camposOcorrencia, ...camposVisita, ...camposBugReport, ...camposRevendaEmail].forEach((id) => $(id)?.addEventListener("input", atualizarPreview));
  $("bugUrgencia").addEventListener("change", atualizarPreview);

  const aplicarMascaraCnpj = (id) => {
    let v = $(id).value.replace(/\D/g, "").slice(0, 14);
    if (v.length > 12) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    else if (v.length > 8) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    else if (v.length > 5) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    else if (v.length > 2) v = `${v.slice(0,2)}.${v.slice(2)}`;
    $(id).value = v;
    atualizarPreview();
  };
  $("cnpj").addEventListener("input", () => {
    aplicarMascaraCnpj("cnpj");
    if (bugReportAberto) preencherAutomatico("bugCnpj", $("cnpj")?.value, "cnpj");
    atualizarPreview();
  });
  $("bugCnpj").addEventListener("input", () => aplicarMascaraCnpj("bugCnpj"));
  $("revendaCnpj").addEventListener("input", () => aplicarMascaraCnpj("revendaCnpj"));

  ["empresa", "nome"].forEach((id) => {
    $(id).addEventListener("input", () => {
      if (bugReportAberto) preencherAutomatico("bugNome", $("empresa")?.value || $("nome")?.value, "empresa");
      atualizarPreview();
    });
  });
  $("problema").addEventListener("input", () => {
    if (bugReportAberto) preencherAutomatico("bugDescricao", $("problema")?.value, "descricao");
    atualizarPreview();
  });

  ["visitaEmpresa", "responsavel"].forEach((id) => {
    $(id).addEventListener("input", () => {
      if (revendaEmailAberto) preencherAutomaticoRevenda("revendaRazaoSocial", $("visitaEmpresa")?.value || $("responsavel")?.value, "razao");
      atualizarPreview();
    });
  });
  $("observacao").addEventListener("input", () => {
    if (revendaEmailAberto) preencherAutomaticoRevenda("revendaDefeito", $("observacao")?.value, "defeito");
    atualizarPreview();
  });

  $("copyBugReportBtn").addEventListener("click", async () => {
    if (!bugReportAberto) setBugReportAberto(true);
    preencherBugReportComOcorrencia();
    const dados = coletarDoFormulario();
    if (!validarCamposObrigatorios(dados)) return;
    await copiarHtml(
      montarHtmlBugReportParaCopia(dados),
      montarTextoBugReport(dados),
      "Relatório de bug copiado em tabela."
    );
  });

  $("copyRevendaEmailBtn").addEventListener("click", async () => {
    if (!revendaEmailAberto) setRevendaEmailAberto(true);
    preencherRevendaEmailComVisita();
    const dados = coletarDoFormulario();
    if (!validarCamposObrigatorios(dados)) return;
    await copiarTexto(montarTextoRevendaEmail(dados), "E-mail para revenda copiado.");
  });

  $("copyBtn").addEventListener("click", async () => {
    if (currentModel === "ocorrencia") preencherBugReportComOcorrencia();
    if (currentModel === "visita" && revendaEmailAberto) preencherRevendaEmailComVisita();
    const dados = coletarDoFormulario();
    if (!validarCamposObrigatorios(dados)) return;
    atualizarPreview();

    if (dados.tipo === "ocorrencia" && Number(dados.bug_ativo || 0)) {
      await copiarHtml(
        montarHtmlBugReportParaCopia(dados),
        montarTextoBugReport(dados),
        "Relatório de bug copiado em tabela."
      );
    } else if (dados.tipo === "visita" && Number(dados.revenda_email_ativo || 0)) {
      await copiarTexto(montarTextoRevendaEmail(dados), "E-mail para revenda copiado.");
    } else {
      await copiarTexto(montarTextoRegistroCampos(dados), "Registro copiado.");
    }
    await salvarRegistro(dados);
  });

  $("saveEditBtn").addEventListener("click", salvarEdicao);
  $("clearBtn").addEventListener("click", () => {
    limparFormularioAtual();
    if (editingId != null) sairModoEdicao();
    mostrarStatus("Formulário limpo.");
  });

  $("btnFiltrar").addEventListener("click", aplicarFiltros);
  $("btnLimparFiltros").addEventListener("click", async () => {
    ["filtroInicio","filtroFim","filtroCliente","filtroEmpresa","filtroTelefone","filtroCNPJ","buscaGeral"].forEach((id) => $(id).value = "");
    ultimoResultadoFiltrado = null;
    await carregarHistorico();
  });

  $("btnExportFiltrado").addEventListener("click", () => exportarComoTXT(ultimoResultadoFiltrado || registros, "historico_filtrado.txt"));
  $("btnExportCompleto").addEventListener("click", () => exportarComoTXT(registros, "historico_completo.txt"));
}

prepararEventos();
atualizarDataHora();
atualizarRotuloBotaoPrincipal();
atualizarPreview();
carregarHistorico().catch((erro) => mostrarStatus(erro.message, true));
