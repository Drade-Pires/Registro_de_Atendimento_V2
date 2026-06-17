const $ = (id) => document.getElementById(id);
const camposOcorrencia = ["nome", "telefone", "empresa", "cnpj", "problema", "solucao", "obs"];
const camposVisita = ["zona", "ns", "endereco", "periodo", "contato", "responsavel", "observacao"];

let currentModel = "ocorrencia";
let registros = [];
let ultimoResultadoFiltrado = null;
let editingId = null;

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
  currentModel = modelo;
  $("btnModeloOcorrencia")?.classList.toggle("active", modelo === "ocorrencia");
  $("btnModeloVisita")?.classList.toggle("active", modelo === "visita");
  $("btnModeloOcorrencia")?.setAttribute("aria-pressed", String(modelo === "ocorrencia"));
  $("btnModeloVisita")?.setAttribute("aria-pressed", String(modelo === "visita"));
  $("formOcorrencia")?.classList.toggle("active", modelo === "ocorrencia");
  $("formVisita")?.classList.toggle("active", modelo === "visita");
  $("tituloModelo").textContent = modelo === "ocorrencia" ? "Ocorrência" : "Visita Técnica";
  atualizarPreview();
}

function atualizarDataHora() {
  const d = new Date();
  $("data").value = d.toLocaleDateString("pt-BR");
  $("hora").value = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function montarTextoOcorrencia(obj) {
  return [
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
  ].join("\n");
}

function montarTextoVisita(obj) {
  return [
    `Nº DA ZONA: ${obj.zona ?? ""}`,
    `NS: ${obj.ns ?? ""}`,
    `ENDEREÇO: ${obj.endereco ?? ""}`,
    `PERÍODO: ${obj.periodo ?? ""}`,
    `CONTATO: ${obj.contato ?? ""}`,
    `Nome do responsável: ${obj.responsavel ?? ""}`,
    `OBSERVAÇÃO: ${obj.observacao ?? ""}`
  ].join("\n");
}

function montarTextoRegistroCampos(obj) {
  return obj.tipo === "visita" ? montarTextoVisita(obj) : montarTextoOcorrencia(obj);
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
      zona: $("zona")?.value,
      ns: $("ns")?.value,
      endereco: $("endereco")?.value,
      periodo: $("periodo")?.value,
      contato: $("contato")?.value,
      responsavel: $("responsavel")?.value,
      observacao: $("observacao")?.value,
      obs: $("observacao")?.value
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
    obs: $("obs")?.value
  };
}

function atualizarPreview() {
  $("preview").textContent = montarTextoRegistroCampos(coletarDoFormulario());
}

function limparFormularioAtual() {
  const campos = currentModel === "visita" ? camposVisita : camposOcorrencia;
  campos.forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
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
  `;
}

function renderVisita(r) {
  return `
    <span class="badge visita">Visita Técnica</span><br>
    <b>${escapeHtml(r.data)} ${escapeHtml(r.hora)}</b>${carimboEditado(r)}<br>
    <b>Nº DA ZONA:</b> ${escapeHtml(r.zona || "-")}<br>
    <b>NS:</b> ${escapeHtml(r.ns || "-")}<br>
    <b>ENDEREÇO:</b> ${escapeHtml(r.endereco || "-")}<br>
    <b>PERÍODO:</b> ${escapeHtml(r.periodo || "-")}<br>
    <b>CONTATO:</b> ${escapeHtml(r.contato || "-")}<br>
    <b>Nome do responsável:</b> ${escapeHtml(r.responsavel || "-")}<br>
    <b>OBSERVAÇÃO:</b> ${escapeHtml(r.observacao || r.obs || "-")}
  `;
}

function entrarModoEdicao(registro) {
  document.querySelector('.tab-btn[data-tab="registro"]')?.click();
  setModelo(registro.tipo === "visita" ? "visita" : "ocorrencia");
  $("data").value = registro.data || "";
  $("hora").value = registro.hora || "";

  [...camposOcorrencia, ...camposVisita].forEach((id) => {
    const el = $(id);
    if (el) el.value = registro[id] || "";
  });
  if (registro.tipo === "visita") $("observacao").value = registro.observacao || registro.obs || "";

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
}

async function salvarRegistro() {
  try {
    await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(coletarDoFormulario())
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
  try {
    await api(`/api/registros/${editingId}`, {
      method: "PUT",
      body: JSON.stringify(coletarDoFormulario())
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
  [...camposOcorrencia, ...camposVisita].forEach((id) => $(id)?.addEventListener("input", atualizarPreview));

  $("cnpj").addEventListener("input", () => {
    let v = $("cnpj").value.replace(/\D/g, "").slice(0, 14);
    if (v.length > 12) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    else if (v.length > 8) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    else if (v.length > 5) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    else if (v.length > 2) v = `${v.slice(0,2)}.${v.slice(2)}`;
    $("cnpj").value = v;
    atualizarPreview();
  });

  $("copyBtn").addEventListener("click", async () => {
    atualizarPreview();
    const txt = $("preview").textContent || "";
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
    await salvarRegistro();
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
atualizarPreview();
carregarHistorico().catch((erro) => mostrarStatus(erro.message, true));
