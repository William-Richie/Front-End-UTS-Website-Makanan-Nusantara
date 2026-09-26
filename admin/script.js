$(document).ready(function() {
    /* Sidebar */
    $('#admin-nav a').on('click', function(e) {
        e.preventDefault(); 
        
        $('#admin-nav a').removeClass('active');
        $(this).addClass('active');

        let targetId = $(this).data('target');
        $('.tab-section').hide();$('#' + targetId).fadeIn(300);
    });

    /* Statistik */
    function muatStatistikDanKonten() {
        $.get('/api/statistik', function(data) {
            $('#angka-pengunjung').text(data.jumlah_pengunjung);
        });
        
        $.get('/api/konten', function(data) {
            $('#teks_hero').val(data.teks_hero);
            $('#teks_about').val(data.teks_about);
        });
    }

    muatStatistikDanKonten();

    /* Update Content */
    $('#form-konten .btn-simpan').on('click', function() {
        let $btn =$(this);
        let originalText = $btn.text();$btn.prop('disabled', true).text('Memperbarui...'); 

        let dataKonten = {
            teks_hero: $('#teks_hero').val(),
            teks_about: $('#teks_about').val()
        };

        $.ajax({
            url: '/api/konten',
            type: 'PUT',
            data: dataKonten,
            success: function(response) {
                alert(response.pesan);
            }
        }).always(function() {
            $btn.prop('disabled', false).text(originalText);
        });
    });

    /* Data Menu */
    function muatDataMenu() {
        $.get('/api/menu', function(response) {
            let rows = '';
            let jumlahMenu = 0;
            response.data.forEach(function(item) {
                jumlahMenu++;
                rows += `
                    <tr>
                        <td>${item.id}</td>
                        <td><img src="${item.gambar}" class="preview" alt="foto"></td>
                        <td>${item.nama_kategori}</td>
                        <td>${item.nama_makanan}</td>
                        <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
                        <td>
                            <button class="btn-edit" data-id="${item.id}" data-kategori="${item.nama_kategori}" data-nama="${item.nama_makanan}" data-harga="${item.harga}" data-gambar="${item.gambar}">Edit</button>
                            <button class="btn-hapus" data-id="${item.id}">Hapus</button>
                        </td>
                    </tr>
                `;
            });
            $('#tabel-menu tbody').html(rows);
            $('#angka-menu').text(jumlahMenu); 
        });
    }

    muatDataMenu();

    function resetForm() {
        $('#form-tambah-menu')[0].reset();
        $('#edit_id').val('');
        $('#judul-form').text('Input Menu Baru');
        $('#btn-submit').text('Simpan ke Database').css('background-color', '#27ae60');
        $('#btn-cancel').hide();
    }

    $('#form-tambah-menu').on('submit', function(e) {
        e.preventDefault(); 
        
        let $btnSubmit =$('#btn-submit');
        let originalText = $btnSubmit.text();$btnSubmit.prop('disabled', true).text('Menyimpan...'); 
        
        let id = $('#edit_id').val();
        let dataMenu = {
            nama_kategori: $('#kategori').val(),
            nama_makanan: $('#nama_makanan').val(),
            harga: $('#harga').val(),
            gambar: $('#gambar').val()
        };

        if (id) {
            $.ajax({
                url: '/api/menu/' + id,
                type: 'PUT',
                data: dataMenu,
                success: function(response) {
                    alert(response.pesan);
                    resetForm();
                    muatDataMenu();
                }
            }).always(function() {
                $btnSubmit.prop('disabled', false).text(originalText);
            });
        } else {
            $.post('/api/menu', dataMenu, function(response) {
                alert(response.pesan);
                resetForm();
                muatDataMenu();
            }).always(function() {
                $btnSubmit.prop('disabled', false).text(originalText);
            });
        }
    });

    $(document).on('click', '.btn-edit', function() {$('#edit_id').val($(this).data('id'));$('#kategori').val($(this).data('kategori'));$('#nama_makanan').val($(this).data('nama'));$('#harga').val($(this).data('harga'));$('#gambar').val($(this).data('gambar'));$('#judul-form').text('Edit Data Menu');
        $('#btn-submit').text('Update Data').css('background-color', '#f39c12');
        $('#btn-cancel').show();
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    });

    $('#btn-cancel').on('click', resetForm);

    $(document).on('click', '.btn-hapus', function() {
        let id = $(this).data('id');
        if (confirm('Yakin ingin menghapus menu ini?')) {
            $.ajax({
                url: '/api/menu/' + id,
                type: 'DELETE',
                success: function(response) {
                    alert(response.pesan);
                    muatDataMenu(); 
                }
            });
        }
    });
});