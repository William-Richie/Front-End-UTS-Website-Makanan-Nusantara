require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const ADMIN_SECRET = process.env.JWT_SECRET + '-admin';
const API_PUBLIK = [
    ['GET',  /^\/(menu|favorit|faq|konten|maps)$/],
    ['POST', /^\/(pengunjung|pesanan|faq\/pertanyaan|register|login|admin\/login)$/],
    ['ANY',  /^\/(me|reservasi)(\/|$)/]
];
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* Admin protection */
app.use('/api', (req, res, next) => {
    if (API_PUBLIK.some(([m, re]) => (m === 'ANY' || m === req.method) && re.test(req.path))) return next();
    try {
        const token = (req.headers.authorization || '').replace('Bearer ', '');
        if (jwt.verify(token, ADMIN_SECRET).role !== 'admin') throw new Error();
        next();
    } catch {
        res.status(401).json({ error: 'Akses admin diperlukan.' });
    }
});

/* Redirect */
app.get('/', (req, res) => {
    res.redirect('/user/index.html');
});

app.get('/user', (req, res) => {
    res.redirect('/user/index.html');
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/index.html');
});

/* MENU */
/* Get */
app.get('/api/menu', async (req, res) => {
    const { data, error } = await supabase.from('menu').select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data });
});

/* Create */
app.post('/api/menu', async (req, res) => {
    const { nama_kategori, nama_makanan, harga, gambar, status, deskripsi, pedas} = req.body;
    const statusBool = (status === 'true' || status === true);
    
    const { data, error } = await supabase
        .from('menu')
        .insert([{ nama_kategori, nama_makanan, harga, gambar, status: statusBool, deskripsi, pedas}])
        .select();
        
    if (error) return res.status(400).json({ error: error.message });
    res.json({ pesan: 'Menu berhasil ditambahkan!', id_baru: data[0].id });
});

/* Update */
app.put('/api/menu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const {
            nama_kategori,
            nama_makanan,
            harga,
            gambar,
            status,
            deskripsi,
            pedas
        } = req.body;
        const statusBool = status === 'true' || status === true;
        const { error } = await supabase
            .from('menu')
            .update({
                nama_kategori,
                nama_makanan,
                harga,
                gambar,
                status: statusBool,
                deskripsi,
                pedas
            })
            .eq('id', id);
        if (error) {
            console.error('Error PUT /api/menu/:id:', error.message);
            return res.status(500).json({
                error: error.message
            });
        }
        res.json({
            pesan: 'Data menu berhasil diperbarui!'
        });
    } catch (err) {
        console.error('Error PUT /api/menu/:id:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

/* Delete */
app.delete('/api/menu/:id', async (req, res) => {
    const id = req.params.id;
    
    const { error } = await supabase
        .from('menu')
        .delete()
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Menu berhasil dihapus!' });
});

/* Favorite Menus */
/* Get */
app.get('/api/favorit', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favorit')
            .select(`
                slot,
                menu_id,
                menu (
                    id,
                    nama_makanan,
                    deskripsi,
                    gambar,
                    pedas,
                    status
                )
            `)
            .order('slot', { ascending: true });

        if (error) throw error;
        const cleanedData = data.map(item => {
            return {
                slot: item.slot,
                menu_id: item.menu_id,
                nama_makanan: item.menu ? item.menu.nama_makanan : null,
                deskripsi: item.menu ? item.menu.deskripsi : null,
                gambar: item.menu ? item.menu.gambar : null,
                pedas: item.menu ? item.menu.pedas : null,
                status: item.menu ? item.menu.status : null
            };
        });

        res.status(200).json({ data: cleanedData });
    } catch (error) {
        console.error("Error GET /api/favorit:", error);
        res.status(500).json({ error: error.message });
    }
});

/* Put */
app.put('/api/favorit', async (req, res) => {
    try {
        const payloadData = req.body.data; 
        
        if (!Array.isArray(payloadData)) {
            return res.status(400).json({ error: 'Format data tidak valid.' });
        }

        const { data, error } = await supabase
            .from('favorit')
            .upsert(payloadData, { onConflict: 'slot' }) 
            .select();

        if (error) throw error;

        res.status(200).json({ pesan: 'Menu favorit berhasil diperbarui!' });
    } catch (error) {
        console.error("Error PUT /api/favorit:", error);
        res.status(500).json({ error: error.message });
    }
});

