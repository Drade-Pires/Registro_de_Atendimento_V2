const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");

const BASE_DIR = __dirname;
const PUBLIC_DIR = path.join(BASE_DIR, "public");
const DATA_DIR = path.join(BASE_DIR, "data");
const DB_PATH = path.join(DATA_DIR, "atendimentos.db");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 8766);

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK (tipo IN ('ocorrencia', 'visita')),
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    nome TEXT,
    telefone TEXT,
    empresa TEXT,
    cnpj TEXT,
    problema TEXT,
    solucao TEXT,
    obs TEXT,
    zona TEXT,
    ns TEXT,
    endereco TEXT,
    periodo TEXT,
    contato TEXT,
    responsavel TEXT,
    observacao TEXT,
    bug_ativo INTEGER NOT NULL DEFAULT 0,
    bug_cnpj TEXT,
    bug_nome TEXT,
    bug_usuarios TEXT,
    bug_equipamentos TEXT,
    bug_valor_pago TEXT,
    bug_tipo_equipamento TEXT,
    bug_dominio_cliente TEXT,
    bug_urgencia TEXT,
    bug_descricao TEXT,
    revenda_email_ativo INTEGER NOT NULL DEFAULT 0,
    revenda_razao_social TEXT,
    revenda_cnpj TEXT,
    revenda_defeito TEXT,
    chave TEXT NOT NULL UNIQUE,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros(tipo);
  CREATE INDEX IF NOT EXISTS idx_registros_criado ON registros(criado_em);
