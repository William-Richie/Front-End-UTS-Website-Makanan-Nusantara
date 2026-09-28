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

        $answer.slideToggle(300);
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
                                <button class="add-to-cart-btn" data-nama="${makanan.nama_makanan}" data-harga="${makanan.harga}">+ Keranjang</button>
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
    let cartTotal = 0;
    let cartItems = [];

    function updateCartBadge() {
        if (cartItemCount > 0) {
            $('#cart-count').text(cartItemCount).css('display', 'flex'); 
            $('#empty-cart-msg').hide();
        } else {
            $('#cart-count').css('display', 'none'); 
            $('#empty-cart-msg').show();
        }

        $('#cart-total-price').text('Rp ' + cartTotal.toLocaleString('id-ID'));
    }

    updateCartBadge(); 

    $('#tempat-menu-dinamis').on('click', '.add-to-cart-btn', function(e) {
        e.preventDefault(); 

        let itemName = $(this).data('nama');
        let itemPrice = parseInt($(this).data('harga'));
        
        cartItemCount++; 
        cartTotal += itemPrice;
        cartItems.push(itemName);

        let cartItemHtml = `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                ${itemName}
                <span>Rp ${itemPrice.toLocaleString('id-ID')}</span>
            </li>
        `;
        
        $('#cart-items-list').append(cartItemHtml);

        updateCartBadge(); 
        
        let $btn =$(this);
        let originalText = $btn.text(); 
        
        $btn.text('Berhasil!');$btn.css({'background-color': '#27ae60', 'color': 'white'}); 
        
        setTimeout(function() {
            $btn.text(originalText);$btn.css({'background-color': '', 'color': ''}); 
        }, 1000);
    });

    let currentOngkir = 0;

    $('#btn-checkout-cart').on('click', function() {
        if (cartItemCount === 0) {
            alert("Keranjang Anda masih kosong. Silakan pesan menu terlebih dahulu!");
            return;
        }

        var cartSidebarEl = document.getElementById('cartSidebar');
        var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartSidebarEl);
        if(cartOffcanvas) cartOffcanvas.hide();

        $('#modalSubtotal').text('Rp ' + cartTotal.toLocaleString('id-ID'));
        $('#modalTotalBayar').text('Rp ' + cartTotal.toLocaleString('id-ID'));
        
        $('input[name="orderType"]').prop('checked', false);
        $('#dineInForm, #onlineForm').hide();
        $('#modalOngkir').text('Rp 0');
        $('#deliveryAddress, #checkoutStore').val('');
        $('#btn-confirm-pay').prop('disabled', true);
        currentOngkir = 0;

        var checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        checkoutModal.show();
    });

    $('input[name="orderType"]').on('change', function() {
        $('#btn-confirm-pay').prop('disabled', false);

        if (this.value === 'dine-in') {
            $('#dineInForm').slideDown(300);
            $('#onlineForm').slideUp(300);
            
            currentOngkir = 0;
            updateModalTotal();

        } else if (this.value === 'online') {
            $('#dineInForm').slideUp(300);
            $('#onlineForm').slideDown(300);
            
            currentOngkir = Math.floor(Math.random() * 26 + 10) * 1000;
            $('#modalOngkir').text('+ Rp ' + currentOngkir.toLocaleString('id-ID'));
            
            updateModalTotal();
        }
    });

    function updateModalTotal() {
        let finalTotal = cartTotal + currentOngkir;
        $('#modalTotalBayar').text('Rp ' + finalTotal.toLocaleString('id-ID'));
    }

    $('#btn-confirm-pay').on('click', function() {
        let orderType = $('input[name="orderType"]:checked').val();
        let detailPesananStr = "";
        let finalTotal = cartTotal + currentOngkir;
        
        if (orderType === 'dine-in') {
            let store = $('#checkoutStore').val();
            if (!store) {
                alert('Silakan pilih lokasi gerai restoran terlebih dahulu!');
                return;
            }
            detailPesananStr = `[Dine-in di ${store}] `;
        } else if (orderType === 'online') {
            let address = $('#deliveryAddress').val();
            if (!address || !address.trim()) {
                alert('Silakan masukkan alamat pengiriman Anda secara lengkap!');
                return;
            }
            detailPesananStr = `[Online - Alamat: ${address}] `;
        } else {
             alert('Silakan pilih metode pesanan!');
             return;
        }

        // let namaPelanggan = prompt("Silakan masukkan nama Anda untuk pesanan ini:");
        // if (!namaPelanggan || !namaPelanggan.trim()) {
        //     alert("Nama harus diisi untuk memproses pesanan!");
        //     return;
        // }

        detailPesananStr += cartItems.join(', ');

        let $btn =$(this);
        let originalText = $btn.text();
        
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Memproses...');

        $.ajax({
            url: '/api/pesanan',
            type: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify({
                // nama: namaPelanggan,
                item: detailPesananStr,
                total: finalTotal
            }),
            success: function(response) {
                alert("Berhasil!\nPesanan Anda telah dibuat dan sedang menunggu konfirmasi admin.");
                
                cartItemCount = 0;
                cartTotal = 0;
                cartItems = []; 
                currentOngkir = 0;
                
                $('#cart-items-list').find('li:not(#empty-cart-msg)').remove();
                updateCartBadge();
                
                var modalEl = document.getElementById('checkoutModal');
                var modalInst = bootstrap.Modal.getInstance(modalEl);
                if(modalInst) {
                    modalInst.hide();
                }
            },
            error: function(xhr, status, error) {
                console.error("Error Checkout:", xhr.responseText || error);
                alert("Terjadi kesalahan saat memproses pesanan. Pastikan server berjalan dan database terhubung.");
            },
            complete: function() {
                $btn.prop('disabled', false).text('Konfirmasi Pesanan');
            }
        });
    });

    /* Banner hero */
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

// Scroll reveal
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('show');
            io.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });

function initReveal() {
    document.querySelectorAll('.reveal:not(.show)').forEach(el => io.observe(el));
}

// Menu & FAQ dibuat dinamis oleh script.js: beri class reveal otomatis
['tempat-menu-dinamis', 'tempat-faq-dinamis'].forEach(id => {
    const box = document.getElementById(id);
    if (!box) return;
    new MutationObserver(() => {
        box.querySelectorAll('.category-header, .menu-item, .faq-question').forEach(el => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                io.observe(el);
            }
        });
    }).observe(box, { childList: true, subtree: true });
});

// Tombol intro
document.getElementById('btn-start').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    intro.classList.add('hide');
    document.body.classList.remove('intro-active');
    setTimeout(initReveal, 400);
    setTimeout(() => intro.remove(), 1000);
});

// Badge keranjang membal saat jumlah berubah
const badge = document.getElementById('cart-count');
if (badge) {
    new MutationObserver(() => {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
    }).observe(badge, { childList: true, characterData: true, subtree: true });
}

document.body.classList.add('intro-active');

document.getElementById('btn-start').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    intro.classList.add('hide');
    document.body.classList.remove('intro-active');
    setTimeout(() => intro.remove(), 1000);
});