/* FAQ */
/* Get */
app.get('/api/faq', async (req, res) => {
    const { data, error } = await supabase.from('faq').select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data });
});

/* Create */
app.post('/api/faq', async (req, res) => {
    const { pertanyaan, jawaban } = req.body;
    
    const { data, error } = await supabase
        .from('faq')
        .insert([{ pertanyaan, jawaban }])
        .select();
        
    if (error) return res.status(400).json({ error: error.message });
    res.json({ pesan: 'FAQ berhasil ditambahkan!', id_baru: data[0].id });
});

/* Update */
app.put('/api/faq/:id', async (req, res) => {
    const id = req.params.id;
    const { pertanyaan, jawaban } = req.body;
    
    const { error } = await supabase
        .from('faq')
        .update({ pertanyaan, jawaban })
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Data FAQ berhasil diperbarui!' });
});

/* Delete */
app.delete('/api/faq/:id', async (req, res) => {
    const id = req.params.id;
    
    const { error } = await supabase
        .from('faq')
        .delete()
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'FAQ berhasil dihapus!' });
});

/* PERTANYAAN PENGUNJUNG */
const riwayatTanya = new Map();
const batasWaktu = 24 * 60 * 60 * 1000;
function batasTanya(req, res, next) {
    const sekarang = Date.now();
    const waktu = (riwayatTanya.get(req.ip) || []).filter(t => sekarang - t < batasWaktu);
    if (waktu.length >= 3) {
        return res.status(429).json({ error: 'Batas harian tercapai. Maksimal 3 pertanyaan per hari.' });
    }
    next();
}

/* Post */
app.post('/api/faq/pertanyaan', batasTanya, async (req, res) => {
    const pertanyaan = String(req.body.pertanyaan ?? '').trim();
    const nama = String(req.body.nama ?? '').trim();
    const email = String(req.body.email ?? '').trim().toLowerCase();

    if (pertanyaan.length < 10 || pertanyaan.length > 300)
        return res.status(400).json({ error: 'Pertanyaan harus 10 - 300 karakter.' });
    if (nama.length > 40)
        return res.status(400).json({ error: 'Nama maksimal 40 karakter.' });
    if (email && (email.length > 100 || !/^\S+@\S+\.\S+$/.test(email)))
        return res.status(400).json({ error: 'Format email belum benar.' });

    const { error } = await supabase
        .from('faq_pertanyaan')
        .insert([{ pertanyaan, nama: nama || null, email: email || null }]);

    if (error) return res.status(500).json({ error: error.message });
    
    const sekarang = Date.now();
    const waktu = (riwayatTanya.get(req.ip) || []).filter(t => sekarang - t < batasWaktu);
    waktu.push(sekarang);
    riwayatTanya.set(req.ip, waktu);

    res.status(201).json({ pesan: 'Pertanyaan berhasil dikirim!' });
});

/* Get (admin) */
app.get('/api/admin/pertanyaan', async (req, res) => {
    let query = supabase.from('faq_pertanyaan').select('*').order('created_at', { ascending: false });
    if (req.query.dibaca === 'true' || req.query.dibaca === 'false')
        query = query.eq('dibaca', req.query.dibaca === 'true');

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data });
});

/* Put (admin tandai semua dibaca) */
app.put('/api/admin/pertanyaan', async (req, res) => {
    const { data, error } = await supabase
        .from('faq_pertanyaan')
        .update({ dibaca: true })
        .eq('dibaca', false)
        .select('id');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: `${data.length} pertanyaan ditandai sudah dibaca.` });
});

/* Put (admin tandai sudah/belum dibaca) */
app.put('/api/admin/pertanyaan/:id', async (req, res) => {
    const dibaca = (req.body.dibaca === 'true' || req.body.dibaca === true);

    const { error } = await supabase
        .from('faq_pertanyaan')
        .update({ dibaca })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: dibaca ? 'Ditandai sudah dibaca.' : 'Ditandai belum dibaca.' });
});

/* Delete (admin) */
app.delete('/api/admin/pertanyaan/:id', async (req, res) => {
    const { error } = await supabase
        .from('faq_pertanyaan')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Pertanyaan berhasil dihapus!' });
});

