require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { stat } = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* MENU */
/* Get */
app.get('/api/menu', async (req, res) => {
    const { data, error } = await supabase.from('menu').select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data });
});

/* Create */
app.post('/api/menu', async (req, res) => {
    const { nama_kategori, nama_makanan, harga, gambar, status } = req.body;
    const statusBool = (status === 'true' || status === true);
    
    const { data, error } = await supabase
        .from('menu')
        .insert([{ nama_kategori, nama_makanan, harga, gambar, status: statusBool }])
        .select();
        
    if (error) return res.status(400).json({ error: error.message });
    res.json({ pesan: 'Menu berhasil ditambahkan!', id_baru: data[0].id });
});

/* Update */
app.put('/api/menu/:id', async (req, res) => {
    const id = req.params.id;
    const { nama_kategori, nama_makanan, harga, gambar, status } = req.body;
    const statusBool = (status === 'true' || status === true);
    
    const { error } = await supabase
        .from('menu')
        .update({ nama_kategori, nama_makanan, harga, gambar, status: statusBool })
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Data menu berhasil diperbarui!' });
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
/* Get */
app.get('/api/konten', async (req, res) => {
    const { data, error } = await supabase.from('konten_web').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

/* Update */
app.put('/api/konten', async (req, res) => {
    const { teks_hero, teks_about } = req.body;
    const { error } = await supabase.from('konten_web').update({ teks_hero, teks_about }).eq('id', 1);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pesan: 'Konten web berhasil diperbarui!' });
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
        if (!u || !(await bcrypt.compare(password, u.password)))
            return res.status(401).json({ error: 'Email atau password salah.' });

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

app.listen(port, () => {
    console.log(`Server backend (Supabase) berjalan di http://localhost:${port}`);
});

/* MAPS */
/* Get */
app.get('/api/maps', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('maps')
            .select('*')
            .eq('id', 1)
            .single();
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Put */
app.put('/api/maps', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const { error } = await supabase
            .from('maps')
            .update({ latitude, longitude })
            .eq('id', 1);
            
        if (error) throw error;
        res.json({ pesan: 'Lokasi restoran berhasil diperbarui di database!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* PESANAN */
/* Post */
app.post('/api/pesanan', async (req, res) => {
    try {
        const { /*nama,*/ item, total } = req.body;
        
        const { data, error } = await supabase
            .from('pesanan')
            .insert([{ 
                // nama: nama, 
                item: item, 
                total: parseInt(total), 
                status: 'pending'
            }]);

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
