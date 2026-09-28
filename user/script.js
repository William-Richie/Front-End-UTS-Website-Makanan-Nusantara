$(document).ready(function() {
    /* Navigation */
    $('#hamburger-menu').on('click', function() {
        $('#main-nav').slideToggle(300);
    });

    $('.nav-link').on('click', function() {
        if ($(window).width() < 768) {$('#main-nav').slideUp(300);
        }
    });

    $(window).resize(function() {
        if ($(window).width() >= 768) {$('#main-nav').css('display', ''); 
        }
    });

    /* Scrolling */
    $('a.nav-link').on('click', function(event) {
        if (this.hash !== "") {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: $(this.hash).offset().top - 60 
            }, 500);
        }
    });

    /* FAQ */
    function muatFaqDariDatabase() {
        $.get('/api/faq', function(response) {
            let dataFaq = Array.isArray(response) ? response : (response.data || []);
            let htmlFaq = '';

            if (dataFaq.length === 0) {
                htmlFaq = '<p class="text-center">Belum ada FAQ yang tersedia.</p>';
            } else {
                dataFaq.forEach(function(item) {
                    htmlFaq += `
                        <div class="faq-item">
                            <div class="faq-question fw-bold">${item.pertanyaan}</div>
                            <div class="faq-answer">${item.jawaban}</div>
                        </div>
                    `;
                });
            }

            $('#tempat-faq-dinamis').html(htmlFaq);
            
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data FAQ:", errorThrown);
            $('#tempat-faq-dinamis').html('<p style="text-align: center; color: red;">Gagal memuat FAQ.</p>');
        });
    }

    muatFaqDariDatabase();

    $('#tempat-faq-dinamis').on('click', '.faq-question', function() {
        var $answer =$(this).next('.faq-answer');
    
        $('.faq-answer').not($answer).slideUp(300);
    });

    /* Tombol ke atas */
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 200) {
            $('#back-to-top').fadeIn(200).css('display', 'flex');
        } else {
            $('#back-to-top').fadeOut(200);
        }
    });

    $('#back-to-top').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 500);
    });

    /* Menu */
    function muatMenuDariDatabase() {
        $.get('/api/menu', function(response) {
            let dataMenu = response.data;
            let menuDikelompokkan = {};

            dataMenu.forEach(function(item) {
                if (!menuDikelompokkan[item.nama_kategori]) {
                    menuDikelompokkan[item.nama_kategori] = [];
                }
                menuDikelompokkan[item.nama_kategori].push(item);
            });

            let htmlMenu = '';
            
            for (let kategori in menuDikelompokkan) {
                htmlMenu += `
                <div class="menu-group">
                    <div class="category-header">${kategori}</div>
                    <div class="menu-grid">
                `;

                menuDikelompokkan[kategori].forEach(function(makanan) {
                    htmlMenu += `
                        <div class="menu-item">
                            <div class="dish-name">${makanan.nama_makanan}</div>
                            <img src="${makanan.gambar}" alt="${makanan.nama_makanan}" class="menu-img">
                            <div class="menu-details">
                                <div class="menu-price">Rp ${makanan.harga.toLocaleString('id-ID')}</div>
                                <button class="add-to-cart-btn">+ Keranjang</button>
                            </div>
                        </div>
                    `;
                });

                htmlMenu += `</div></div>`;
            }

            $('#tempat-menu-dinamis').html(htmlMenu);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data:", errorThrown);
            $('#tempat-menu-dinamis').html('<p style="text-align: center; color: red;">Gagal terhubung ke database. Cek console (F12) untuk detail error.</p>');
        });
    }

    muatMenuDariDatabase();

    /* Cart */
    let cartItemCount = 0; 

    function updateCartBadge() {
        if (cartItemCount > 0) {
            $('#cart-count').text(cartItemCount).css('display', 'flex'); 
        } else {
            $('#cart-count').css('display', 'none'); 
        }
    }

    updateCartBadge(); 

    $('#tempat-menu-dinamis').on('click', '.add-to-cart-btn', function(e) {
        e.preventDefault(); 
        
        cartItemCount++; 
        updateCartBadge(); 
        
        let $btn =$(this);
        let originalText = $btn.text(); 
        
        $btn.text('Berhasil!');$btn.css({'background-color': '#27ae60', 'color': 'white'}); 
        
        setTimeout(function() {
            $btn.text(originalText);$btn.css({'background-color': '', 'color': ''}); 
        }, 1000);
    });

    $.post('/api/pengunjung');

    $.get('/api/konten', function(data) {
        let teksHeroHTML = data.teks_hero.replace(/\n/g, '<br>');
        
        $('#judul-hero').html(teksHeroHTML);
        $('#deskripsi-about').text(data.teks_about);
    });

    /* Maps */
    $.get('http://localhost:3000/api/maps', function(data) {
        let latResto = (data && data.latitude) ? parseFloat(data.latitude) : -6.200000;
        let lngResto = (data && data.longitude) ? parseFloat(data.longitude) : 106.816666;

        let mapUser = L.map('map-user').setView([latResto, lngResto], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapUser);

        L.marker([latResto, lngResto]).addTo(mapUser)
            .bindPopup('<b>Papeda Restaurant</b><br>Jl. Cendrawasih No. 45, Jakarta.')
            .openPopup();
            
    }).fail(function() {
        console.error("Gagal memuat data peta dari database.");
    });

    // reservation
    let $reservationForm = $('#reservation-form-group');

    $reservationForm.hide();

    $('#store-select').on('change', function () {
        let selectedStore = $(this).val();
        console.log("Gerai dipilih:", selectedStore);

        if (selectedStore && selectedStore !== "") {
            $reservationForm.slideDown(300);
        } else {
            $reservationForm.slideUp(300);
        }
    });
});
