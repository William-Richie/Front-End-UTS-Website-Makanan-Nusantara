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
        $.get('http://localhost:3000/api/statistik', function(data) {
            $('#angka-pengunjung').text(data.jumlah_pengunjung);
        });
        
        $.get('http://localhost:3000/api/konten', function(data) {
            $('#teks_hero').val(data.teks_hero);
            $('#teks_about').val(data.teks_about);
        });
    }

    muatStatistikDanKonten();

    /* Update Content */
    $('#form-konten .btn-simpan').on('click', function(e) {
        e.preventDefault();
        let $btn =$(this);
        let originalText = $btn.text();$btn.prop('disabled', true).text('Memperbarui...'); 

        let dataKonten = {
            teks_hero: $('#teks_hero').val(),
            teks_about: $('#teks_about').val()
        };

        $.ajax({
            url: 'http://localhost:3000/api/konten',
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
        $.get('http://localhost:3000/api/menu', function(response) {
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
                url: 'http://localhost:3000/api/menu/' + id,
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
            $.post('http://localhost:3000/api/menu', dataMenu, function(response) {
                alert(response.pesan);
                resetForm();
                muatDataMenu();
            })
            .fail(function(xhr) {
                console.log('ERROR:', xhr);
                console.log('STATUS:', xhr.status);
                console.log('RESPONSE:', xhr.responseText);
                alert('Gagal menambahkan menu. Cek Console.');
            })
            .always(function() {
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
                url: 'http://localhost:3000/api/menu/' + id,
                type: 'DELETE',
                success: function(response) {
                    alert(response.pesan);
                    muatDataMenu(); 
                }
            });
        }
    });

    /* Maps */
    let mapAdmin = null;
    let markerAdmin;
    let latTersimpan = -6.200000;
    let lngTersimpan = 106.816666;

    $.get('http://localhost:3000/api/maps', function(data) {
        if (data && !isNaN(parseFloat(data.latitude)) && !isNaN(parseFloat(data.longitude))) {
            latTersimpan = parseFloat(data.latitude);
            lngTersimpan = parseFloat(data.longitude);
        }
        $('#input-lat').val(latTersimpan);
        $('#input-lng').val(lngTersimpan);
    }).fail(function() {
        $('#input-lat').val(latTersimpan);
        $('#input-lng').val(lngTersimpan);
        console.warn("Gagal mengambil kordinat dari database, menggunakan lokasi default.");
    });

    $('#admin-nav a[data-target="tab-lokasi"]').on('click', function() {
        setTimeout(function() {
            if (!mapAdmin) {
                mapAdmin = L.map('map-admin').setView([latTersimpan, lngTersimpan], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapAdmin);

                markerAdmin = L.marker([latTersimpan, lngTersimpan], {draggable: true}).addTo(mapAdmin);
                
                markerAdmin.on('dragend', function(e) {
                    let posisi = markerAdmin.getLatLng();
                    $('#input-lat').val(posisi.lat.toFixed(6));
                    $('#input-lng').val(posisi.lng.toFixed(6));
                    $('#btn-reset-lokasi').fadeIn();
                });

                mapAdmin.on('click', function(e) {
                    markerAdmin.setLatLng(e.latlng);
                    $('#input-lat').val(e.latlng.lat.toFixed(6));
                    $('#input-lng').val(e.latlng.lng.toFixed(6));
                    $('#btn-reset-lokasi').fadeIn();
                });
            } else {
                mapAdmin.invalidateSize();
            }
        }, 350);
    });

    $('#btn-reset-lokasi').on('click', function() {
        let posisiAwal = new L.LatLng(latTersimpan, lngTersimpan);
        
        markerAdmin.setLatLng(posisiAwal);
        mapAdmin.setView(posisiAwal, 15);
        
        $('#input-lat').val(posisiAwal.lat.toFixed(6));
        $('#input-lng').val(posisiAwal.lng.toFixed(6));
        $(this).fadeOut();
    });

    $('#form-lokasi .btn-simpan').on('click', function(e) {
        e.preventDefault();
        
        let newLat = parseFloat($('#input-lat').val());
        let newLng = parseFloat($('#input-lng').val());
        let $btn = $(this);
        let originalText = $btn.text();
        
        $btn.text('Menyimpan...').prop('disabled', true);

        $.ajax({
            url: 'http://localhost:3000/api/maps',
            type: 'PUT',
            data: { latitude: newLat, longitude: newLng },
            success: function(response) {
                alert(response.pesan);
                latTersimpan = newLat;
                lngTersimpan = newLng;
                $('#btn-reset-lokasi').fadeOut();
            },
            error: function() {
                alert('Gagal update lokasi ke database.');
            },
            complete: function() {
                $btn.text(originalText).prop('disabled', false);
            }
        });
    });
});