/* STATISTIK PENGUNJUNG */
app.get('/api/statistik', async (req, res) => {
    const { data, error } = await supabase.from('statistik').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

/* Pengunjung bertambah 1 setiap web dibuka */
app.post('/api/pengunjung', async (req, res) => {
    const { data: currentData, error: fetchError } = await supabase.from('statistik').select('jumlah_pengunjung').eq('id', 1).single();
    if (fetchError) return res.status(500).json({ error: fetchError.message });

    const newCount = currentData.jumlah_pengunjung + 1;
    
    const { error: updateError } = await supabase.from('statistik').update({ jumlah_pengunjung: newCount }).eq('id', 1);
    if (updateError) return res.status(500).json({ error: updateError.message });
    
    res.json({ pesan: 'Pengunjung bertambah' });
});

/* KONTEN WEBSITE */
const KONTEN_EXTRA_PATH = path.join(__dirname, 'konten_extra.json');
const defaultKontenExtra = {
    hero_eyebrow: "Cita Rasa Timur Indonesia",
    hero_sub: "Cita rasa asli Timur Indonesia, dari sagu hingga kuah kuning.",
    about_eyebrow: "Tentang Kami",
    about_title: "Warisan Rasa dari Timur",
    card1_title: "Bahan Segar",
    card1_desc: "Sagu dan hasil laut dipilih segar setiap hari.",
    card2_title: "Resep Turun-temurun",
    card2_desc: "Resep rahasia yang menjaga keaslian rasa.",
    card3_title: "Disajikan Sepenuh Hati",
    card3_desc: "Suasana hangat ala rumah, cocok untuk keluarga."
};

function getKontenExtra() {
    try {
        if (fs.existsSync(KONTEN_EXTRA_PATH)) {
            const raw = fs.readFileSync(KONTEN_EXTRA_PATH, 'utf-8');
            return { ...defaultKontenExtra, ...JSON.parse(raw) };
        }
    } catch (e) {
        console.error('Error reading konten_extra.json:', e);
    }
    return { ...defaultKontenExtra };
}

function saveKontenExtra(extra) {
    try {
        const current = getKontenExtra();
        const merged = { ...current, ...extra };
        fs.writeFileSync(KONTEN_EXTRA_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error writing konten_extra.json:', e);
    }
}

/* Get */
app.get('/api/konten', async (req, res) => {
    let baseData = { teks_hero: 'Welcome to Our Papeda Restaurant', teks_about: 'Selamat datang di Papeda Restaurant...' };
    try {
        const { data, error } = await supabase.from('konten_web').select('*').eq('id', 1).single();
        if (!error && data) baseData = data;
    } catch (err) {
        console.error('Supabase konten_web error:', err);
    }
    const extra = getKontenExtra();
    res.json({ ...extra, ...baseData });
});

/* Update */
app.put('/api/konten', async (req, res) => {
    const {
        teks_hero,
        teks_about,
        hero_eyebrow,
        hero_sub,
        about_eyebrow,
        about_title,
        card1_title,
        card1_desc,
        card2_title,
        card2_desc,
        card3_title,
        card3_desc
    } = req.body;

    try {
        if (teks_hero !== undefined || teks_about !== undefined) {
            const updatePayload = {};
            if (teks_hero !== undefined) updatePayload.teks_hero = teks_hero;
            if (teks_about !== undefined) updatePayload.teks_about = teks_about;
            await supabase.from('konten_web').update(updatePayload).eq('id', 1);
        }
    } catch (err) {
        console.error('Supabase update konten_web error:', err);
    }

    saveKontenExtra({
        hero_eyebrow,
        hero_sub,
        about_eyebrow,
        about_title,
        card1_title,
        card1_desc,
        card2_title,
        card2_desc,
        card3_title,
        card3_desc
    });

    res.json({ pesan: 'Konten web berhasil diperbarui!' });
});

/* KONTEN FOOTER */
/* Get */
app.get('/api/footer', async (req, res) => {
    const { data, error } = await supabase.from('konten_footer').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

/* Update */
app.put('/api/footer', async (req, res) => {
    const { judul, copyright, link_ig, link_wa, link_tiktok, email, link_linkedin } = req.body;
    const { error } = await supabase.from('konten_footer').update({ judul, copyright, link_ig, link_wa, link_tiktok, email, link_linkedin }).eq('id', 1);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Konten footer berhasil diperbarui!' });
});

/* AUTH */
const buatToken = (u) => jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Silakan login terlebih dahulu.' });
    }
}

/* Register */
app.post('/api/register', async (req, res) => {
    try {
        const nama = (req.body.nama || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!nama || !email || password.length < 6)
            return res.status(400).json({ error: 'Nama, email, dan password (min. 6 karakter) wajib diisi.' });
        if (!/^\S+@\S+\.\S+$/.test(email))
            return res.status(400).json({ error: 'Format email tidak valid.' });

        const { data: ada } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (ada) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });

        const hash = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('users').insert([{ nama, email, password: hash }])
            .select('id, nama, email').single();
        if (error) throw error;

        res.status(201).json({ token: buatToken(data), user: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Login */
app.post('/api/login', async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        const { data: u } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
        if (!u || !(await bcrypt.compare(password, u.password))) {
            return res.status(401).json({
                error: 'Email atau password salah.'
            });
        }

        if (u.Is_Active === false) {
            return res.status(403).json({
                error: 'Akun kamu telah diblokir oleh admin.'
            });
        }

        const user = { id: u.id, nama: u.nama, email: u.email };
        res.json({ token: buatToken(user), user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Profil */
app.get('/api/me', auth, async (req, res) => {
    const { data, error } = await supabase.from('users').select('id, nama, email').eq('id', req.user.id).single();
    if (error) return res.status(401).json({ error: 'Akun tidak ditemukan.' });
    res.json({ user: data });
});

app.put('/api/me', auth, async (req, res) => {
    const nama = (req.body.nama || '').trim();
    if (!nama) return res.status(400).json({ error: 'Nama tidak boleh kosong.' });
    const { data, error } = await supabase.from('users').update({ nama })
        .eq('id', req.user.id).select('id, nama, email').single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ user: data });
});

/* RESERVASI */
/* User */
app.post('/api/reservasi', auth, async (req, res) => {
    try {
        const { gerai, nama, email, telepon, tanggal, jumlah, sesi, jam, ruangan, catatan } = req.body;

        if (!gerai || !nama || !email || !telepon || !tanggal || !jumlah || !sesi || !jam || !ruangan)
            return res.status(400).json({ error: 'Semua data reservasi wajib diisi.' });
        if (jumlah < 1 || jumlah > 20)
            return res.status(400).json({ error: 'Jumlah tamu 1 - 20 orang.' });
        if (new Date(tanggal) < new Date(new Date().toDateString()))
            return res.status(400).json({ error: 'Tanggal reservasi tidak boleh sudah lewat.' });

        const { data, error } = await supabase.from('reservasi').insert([{
            user_id: req.user.id, gerai, nama, email, telepon, tanggal,
            jumlah: parseInt(jumlah), sesi, jam, ruangan, catatan
        }]).select().single();
        if (error) throw error;

        res.status(201).json({ pesan: 'Reservasi berhasil dibuat!', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reservasi', auth, async (req, res) => {
    const { data, error } = await supabase.from('reservasi').select('*')
        .eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
});

app.put('/api/reservasi/:id/batal', auth, async (req, res) => {
    const { error } = await supabase.from('reservasi').update({ status: 'dibatalkan' })
        .eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Reservasi dibatalkan.' });
});

/* admin */
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, nama, email, created_at, Is_Active')
        .order('created_at', { ascending: true });

        if (userError) throw userError;

        const { data: reservasi, error: resError } = await supabase
            .from('reservasi')
            .select('user_id');

        if (resError) throw resError;

        const usersWithCount = (users || []).map(u => ({
            ...u,
            total_reserve: (reservasi || []).filter(r => r.user_id === u.id).length
        }));

        res.json({ data: usersWithCount });
    } catch (err) {
        console.error("Error /api/admin/users:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/reservasi', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservasi')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/reservasi/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { error } = await supabase
            .from('reservasi')
            .update({ status })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ pesan: `Status berhasil diubah menjadi ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/status', async (req, res) => {
    try {
        const { ids, Is_Active } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: 'Tidak ada user yang dipilih.'
            });
        }

        if (typeof Is_Active !== 'boolean') {
            return res.status(400).json({
                message: 'Nilai Is_Active harus true atau false.'
            });
        }

        console.log('UPDATE USER STATUS');
        console.log('IDs:', ids);
        console.log('Is_Active:', Is_Active);

        const { data, error } = await supabase
            .from('users')
            .update({
                Is_Active: Is_Active
            })
            .in('id', ids)
            .select('id, nama, email, Is_Active');

        if (error) {
            console.error('Supabase UPDATE error:', error);

            return res.status(500).json({
                message: 'Gagal menyimpan perubahan ke database.',
                error: error.message
            });
        }

        console.log('Hasil update:', data);

        res.status(200).json({
            message: Is_Active
                ? 'User berhasil diaktifkan.'
                : 'User berhasil diblokir.',
            data: data
        });

    } catch (error) {
        console.error('Error update status user:', error);

        res.status(500).json({
            message: 'Gagal update status.',
            error: error.message
        });
    }
});

app.delete('/api/admin/users', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: 'Tidak ada user yang dipilih.'
            });
        }

        console.log('DELETE USERS:', ids);

        const { data, error } = await supabase
            .from('users')
            .delete()
            .in('id', ids)
            .select('id, nama, email');

        if (error) {
            console.error('Supabase DELETE error:', error);

            return res.status(500).json({
                message: 'Gagal menghapus user dari database.',
                error: error.message
            });
        }

        console.log('User yang dihapus:', data);

        res.status(200).json({
            message: 'User berhasil dihapus permanen.',
            data: data
        });

    } catch (error) {
        console.error('Error delete user:', error);

        res.status(500).json({
            message: 'Gagal hapus user.',
            error: error.message
        });
    }
});

/* MAPS */
const bacaCabang = (b = {}) => ({
    nama: String(b.nama ?? '').trim(),
    alamat: String(b.alamat ?? '').trim(),
    latitude: Number(b.latitude),
    longitude: Number(b.longitude)
});

const cabangValid = (c) =>
    c.nama && c.alamat && Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180;

/* Get */
app.get('/api/maps', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('maps')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Post */
app.post('/api/maps', async (req, res) => {
    const cabang = bacaCabang(req.body);
    if (!cabangValid(cabang)) return res.status(400).json({ error: 'Data cabang tidak valid.' });

    cabang.id = Date.now();

    const { data, error } = await supabase
        .from('maps')
        .insert([cabang])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ pesan: 'Cabang berhasil ditambahkan!', id_baru: data[0].id });
});

/* Put */
app.put('/api/maps/:id', async (req, res) => {
    const cabang = bacaCabang(req.body);
    if (!cabangValid(cabang)) return res.status(400).json({ error: 'Data cabang tidak valid.' });

    const { error } = await supabase
        .from('maps')
        .update(cabang)
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Cabang berhasil diperbarui!' });
});

/* Delete */
app.delete('/api/maps/:id', async (req, res) => {
    const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Cabang berhasil dihapus!' });
});

/* PESANAN */
/* Post */
app.post('/api/pesanan', async (req, res) => {
    try {
        const { nama, item, total } = req.body;
        
        const payload = {
            item: item,
            total: parseInt(total),
            status: 'pending'
        };
        if (nama) payload.nama = String(nama).trim();

        let { data, error } = await supabase
            .from('pesanan')
            .insert([payload]);

        if (error && error.message && error.message.toLowerCase().includes('nama')) {
            delete payload.nama;
            const retry = await supabase.from('pesanan').insert([payload]);
            data = retry.data;
            error = retry.error;
        }

        if (error) throw error;

        res.status(201).json({ pesan: 'Pesanan berhasil dibuat', data: data });
    } catch (error) {
        console.error("Error POST /api/pesanan:", error);
        res.status(500).json({ error: error.message });
    }
});

/* Get */
app.get('/api/pesanan', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pesanan')
            .select('*')
            .neq('status', 'selesai')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ data: data });
    } catch (error) {
        console.error("Error GET /api/pesanan:", error);
        res.status(500).json({ error: error.message });
    }
});

/* Put */
app.put('/api/pesanan/:id', async (req, res) => {
    try {
        const idPesanan = req.params.id;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('pesanan')
            .update({ status: status })
            .eq('id', idPesanan);

        if (error) throw error;

        res.status(200).json({ pesan: `Status pesanan berhasil diubah menjadi ${status}` });
    } catch (error) {
        console.error("Error PUT /api/pesanan/:id:", error);
        res.status(500).json({ error: error.message });
    }
});

/* PENDAPATAN */
const WIB = 'Asia/Jakarta';
const tglWIB = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: WIB });
const jamWIB = (d) => new Date(d).toLocaleString('en-GB', { timeZone: WIB, hour: '2-digit', hourCycle: 'h23' });

function daftarTanggal(n) {
    const hariIni = tglWIB(Date.now());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(hariIni + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - i);
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

app.get('/api/pendapatan', async (req, res) => {
    try {
        const range = req.query.range || '7';
        const hariIni = tglWIB(Date.now());
        const n = range === 'hari' ? 1 : range === '30' ? 30 : range === 'bulan' ? parseInt(hariIni.slice(8, 10)) : 7;
        const tanggal = daftarTanggal(n);

        const [{ data: rows, error }, { data: menu }] = await Promise.all([
            supabase.from('pesanan').select('item, total, created_at')
                .eq('status', 'selesai')
                .gte('created_at', `${tanggal[0]}T00:00:00+07:00`),
            supabase.from('menu').select('nama_makanan, harga')
        ]);
        if (error) throw error;

        const harga = {};
        (menu || []).forEach(m => { harga[m.nama_makanan.trim().toLowerCase()] = m.harga; });

        const perHari = {};
        tanggal.forEach(t => { perHari[t] = { tanggal: t, pesanan: 0, item: 0, pendapatan: 0 }; });
        const perJam = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, '0') + ':00', total: 0 }));
        const perMenu = {};
        let total = 0, totalItem = 0, totalPesanan = 0;

        (rows || []).forEach(r => {
            const t = tglWIB(r.created_at);
            if (!perHari[t]) return;

            const nilai = Number(r.total) || 0;
            const daftar = String(r.item || '').replace(/^\[[^\]]*\]\s*/, '').split(',').map(s => s.trim()).filter(Boolean);

            let itemsCountInOrder = 0;
            daftar.forEach(namaRaw => {
                const match = namaRaw.match(/^(.*?)(?:\s*\((?:x?(\d+)|(\d+)x)\))?$/i);
                const nama = (match && match[1]) ? match[1].trim() : namaRaw.trim();
                const qty = (match && (match[2] || match[3])) ? parseInt(match[2] || match[3], 10) : 1;
                itemsCountInOrder += qty;
                const key = nama.toLowerCase();
                if (!perMenu[key]) perMenu[key] = { nama, qty: 0, pendapatan: 0 };
                perMenu[key].qty += qty;
                perMenu[key].pendapatan += (harga[key] || 0) * qty;
            });

            perHari[t].pesanan++;
            perHari[t].item += itemsCountInOrder;
            perHari[t].pendapatan += nilai;
            perJam[parseInt(jamWIB(r.created_at), 10)].total += nilai;

            total += nilai;
            totalItem += itemsCountInOrder;
            totalPesanan++;
        });

        const hari = Object.values(perHari);
        res.json({
            ringkasan: { total, pesanan: totalPesanan, item: totalItem, rata: totalPesanan ? Math.round(total / totalPesanan) : 0 },
            grafik: range === 'hari' ? perJam : hari.map(h => ({ label: h.tanggal, total: h.pendapatan })),
            terlaris: Object.values(perMenu).sort((a, b) => b.qty - a.qty).slice(0, 5),
            laporan: [...hari].reverse()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server backend (Supabase) berjalan di http://localhost:${port}`);
});

/* Login Admin */
const gagalLogin = {};

app.post('/api/admin/login', async (req, res) => {
    const g = gagalLogin[req.ip] || { n: 0, sampai: 0 };
    if (g.sampai > Date.now())
        return res.status(429).json({ error: 'Terlalu banyak percobaan gagal.', sisa: Math.ceil((g.sampai - Date.now()) / 1000) });

    const { username = '', password = '' } = req.body;
    let ok = false;
try { ok = username === process.env.ADMIN_USER && await bcrypt.compare(password, process.env.ADMIN_PASS_HASH || ''); } catch {}

    if (!ok) {
        g.n++;
        if (g.n >= 5) { g.sampai = Date.now() + 5 * 60 * 1000; g.n = 0; }
        gagalLogin[req.ip] = g;
        return res.status(401).json({ error: 'Username atau password salah.' });
    }

    delete gagalLogin[req.ip];
    res.json({ token: jwt.sign({ role: 'admin', user: username }, ADMIN_SECRET, { expiresIn: '8h' }) });
});

app.get('/api/admin/cek', (req, res) => res.json({ ok: true }));