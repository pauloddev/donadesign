# Dona Design Madeira — site institucional

Site estático (HTML + CSS + JS), pronto para a Vercel. Sem build: a Vercel publica a pasta raiz.

- `index.html` — página única com todas as seções
- `assets/js/config.js` — **arquivo central**: contatos, WhatsApp, e-mail, Instagram, endereço, URL do site e opções do formulário
- `assets/css/style.css` — estilos (paleta, tipografia Jost, animações)
- `assets/js/main.js` — intro, transições, carrosséis, formulário → WhatsApp
- `assets/img`, `assets/video` — mídias tratadas (4:5)
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, `vercel.json`

Ao trocar o domínio, atualize a URL em `config.js`, `index.html` (canonical / Open Graph / JSON-LD), `robots.txt` e `sitemap.xml`.
