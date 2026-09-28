$(document).ready(function() {
    let dataKontenAsli = { hero: '', about: '' };
    /* Notification */
    function tampilkanNotif(pesan, tipe = 'success') {
        let $toastEl =$('#liveToast');
        
        $toastEl.removeClass('text-bg-success text-bg-danger').addClass(`text-bg-${tipe}`);
        
        $('#pesan-notif').text(pesan);
        
        let toast = new bootstrap.Toast($toastEl[0], { delay: 3000 });
        toast.show();
    }

    /* Sidebar */
    $('#sidebar-toggle').on('click', function() {
        $('.sidebar').addClass('show');
        $('#sidebar-overlay').fadeIn(300);
    });

    $('#sidebar-overlay, #admin-nav a').on('click', function() {
        if ($(window).width() <= 768) {
            $('.sidebar').removeClass('show');
            $('#sidebar-overlay').fadeOut(300);
        }
    });

    $('#admin-nav a').on('click', function(e) {
        e.preventDefault();
         
        if (typeof dataKontenAsli !== 'undefined') {
            $('#teks_hero').val(dataKontenAsli.hero);
            $('#teks_about').val(dataKontenAsli.about);
            updateLivePreview(); 
        }

        $('#admin-nav a').removeClass('active');
        $(this).addClass('active');

        let targetId = $(this).data('target');
        $('.tab-section').hide();
        $('#' + targetId).fadeIn(300);
    });

    /* Statistik & Konten */
    function updateLivePreview() {
        let heroText = $('#teks_hero').val() || '';
        let aboutText = $('#teks_about').val() || '';

        $('#preview-hero').html(heroText.replace(/\n/g, '<br>'));
        $('#preview-about').text(aboutText);
    }

    function muatStatistikDanKonten() {
        $.get('http://localhost:3000/api/statistik', function(data) {
            $('#angka-pengunjung').text(data.jumlah_pengunjung);
        });
        
        $.get('http://localhost:3000/api/konten', function(data) {
            $('#teks_hero').val(data.teks_hero);
            $('#teks_about').val(data.teks_about);
            
            dataKontenAsli.hero = data.teks_hero;
            dataKontenAsli.about = data.teks_about;
            
            updateLivePreview();
        });
    }

    muatStatistikDanKonten();

    $('#teks_hero, #teks_about').on('input', function() {
        updateLivePreview();
    });

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
                tampilkanNotif(response.pesan);

                dataKontenAsli.hero = dataKonten.teks_hero;
                dataKontenAsli.about = dataKonten.teks_about;
            }
        }).always(function() {
            $btn.prop('disabled', false).text(originalText);
        });
    });

    /* Function Menu + FAQ */
    function muatData(endpoint, tbodySelector, counterSelector, templateHTML) {
        $.get(`http://localhost:3000/api/${endpoint}`, function(response) {
            let rows = '';
            let jumlahData = 0;
            response.data.forEach(function(item) {
                jumlahData++;
                rows += templateHTML(item);
            });
            $(tbodySelector).html(rows);
            if (counterSelector) $(counterSelector).text(jumlahData);
        });
    }

    function simpanData(urlBase, idTarget, dataPayload, $btnElemen, callbackBerhasil) {
        let textAsli = $btnElemen.text();$btnElemen.prop('disabled', true).text('Menyimpan...');

        let method = idTarget ? 'PUT' : 'POST';
        let url = idTarget ? `${urlBase}/${idTarget}` : urlBase;

        $.ajax({
            url: url,
            type: method,
            data: dataPayload,
            success: function(response) {
                tampilkanNotif(response.pesan);
                callbackBerhasil();
            },
            error: function(xhr) {
                console.log('ERROR:', xhr);
                tampilkanNotif('Gagal menyimpan data. Cek Console.');
            },
            complete: function() {
                $btnElemen.prop('disabled', false).text(textAsli);
            }
        });
    }

    /* Delete */
    let targetHapus = null;

    function hapusData(urlBase, idTarget, callbackBerhasil) {
        targetHapus = {
            url: `${urlBase}/${idTarget}`,
            callback: callbackBerhasil
        };

        let modalEl = document.getElementById('modalKonfirmasiHapus');
        let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    $('#btn-modal-hapus').on('click', function() {
        if (targetHapus) {
            let $btn =$(this);
            let originalText = $btn.text();

            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Menghapus...');

            $.ajax({
                url: targetHapus.url,
                type: 'DELETE',
                success: function(response) {
                    tampilkanNotif(response.pesan);
                    targetHapus.callback();
                    
                    let modalEl = document.getElementById('modalKonfirmasiHapus');
                    let modal = bootstrap.Modal.getInstance(modalEl);
                    modal.hide();
                },
                error: function() {
                    tampilkanNotif('Gagal menghapus data.', 'danger');
                },
                complete: function() {
                    $btn.prop('disabled', false).text(originalText);
                    targetHapus = null;
                }
            });
        }
    });

    function resetForm(formId, inputId, judulId, textJudul, btnSubmitId, btnCancelId) {
        $(`#${formId}`)[0].reset();
        $(`#${inputId}`).val('');
        $(`#${judulId}`).text(textJudul);
        $(`#${btnSubmitId}`).text('Simpan ke Database').css('background-color', '#27ae60');
        $(`#${btnCancelId}`).hide();
    }

    function setFormEdit(judulId, textJudul, btnSubmitId, btnCancelId, tabSelector) {
        $(`#${judulId}`).text(textJudul);
        $(`#${btnSubmitId}`).text('Update Data').css('background-color', '#f39c12');
        $(`#${btnCancelId}`).show();
        $('html, body').animate({ scrollTop:$(tabSelector).offset().top - 20 }, 'fast');
    }

    function fiturPencarian(inputId, targetBarisTabel) {
        $(`#${inputId}`).on('keyup', function() {
            let keyword = $(this).val().toLowerCase();$(targetBarisTabel).filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(keyword) > -1);
            });
        });
    }

    /* Data Menu */
    const urlMenu = 'http://localhost:3000/api/menu';

    function muatDataMenu() {
        muatData('menu', '#tabel-menu tbody', '#angka-menu', function(item) {
            let nilaiHarga = Number(item.harga);

            if (isNaN(nilaiHarga)) {
                nilaiHarga = 0;
            }

            return `
                <tr>
                    <td>${item.id}</td>
                    <td><img src="${item.gambar}" class="preview" alt="foto"></td>
                    <td>${item.nama_kategori}</td>
                    <td>${item.nama_makanan}</td>
                    <td>Rp ${nilaiHarga.toLocaleString('id-ID')}</td>
                    <td>
                        <button class="btn btn-warning btn-sm text-dark fw-bold btn-edit-menu btn-edit" data-id="${item.id}" data-kategori="${item.nama_kategori}" data-nama="${item.nama_makanan}" data-harga="${item.harga}" data-gambar="${item.gambar}">Edit</button>
                        <button class="btn btn-danger btn-sm fw-bold btn-hapus-menu btn-hapus" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }

    function resetFormMenu() {
        resetForm('form-tambah-menu', 'edit_id', 'judul-form', 'Input Menu Baru', 'btn-menu-submit', 'btn-menu-cancel');
    }

    $('#form-tambah-menu').on('submit', function(e) {
        e.preventDefault();
        let payload = {
            nama_kategori: $('#kategori').val(),
            nama_makanan: $('#nama_makanan').val(),
            harga: $('#harga').val(),
            gambar: $('#gambar').val()
        };
        simpanData(urlMenu, $('#edit_id').val(), payload, $('#btn-menu-submit'), function() {
            resetFormMenu(); 
            muatDataMenu();
        });
    });

    $(document).on('click', '.btn-edit-menu', function() {
        $('#edit_id').val($(this).data('id'));
        $('#kategori').val($(this).data('kategori'));
        $('#nama_makanan').val($(this).data('nama'));
        $('#harga').val($(this).data('harga'));
        $('#gambar').val($(this).data('gambar'));
        setFormEdit('judul-form', 'Edit Data Menu', 'btn-menu-submit', 'btn-menu-cancel', '#tab-menu');
    });

    $('#btn-menu-cancel').on('click', resetFormMenu);

    $(document).on('click', '.btn-hapus-menu', function() {
        hapusData(urlMenu, $(this).data('id'), muatDataMenu);
    });

    fiturPencarian('search-menu', '#tabel-menu tbody tr');
    muatDataMenu();

    /* Data FAQ */
    const urlFaq = 'http://localhost:3000/api/faq';

    function muatDataFaq() {
        muatData('faq', '#tabel-faq tbody', null, function(item) {
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.pertanyaan}</td>
                    <td>${item.jawaban}</td>
                    <td>
                        <button class="btn btn-warning btn-sm text-dark fw-bold btn-edit-faq btn-edit" data-id="${item.id}" data-pertanyaan="${item.pertanyaan}" data-jawaban="${item.jawaban}">Edit</button>
                        <button class="btn btn-danger btn-sm fw-bold btn-hapus-faq btn-hapus" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }

    function resetFormFaq() {
        resetForm('form-faq', 'edit_id_faq', 'judul-form-faq', 'Input Pertanyaan Baru', 'btn-faq-submit', 'btn-faq-cancel');
    }

    $('#form-faq').on('submit', function(e) {
        e.preventDefault();
        let payload = {
            pertanyaan: $('#judul_faq').val(),
            jawaban: $('#jawaban_faq').val()
        };
        simpanData(urlFaq, $('#edit_id_faq').val(), payload, $('#btn-faq-submit'), function() {
            resetFormFaq(); 
            muatDataFaq();
        });
    });

    $(document).on('click', '.btn-edit-faq', function() {
        $('#edit_id_faq').val($(this).data('id'));
        $('#judul_faq').val($(this).data('pertanyaan'));
        $('#jawaban_faq').val($(this).data('jawaban'));
        setFormEdit('judul-form-faq', 'Edit Data FAQ', 'btn-faq-submit', 'btn-faq-cancel', '#tab-faq');
    });

    $('#btn-faq-cancel').on('click', resetFormFaq);

    $(document).on('click', '.btn-hapus-faq', function() {
        hapusData(urlFaq, $(this).data('id'), muatDataFaq);
    });

    fiturPencarian('search-faq', '#tabel-faq tbody tr');
    muatDataFaq();

    /* Button Naik Ke Atas */
    $('main').on('scroll', function() {
        if ($(this).scrollTop() > 150) {
            $('#btn-back-to-top').fadeIn(300);
        } else {
            $('#btn-back-to-top').fadeOut(300);
        }
    });

    $('#btn-back-to-top').on('click', function() {
        $('main').animate({ scrollTop: 0 }, 'fast'); 
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
                tampilkanNotif(response.pesan);
                latTersimpan = newLat;
                lngTersimpan = newLng;
                $('#btn-reset-lokasi').fadeOut();
            },
            error: function() {
                tampilkanNotif('Gagal update lokasi ke database.');
            },
            complete: function() {
                $btn.text(originalText).prop('disabled', false);
            }
        });
    });
});

$(document).ready(function () {
    let reservasiList = [
        {
            id: 1,
            gerai: "Gerai A (Jakarta)",
            nama: "Budi Santoso",
            telepon: "08123456789",
            email: "budi@gmail.com",
            tanggal: "2026-10-02",
            jam: "12:56",
            sesi: "Afternoon",
            tamu: 4,
            ruangan: "VIP Room 1 (1 Table)",
            catatan: "Dekat jendela jika ada",
            status: "pending"
        },
        {
            id: 2,
            gerai: "Gerai B (Bandung)",
            nama: "Siti Rahma",
            telepon: "08567890123",
            email: "siti@gmail.com",
            tanggal: "2026-10-02",
            jam: "18:30",
            sesi: "Evening",
            tamu: 2,
            ruangan: "Reguler Indoor",
            catatan: "-",
            status: "approved"
        }
    ];

    let currentTab = 'pending';

    function updateCounts() {
        $('#count-pending').text(reservasiList.filter(item => item.status === 'pending').length);
        $('#count-approved').text(reservasiList.filter(item => item.status === 'approved').length);
        $('#count-complete').text(reservasiList.filter(item => item.status === 'complete').length);
    }

    function renderTabel(statusFilter) {
        let filtered = reservasiList.filter(item => item.status === statusFilter);
        let $tbody =$('#reservation-table-body');
        $tbody.empty();

        if (filtered.length === 0) {
            $tbody.html('<tr><td colspan="8" style="text-align: center; color: #888; padding: 20px;">Tidak ada reservasi pada status ini.</td></tr>');
            return;
        }

        filtered.forEach(function (res) {
            let actionBtn = '';
        
            if (res.status === 'pending') {
                actionBtn = `<button class="btn-action btn-approve" data-id="${res.id}">✓ Konfirmasi</button>`;
            } else if (res.status === 'approved') {
                actionBtn = `<button class="btn-action btn-complete" data-id="${res.id}">✓ Konfirmasi</button>`;
            } else if (res.status === 'complete') {
                actionBtn = `<span class="status-badge-done">Selesai</span>`;
            }

            let rowHtml = `
                <tr>
                    <td><strong>${res.gerai}</strong></td>
                    <td>${res.nama}</td>
                    <td>${res.telepon}<br><small style="color: #777;">${res.email}</small></td>
                    <td>${res.tanggal}<br><small>${res.jam} (${res.sesi})</small></td>
                    <td>${res.tamu} Orang</td>
                    <td>${res.ruangan}</td>
                    <td>${res.catatan}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
            $tbody.append(rowHtml);
        });
    }

    updateCounts();
    renderTabel(currentTab);

    $('.tab-btn').on('click', function () {
        $('.tab-btn').removeClass('active');$(this).addClass('active');

        currentTab = $(this).data('status');
        renderTabel(currentTab);
    });

    $('#reservation-table-body').on('click', '.btn-approve', function () {
        let id = $(this).data('id');
        let item = reservasiList.find(r => r.id === id);
        if (item) {
            item.status = 'approved';
            updateCounts();
            renderTabel(currentTab);
        }
    });

    $('#reservation-table-body').on('click', '.btn-complete', function () {
        let id = $(this).data('id');
        let item = reservasiList.find(r => r.id === id);
        if (item) {
            item.status = 'complete';
            updateCounts();
            renderTabel(currentTab);
        }
    });
});