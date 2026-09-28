require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

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
    const { nama_kategori, nama_makanan, harga, gambar } = req.body;
    
    const { data, error } = await supabase
        .from('menu')
        .insert([{ nama_kategori, nama_makanan, harga, gambar }])
        .select();
        
    if (error) return res.status(400).json({ error: error.message });
    res.json({ pesan: 'Menu berhasil ditambahkan!', id_baru: data[0].id });
});

/* Update */
app.put('/api/menu/:id', async (req, res) => {
    const id = req.params.id;
    const { nama_kategori, nama_makanan, harga, gambar } = req.body;
    
    const { error } = await supabase
        .from('menu')
        .update({ nama_kategori, nama_makanan, harga, gambar })
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