`);

function garantirColuna(nome, definicao) {
  const colunas = db.prepare("PRAGMA table_info(registros)").all().map((coluna) => coluna.name);
  if (!colunas.includes(nome)) db.exec(`ALTER TABLE registros ADD COLUMN ${nome} ${definicao}`);
}

[
  ["bug_ativo", "INTEGER NOT NULL DEFAULT 0"],
  ["bug_cnpj", "TEXT"],
  ["bug_nome", "TEXT"],
  ["bug_usuarios", "TEXT"],
  ["bug_equipamentos", "TEXT"],
  ["bug_valor_pago", "TEXT"],
  ["bug_tipo_equipamento", "TEXT"],
  ["bug_dominio_cliente", "TEXT"],
  ["bug_urgencia", "TEXT"],
  ["bug_descricao", "TEXT"],
  ["revenda_email_ativo", "INTEGER NOT NULL DEFAULT 0"],
  ["revenda_razao_social", "TEXT"],
  ["revenda_cnpj", "TEXT"],
  ["revenda_defeito", "TEXT"],
].forEach(([nome, definicao]) => garantirColuna(nome, definicao));

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function normalizarTexto(valor) {
  return String(valor ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function gerarChave(dados) {
  let partes;
  if (dados.tipo === "visita") {
    partes = [
        "visita",
        normalizarTexto(dados.data),
        normalizarTexto(dados.hora),
        normalizarTexto(dados.empresa),
        normalizarTexto(dados.zona),
        normalizarTexto(dados.ns),
        normalizarTexto(dados.endereco),
        normalizarTexto(dados.periodo),
        normalizarTexto(dados.contato),
        normalizarTexto(dados.responsavel),
        normalizarTexto(dados.observacao),
      ];
    if (Number(dados.revenda_email_ativo || 0)) {
      partes.push(
        "email-revenda",
        normalizarTexto(dados.revenda_razao_social),
        soDigitos(dados.revenda_cnpj),
        normalizarTexto(dados.revenda_defeito),
      );
    }
  } else {
    partes = [
        "ocorrencia",
        normalizarTexto(dados.data),
        normalizarTexto(dados.hora),
        normalizarTexto(dados.nome),
        soDigitos(dados.telefone),
        normalizarTexto(dados.empresa),
        soDigitos(dados.cnpj),
        normalizarTexto(dados.problema),
        normalizarTexto(dados.solucao),
        normalizarTexto(dados.obs),
      ];
    if (Number(dados.bug_ativo || 0)) {
      partes.push(
        "relatorio-bug",
        soDigitos(dados.bug_cnpj),
        normalizarTexto(dados.bug_nome),
        normalizarTexto(dados.bug_usuarios),
        normalizarTexto(dados.bug_equipamentos),
        normalizarTexto(dados.bug_valor_pago),
        normalizarTexto(dados.bug_tipo_equipamento),
        normalizarTexto(dados.bug_dominio_cliente),
        normalizarTexto(dados.bug_urgencia),
        normalizarTexto(dados.bug_descricao),
      );
    }
  }
  return partes.join("\n");
}

function limparRegistro(dados) {
  const tipo = dados.tipo === "visita" ? "visita" : "ocorrencia";
  const registro = {
    tipo,
    data: String(dados.data || ""),
    hora: String(dados.hora || ""),
    nome: String(dados.nome || ""),
    telefone: String(dados.telefone || ""),
    empresa: String(dados.empresa || ""),
    cnpj: String(dados.cnpj || ""),
    problema: String(dados.problema || ""),
    solucao: String(dados.solucao || ""),
    obs: String(dados.obs || dados.observacao || ""),
    zona: String(dados.zona || ""),
    ns: String(dados.ns || ""),
    endereco: String(dados.endereco || ""),
    periodo: String(dados.periodo || ""),
    contato: String(dados.contato || ""),
    responsavel: String(dados.responsavel || ""),
    observacao: String(dados.observacao || dados.obs || ""),
    bug_ativo: Number(dados.bug_ativo || 0) ? 1 : 0,
    bug_cnpj: String(dados.bug_cnpj || ""),
    bug_nome: String(dados.bug_nome || ""),
    bug_usuarios: String(dados.bug_usuarios || ""),
    bug_equipamentos: String(dados.bug_equipamentos || ""),
    bug_valor_pago: String(dados.bug_valor_pago || ""),
    bug_tipo_equipamento: String(dados.bug_tipo_equipamento || ""),
    bug_dominio_cliente: String(dados.bug_dominio_cliente || ""),
    bug_urgencia: String(dados.bug_urgencia || ""),
    bug_descricao: String(dados.bug_descricao || ""),
    revenda_email_ativo: Number(dados.revenda_email_ativo || 0) ? 1 : 0,
    revenda_razao_social: String(dados.revenda_razao_social || ""),
    revenda_cnpj: String(dados.revenda_cnpj || ""),
    revenda_defeito: String(dados.revenda_defeito || ""),
  };
  registro.chave = gerarChave(registro);
  return registro;
}

function enviarJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

function lerJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Requisição muito grande."));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

function buscarRegistros(url) {
  const filtros = [];
  const valores = {};
  const inicio = url.searchParams.get("inicio") || "";
  const fim = url.searchParams.get("fim") || "";
  const cliente = url.searchParams.get("cliente") || "";
  const empresa = url.searchParams.get("empresa") || "";
  const telefone = soDigitos(url.searchParams.get("telefone") || "");
  const cnpj = soDigitos(url.searchParams.get("cnpj") || "");
  const busca = url.searchParams.get("busca") || "";

  if (inicio) {
    filtros.push("date(substr(criado_em, 1, 10)) >= date(:inicio)");
    valores.inicio = inicio;
  }
  if (fim) {
    filtros.push("date(substr(criado_em, 1, 10)) <= date(:fim)");
    valores.fim = fim;
  }
  if (cliente) {
    filtros.push("LOWER(nome) LIKE LOWER(:cliente)");
    valores.cliente = `%${cliente}%`;
  }
  if (empresa) {
    filtros.push("(LOWER(empresa) LIKE LOWER(:empresa) OR LOWER(revenda_razao_social) LIKE LOWER(:empresa))");
    valores.empresa = `%${empresa}%`;
  }
  if (telefone) {
    filtros.push("REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', '') LIKE :telefone");
    valores.telefone = `%${telefone}%`;
  }
  if (cnpj) {
    filtros.push(`(
      REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', ''), ' ', '') LIKE :cnpj OR
      REPLACE(REPLACE(REPLACE(REPLACE(bug_cnpj, '.', ''), '/', ''), '-', ''), ' ', '') LIKE :cnpj OR
      REPLACE(REPLACE(REPLACE(REPLACE(revenda_cnpj, '.', ''), '/', ''), '-', ''), ' ', '') LIKE :cnpj
    )`);
    valores.cnpj = `%${cnpj}%`;
  }
  if (busca) {
    filtros.push(`
      LOWER(
        COALESCE(nome, '') || ' ' || COALESCE(empresa, '') || ' ' ||
        COALESCE(telefone, '') || ' ' || COALESCE(cnpj, '') || ' ' ||
        COALESCE(problema, '') || ' ' || COALESCE(solucao, '') || ' ' ||
        COALESCE(obs, '') || ' ' || COALESCE(zona, '') || ' ' ||
        COALESCE(ns, '') || ' ' || COALESCE(endereco, '') || ' ' ||
        COALESCE(periodo, '') || ' ' || COALESCE(contato, '') || ' ' ||
        COALESCE(responsavel, '') || ' ' || COALESCE(observacao, '') || ' ' ||
        COALESCE(bug_cnpj, '') || ' ' || COALESCE(bug_nome, '') || ' ' ||
        COALESCE(bug_usuarios, '') || ' ' || COALESCE(bug_equipamentos, '') || ' ' ||
        COALESCE(bug_valor_pago, '') || ' ' || COALESCE(bug_tipo_equipamento, '') || ' ' ||
        COALESCE(bug_dominio_cliente, '') || ' ' || COALESCE(bug_urgencia, '') || ' ' ||
        COALESCE(bug_descricao, '') || ' ' || COALESCE(revenda_razao_social, '') || ' ' ||
        COALESCE(revenda_cnpj, '') || ' ' || COALESCE(revenda_defeito, '')
      ) LIKE LOWER(:busca)
    `);
    valores.busca = `%${busca}%`;
  }

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM registros ${where} ORDER BY datetime(criado_em) DESC, id DESC`).all(valores);
}

