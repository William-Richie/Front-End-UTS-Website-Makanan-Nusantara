## Untuk menjalankan website ini, diperlukan beberapa langkah terlebih dahulu.

1. Install node modules dan jsonwebtoken
    - Buka Terminal di VS Code, dan pastikan path nya sudah sesuai
    - Ketikkan di terminal
        ###### npm install cors
    - Setelah itu, ketik di terminal
        ###### npm i bcryptjs jsonwebtoken 

2. Membuat file .env
    - Buat file .env diluar dari semua file website 
    [!NOTE]
    (Ditaruh di level/tempat yang sama dengan server.js)
    - Masukkan teks yang sudah diberikan di teams ke dalam .env

    [!WARNING]
    Langkah ini wajib dilakukan karena website membutuhkan akses untuk terhubung dengan Supabase dan adanya secret key

3. Jalankan Website
    - Untuk menjalankan website, cukup ketikkan di terminal
        ###### node server.js 
    - Terminal akan menunjukkan server lokal yang berjalan
    - Untuk User, tambahkan /user pada link >>> http://localhost:3000/user/index.html
    - Untuk admin, tambahkan /admin pada link >>> http://localhost:3000/admin/index.html

## Akun dan Password Admin
Berikut adalah username beserta password dari akun admin

- Username = admin
- password = papeda123

[!NOTE]
Akun harus sama karena supabase terhubung dengan id akun admin ini!!

Untuk user, apabila tidak ada akun bisa langsung gunakan fitur regist di website user