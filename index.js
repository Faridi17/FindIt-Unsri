import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session';
import bcrypt from 'bcrypt';
import multer from 'multer';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import pool from './utils/db.js';

const app = express()
const port = 3000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

dotenv.config();


app.set('view engine', 'ejs') 
app.use(expressLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});

const upload = multer({ storage });

app.use(session({
    secret: process.env.SESSION_SECRET,   
    resave: false,
    saveUninitialized: true
}));

function isLoggedIn(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

app.get('/', async (req, res) => {
    try {
        const [items] = await pool.query(
            "SELECT * FROM item WHERE status = 'Not Claimed' ORDER BY created_at DESC"
        );

        res.render('index', {
            layout: 'layouts/main-layout',
            title: 'FoundIt Unsri',
            items,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


app.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM item WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).send('Item not found');
        }

        const item = rows[0];

        res.render('detail', {
            layout: 'layouts/main-layout',
            title: 'FoundIt Unsri - Detail',
            item
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main-layout',
        title: 'login',
    })
})

app.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM item ORDER BY created_at DESC');

        res.render('dashboard', {
            layout: 'layouts/main-layout',
            title: 'FoundIt Unsri - Dashboard',
            items: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const id = uuidv4();
        await pool.query('INSERT INTO user (id, username, password) VALUES (?, ?, ?)', [
            id,
            username,
            hashedPassword,
        ]);

        res.status(201).json({ message: 'User berhasil dibuat' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}); 


 
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;        

        const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.send('Username tidak ditemukan');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.send('Password salah');
        }

        req.session.user = { id: user.id, username: user.username };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/logout', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.clearCookie('connect.sid');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal logout');
  }
});


app.post('/item/add', upload.single('photo'), async (req, res) => {
    try {
        const id = uuidv4();
        const { name, location, time, description } = req.body;
        const local = JSON.parse(req.body.location);
        const location_name = local.name;
        const latitude = local.lat;
        const longitude = local.lng;
        const photo = req.file ? '/uploads/' + req.file.filename : null;

        await pool.query(
            'INSERT INTO item (id, name, location, latitude, longitude, time, photo, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, location_name, latitude, longitude, time, photo, description]
        );

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.post('/item/edit/:id', upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, time, description, status } = req.body;

        // Ambil data lama
        const [rows] = await pool.query('SELECT photo FROM item WHERE id = ?', [id]);
        const oldPhoto = rows[0]?.photo;

        const local = JSON.parse(location);
        const location_name = local.name;
        const latitude = local.lat;
        const longitude = local.lng;

        let photo = oldPhoto;
        if (req.file) {
            if (oldPhoto) {
                const oldPath = path.join(__dirname, 'public', oldPhoto);
                fs.unlink(oldPath, (err) => {
                    if (err) console.error('Gagal hapus foto lama:', err);
                });
            }
            photo = '/uploads/' + req.file.filename;
        }

        let sql = `
            UPDATE item
            SET name = ?, location = ?, latitude = ?, longitude = ?, time = ?, description = ?, status = ?, photo = ?
            WHERE id = ?
        `;

        let params = [name, location_name, latitude, longitude, time, description, status, photo, id];

        await pool.query(sql, params); 

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.post('/item/delete/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const [rows] = await pool.query('SELECT photo FROM item WHERE id = ?', [itemId]);

        if (rows.length === 0) {
            return res.status(404).send('Item tidak ditemukan');
        }

        const item = rows[0];

        if (item.photo) {
            const filePath = path.join(__dirname, 'public', item.photo);
            fs.unlink(filePath, (err) => {
                if (err) console.warn('Gagal hapus foto lama:', err);
            });
        }

        await pool.query('DELETE FROM item WHERE id = ?', [itemId]);

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan server');
    }
});


app.listen(process.env.PORT, () => {
    console.log(`FoundIt Unsri | listening at http://localhost:${process.env.PORT}`);
})