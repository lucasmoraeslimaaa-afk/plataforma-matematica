const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'banco.db'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE,
            senha TEXT,
            tipo TEXT DEFAULT 'aluno'
        )`, () => {
            db.run(`INSERT OR IGNORE INTO usuarios (usuario, senha, tipo) VALUES ('gustavo', '1234', 'aluno')`);
            db.run(`INSERT OR IGNORE INTO usuarios (usuario, senha, tipo) VALUES ('admin', 'admin', 'admin')`);
        });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/aluno', (req, res) => res.sendFile(path.join(__dirname, 'views', 'aluno.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'gustavo' && senha === '1234') return res.redirect('/aluno');
    if (usuario === 'admin' && senha === 'admin') return res.redirect('/admin');

    db.get('SELECT * FROM usuarios WHERE usuario = ? AND senha = ?', [usuario, senha], (err, row) => {
        if (row) {
            return row.tipo === 'admin' ? res.redirect('/admin') : res.redirect('/aluno');
        }
        res.send('Usuário ou senha incorretos! <a href="/login">Tentar novamente</a>');
    });
});

app.post('/cadastrar', (req, res) => {
    const { usuario, senha } = req.body;
    db.run('INSERT INTO usuarios (usuario, senha, tipo) VALUES (?, ?, ?)', [usuario, senha, 'aluno'], (err) => {
        if (err) return res.send('Erro ao cadastrar ou usuário já existe. <a href="/login">Voltar</a>');
        res.redirect('/aluno');
    });
});

app.get('/api/capitulo/:id', (req, res) => {
    const capId = req.params.id;
    const caminhoArquivo = path.join(__dirname, 'conteudos', '6ano', capId, 'index.html');
    if (fs.existsSync(caminhoArquivo)) {
        res.json({ sucesso: true, html: fs.readFileSync(caminhoArquivo, 'utf8') });
    } else {
        res.status(404).json({ sucesso: false, erro: `Capítulo ${capId} não encontrado.` });
    }
});

app.listen(PORT, () => console.log(`Engine ativada em http://localhost:${PORT}`));