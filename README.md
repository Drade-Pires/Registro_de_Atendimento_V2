# Registro de Atendimentos

Aplicação web local para registrar ocorrências e visitas técnicas.

## Como abrir

Clique duas vezes em `iniciar.bat`.

O navegador abrirá automaticamente em:

http://127.0.0.1:8765

## Como atualizar pela versão do GitHub

Clique duas vezes em `atualizar.bat`.

Esse arquivo executa `git pull` na pasta do sistema. Ele atualiza o código, mas não envia nem apaga o banco local.

## Onde ficam os dados

Os registros ficam no banco local:

`data/atendimentos.db`

Esse arquivo pode ser copiado para backup.

O banco local não deve ser enviado para o GitHub. A pasta `data/` está no `.gitignore` para cada usuário manter seus próprios registros.

## Observação

A aplicação não depende de internet para registrar atendimentos. A internet só é necessária quando o usuário quiser atualizar a versão pelo GitHub.

É recomendado usar Node.js 24 ou superior, pois a aplicação usa SQLite nativo do Node.