function criarRegistro(dados) {
  const registro = limparRegistro(dados);
  const result = db.prepare(`
    INSERT INTO registros (
      tipo, data, hora, nome, telefone, empresa, cnpj, problema, solucao,
      obs, zona, ns, endereco, periodo, contato, responsavel, observacao,
      bug_ativo, bug_cnpj, bug_nome, bug_usuarios, bug_equipamentos, bug_valor_pago,
      bug_tipo_equipamento, bug_dominio_cliente, bug_urgencia, bug_descricao,
      revenda_email_ativo, revenda_razao_social, revenda_cnpj, revenda_defeito, chave
    ) VALUES (
      :tipo, :data, :hora, :nome, :telefone, :empresa, :cnpj, :problema, :solucao,
      :obs, :zona, :ns, :endereco, :periodo, :contato, :responsavel, :observacao,
      :bug_ativo, :bug_cnpj, :bug_nome, :bug_usuarios, :bug_equipamentos, :bug_valor_pago,
      :bug_tipo_equipamento, :bug_dominio_cliente, :bug_urgencia, :bug_descricao,
      :revenda_email_ativo, :revenda_razao_social, :revenda_cnpj, :revenda_defeito, :chave
    )
  `).run(registro);
  return db.prepare("SELECT * FROM registros WHERE id = ?").get(result.lastInsertRowid);
}

function atualizarRegistro(id, dados) {
  const registro = limparRegistro(dados);
  registro.id = id;
  const existe = db.prepare("SELECT id FROM registros WHERE id = ?").get(id);
  if (!existe) return null;
  db.prepare(`
    UPDATE registros SET
      tipo = :tipo, data = :data, hora = :hora, nome = :nome,
      telefone = :telefone, empresa = :empresa, cnpj = :cnpj,
      problema = :problema, solucao = :solucao, obs = :obs,
      zona = :zona, ns = :ns, endereco = :endereco,
      periodo = :periodo, contato = :contato, responsavel = :responsavel,
      observacao = :observacao, bug_ativo = :bug_ativo,
      bug_cnpj = :bug_cnpj, bug_nome = :bug_nome,
      bug_usuarios = :bug_usuarios, bug_equipamentos = :bug_equipamentos,
      bug_valor_pago = :bug_valor_pago, bug_tipo_equipamento = :bug_tipo_equipamento,
      bug_dominio_cliente = :bug_dominio_cliente, bug_urgencia = :bug_urgencia,
      bug_descricao = :bug_descricao, revenda_email_ativo = :revenda_email_ativo,
      revenda_razao_social = :revenda_razao_social, revenda_cnpj = :revenda_cnpj,
      revenda_defeito = :revenda_defeito, chave = :chave, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = :id
  `).run(registro);
  return db.prepare("SELECT * FROM registros WHERE id = ?").get(id);
}

function servirArquivo(req, res, url) {
  const rota = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const arquivo = path.normalize(path.join(PUBLIC_DIR, rota));
  if (!arquivo.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Acesso negado.");
    return;
  }

  fs.readFile(arquivo, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Arquivo não encontrado.");
      return;
    }
    res.writeHead(200, { "Content-Type": tipos[path.extname(arquivo)] || "application/octet-stream" });
    res.end(data);
  });
}

async function rotear(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/saude") {
      enviarJson(res, 200, { ok: true, banco: DB_PATH });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/registros") {
      enviarJson(res, 200, { registros: buscarRegistros(url) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/registros") {
      try {
        enviarJson(res, 201, { registro: criarRegistro(await lerJson(req)) });
      } catch (erro) {
        if (erro.code === "ERR_SQLITE_CONSTRAINT_UNIQUE") {
          enviarJson(res, 409, { erro: "Registro idêntico já existe. Não foi salvo." });
        } else {
          throw erro;
        }
      }
      return;
    }

    const matchRegistro = url.pathname.match(/^\/api\/registros\/(\d+)$/);
    if (matchRegistro && req.method === "PUT") {
      try {
        const atualizado = atualizarRegistro(Number(matchRegistro[1]), await lerJson(req));
        if (!atualizado) enviarJson(res, 404, { erro: "Registro não encontrado." });
        else enviarJson(res, 200, { registro: atualizado });
      } catch (erro) {
        if (erro.code === "ERR_SQLITE_CONSTRAINT_UNIQUE") {
          enviarJson(res, 409, { erro: "Já existe outro registro idêntico." });
        } else {
          throw erro;
        }
      }
      return;
    }

    if (matchRegistro && req.method === "DELETE") {
      const result = db.prepare("DELETE FROM registros WHERE id = ?").run(Number(matchRegistro[1]));
      enviarJson(res, result.changes ? 200 : 404, result.changes ? { ok: true } : { erro: "Registro não encontrado." });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      enviarJson(res, 404, { erro: "Rota não encontrada." });
      return;
    }

    servirArquivo(req, res, url);
  } catch (erro) {
    enviarJson(res, 500, { erro: erro.message || "Erro interno." });
  }
}

const server = http.createServer(rotear);
server.listen(PORT, HOST, () => {
  console.log(`Aplicação aberta em http://${HOST}:${PORT}`);
  console.log(`Banco local: ${DB_PATH}`);
});
