
# Code of conduct

### Branch and commit convention
- Semua conflict harap di solve pada level developlment, jangan solve conflict pada tahap remot.
- Ikuti penamaan dan aturan Branch serta Commit message pada 2 artikel berikut :

- [Branch name  and Commit message](https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4)
  
- [Branch rules](https://medium.com/android-news/gitflow-with-github-c675aa4f606a) 
  
---

# Api design.

## Desain API: Simple Shortener App

Versi API: v1

Base URL API Gateway: https://api.yourdomain.com/api/v1 (Contoh)

Base URL untuk Short Link: https://yourdomain.com/ (Contoh)

**Struktur Respons Standar:**

Setiap respons API akan mengikuti struktur berikut untuk konsistensi:

JSON

```
{
  "status": "success" | "error", // Status umum dari permintaan
  "message": "Deskripsi singkat mengenai hasil operasi.", // Pesan yang dapat dibaca manusia
  "data": {}, // Objek yang berisi data hasil jika sukses, bisa null
  "errors": [] // Array objek error jika status adalah "error", berisi detail error
}
```

Contoh Objek Error:

JSON

```
{
  "field": "nama_field_yang_bermasalah", // Opsional, jika error terkait field tertentu
  "code": "KODE_ERROR_SPESIFIK", // Opsional, kode error internal
  "message": "Deskripsi detail mengenai error."
}
```

---

### 1. API Gateway

API Gateway akan bertindak sebagai reverse proxy, menangani autentikasi awal (jika diperlukan di level gateway untuk beberapa rute), routing permintaan ke layanan backend yang sesuai, dan agregasi respons jika diperlukan.

---

#### **1.1. Autentikasi Pengguna (Diteruskan ke User Account and Data Service)**

##### **Endpoint:** `POST /auth/register`

Deskripsi: Mendaftarkan pengguna baru dalam sistem.

Service Tujuan: User Account and Data Service (/service/users/register)

**Request Body:** `application/json`

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`username`|string|Ya|Username unik yang diinginkan oleh pengguna.|"john_doe"|
|`password`|string|Ya|Password pengguna (minimal 8 karakter direkomendasikan).|"P@sswOrd123"|

**Responses:**

- **201 Created**
    - Deskripsi: Pengguna berhasil didaftarkan.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "User registered successfully.",
          "data": {
            "userId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "username": "john_doe"
          },
          "errors": null
        }
        ```
        
- **400 Bad Request**
    - Deskripsi: Input tidak valid (misalnya, username kosong, password terlalu pendek, format username tidak sesuai).
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Validation failed.",
          "data": null,
          "errors": [
            {
              "field": "username",
              "message": "Username cannot be empty."
            },
            {
              "field": "password",
              "message": "Password must be at least 8 characters long."
            }
          ]
        }
        ```
        
- **409 Conflict**
    - Deskripsi: Username sudah digunakan.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Username already exists.",
          "data": null,
          "errors": [
            {
              "field": "username",
              "message": "This username is already taken. Please choose another one."
            }
          ]
        }
        ```
        
- **500 Internal Server Error**
    - Deskripsi: Terjadi kesalahan internal pada server saat mencoba mendaftarkan pengguna.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred. Please try again later.",
          "data": null,
          "errors": [
            {
              "code": "REGISTRATION_FAILED",
              "message": "Failed to process user registration."
            }
          ]
        }
        ```
        

##### **Endpoint:** `POST /auth/login`

Deskripsi: Memungkinkan pengguna untuk login dan mendapatkan token autentikasi.

Service Tujuan: User Account and Data Service (/service/users/login)

**Request Body:** `application/json`

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`username`|string|Ya|Username pengguna.|"john_doe"|
|`password`|string|Ya|Password pengguna.|"P@sswOrd123"|

**Responses:**

- **200 OK**
    - Deskripsi: Login berhasil, token autentikasi disertakan dalam respons.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "Login successful.",
          "data": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtMTIzNC01Njc4OTBhYmNkZWYiLCJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiaWF0IjoxNzE1Mjc2ODAwLCJleHAiOjE3MTUyODA0MDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            "user": {
              "userId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
              "username": "john_doe"
            }
          },
          "errors": null
        }
        ```
        
- **400 Bad Request**
    - Deskripsi: Input tidak valid (misalnya, username atau password kosong).
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Validation failed.",
          "data": null,
          "errors": [
            {
              "field": "username",
              "message": "Username is required."
            }
          ]
        }
        ```
        
- **401 Unauthorized**
    - Deskripsi: Kredensial tidak valid (username atau password salah).
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Invalid username or password.",
          "data": null,
          "errors": [
            {
              "code": "INVALID_CREDENTIALS",
              "message": "The username or password provided is incorrect."
            }
          ]
        }
        ```
        
- **500 Internal Server Error**
    - Deskripsi: Terjadi kesalahan internal pada server saat mencoba login.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred during login.",
          "data": null,
          "errors": [
            {
              "code": "LOGIN_PROCESS_FAILED",
              "message": "Failed to process login request."
            }
          ]
        }
        ```
        

---

#### **1.2. Manajemen Short URL (Diteruskan ke User Account and Data Service)**

Rute-rute berikut memerlukan autentikasi. API Gateway akan memvalidasi Bearer Token sebelum meneruskan permintaan.

**Header Wajib untuk Rute Terautentikasi:**

|   |   |   |
|---|---|---|
|**Header**|**Deskripsi**|**Contoh**|
|`Authorization`|Token Bearer JWT untuk autentikasi pengguna.|`Bearer <TOKEN_PENGGUNA_ANDA_DISINI>`|

##### **Endpoint:** `POST /urls`

Deskripsi: Membuat short URL baru untuk pengguna yang terautentikasi.

Service Tujuan: User Account and Data Service (/service/users/{userId}/urls) - {userId} akan diekstrak dari token JWT oleh API Gateway atau User Service.

**Request Body:** `application/json`

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`longUrl`|string|Ya|URL panjang asli yang ingin dipendekkan. Harus berupa URL yang valid.|"[https://www.example.com/a/very/long/path/that/needs/shortening](https://www.google.com/url?sa=E&source=gmail&q=https://www.example.com/a/very/long/path/that/needs/shortening)"|
|`customShort`|string|Tidak|Kode pendek kustom yang diinginkan pengguna. Jika kosong, sistem akan menghasilkan kode acak. Karakter alfanumerik, tanda hubung, garis bawah.|"my-cool-link"|
|`expiresInDays`|integer|Ya|Durasi masa aktif short URL dalam hari. Maksimal 30 hari.|7|

**Responses:**

- **201 Created**
    - Deskripsi: Short URL berhasil dibuat.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "Short URL created successfully.",
          "data": {
            "shortUrlId": "s1s2s3s4-e5f6-7890-1234-abcdef123456",
            "longUrl": "https://www.example.com/a/very/long/path/that/needs/shortening",
            "shortCode": "my-cool-link", // atau kode yang digenerate
            "fullShortUrl": "https://yourdomain.com/my-cool-link",
            "createdAt": "2025-05-09T17:30:00Z",
            "expiresAt": "2025-05-16T17:30:00Z",
            "visits": 0
          },
          "errors": null
        }
        ```
        
- **400 Bad Request**
    - Deskripsi: Input tidak valid (misalnya, `longUrl` bukan URL, `expiresInDays` di luar rentang, `customShort` mengandung karakter tidak valid atau terlalu panjang/pendek).
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Validation failed.",
          "data": null,
          "errors": [
            {
              "field": "longUrl",
              "message": "Must be a valid URL."
            },
            {
              "field": "expiresInDays",
              "message": "Expiration must be between 1 and 30 days."
            },
            {
              "field": "customShort",
              "message": "Custom short code contains invalid characters or is too long."
            }
          ]
        }
        ```
        
- **401 Unauthorized**
    - Deskripsi: Token autentikasi tidak ada, tidak valid, atau kedaluwarsa.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Unauthorized. Please login again.",
          "data": null,
          "errors": [
            {
              "code": "TOKEN_INVALID",
              "message": "Authentication token is missing, invalid, or expired."
            }
          ]
        }
        ```
        
- **409 Conflict**
    - Deskripsi: `customShort` yang diminta sudah digunakan.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Custom short URL is already taken.",
          "data": null,
          "errors": [
            {
              "field": "customShort",
              "message": "The custom short code 'my-cool-link' is already in use. Please choose another one or leave it blank for an auto-generated code."
            }
          ]
        }
        ```
        
- **500 Internal Server Error**
    - Deskripsi: Terjadi kesalahan internal pada server saat mencoba membuat short URL.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred while creating the short URL.",
          "data": null,
          "errors": [
            {
              "code": "SHORT_URL_CREATION_FAILED",
              "message": "Failed to create the short URL."
            }
          ]
        }
        ```
        

##### **Endpoint:** `GET /urls`

Deskripsi: Mengambil daftar semua short URL milik pengguna yang terautentikasi.

Service Tujuan: User Account and Data Service (/service/users/{userId}/urls)

**Query Parameters:**

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Default**|**Deskripsi**|**Contoh**|
|`page`|integer|Tidak|1|Nomor halaman untuk paginasi.|2|
|`limit`|integer|Tidak|10|Jumlah item per halaman.|20|
|`sortBy`|string|Tidak|`createdAt`|Kriteria pengurutan (misalnya, `createdAt`, `visits`, `expiresAt`).|`visits`|
|`sortOrder`|string|Tidak|`desc`|Urutan pengurutan (`asc` untuk menaik, `desc` untuk menurun).|`asc`|
|`status`|string|Tidak|`all`|Filter berdasarkan status URL (`active`, `expired`, `all`).|`active`|

**Responses:**

- **200 OK**
    - Deskripsi: Berhasil mengambil daftar short URL pengguna.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "User's short URLs retrieved successfully.",
          "data": [
            {
              "shortUrlId": "s1s2s3s4-e5f6-7890-1234-abcdef123456",
              "longUrl": "https://www.example.com/a/very/long/path/that/needs/shortening",
              "shortCode": "my-cool-link",
              "fullShortUrl": "https://yourdomain.com/my-cool-link",
              "createdAt": "2025-05-09T17:30:00Z",
              "expiresAt": "2025-05-16T17:30:00Z",
              "visits": 150,
              "isActive": true // Ditentukan dengan membandingkan expiresAt dengan waktu sekarang
            },
            {
              "shortUrlId": "x7y8z9a0-b1c2-3456-7890-fedcba098765",
              "longUrl": "https://www.anotherexample.org/some/other/resource",
              "shortCode": "another-one",
              "fullShortUrl": "https://yourdomain.com/another-one",
              "createdAt": "2025-04-01T10:00:00Z",
              "expiresAt": "2025-05-01T10:00:00Z", // Sudah kedaluwarsa
              "visits": 25,
              "isActive": false
            }
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalItems": 25,
            "itemsPerPage": 10
          },
          "errors": null
        }
        ```
        
- **401 Unauthorized** (Sama seperti `POST /urls`)
- **500 Internal Server Error**
    - Deskripsi: Terjadi kesalahan internal pada server saat mengambil daftar URL.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred while retrieving short URLs.",
          "data": null,
          "errors": [
            {
              "code": "FETCH_URLS_FAILED",
              "message": "Failed to retrieve user's short URLs."
            }
          ]
        }
        ```
        

##### **Endpoint:** `GET /urls/{shortCode}`

Deskripsi: Mengambil detail spesifik dari sebuah short URL milik pengguna yang terautentikasi.

Service Tujuan: User Account and Data Service (/service/users/{userId}/urls/{shortCode})

**Path Parameters:**

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`shortCode`|string|Ya|Kode pendek unik dari short URL yang dicari.|"my-cool-link"|

**Responses:**

- **200 OK**
    - Deskripsi: Berhasil mengambil detail short URL.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "Short URL details retrieved successfully.",
          "data": {
            "shortUrlId": "s1s2s3s4-e5f6-7890-1234-abcdef123456",
            "longUrl": "https://www.example.com/a/very/long/path/that/needs/shortening",
            "shortCode": "my-cool-link",
            "fullShortUrl": "https://yourdomain.com/my-cool-link",
            "createdAt": "2025-05-09T17:30:00Z",
            "expiresAt": "2025-05-16T17:30:00Z",
            "visits": 150,
            "isActive": true
          },
          "errors": null
        }
        ```
        
- **401 Unauthorized** (Sama seperti `POST /urls`)
- **403 Forbidden**
    - Deskripsi: Pengguna terautentikasi tetapi tidak memiliki izin untuk mengakses short URL ini (bukan miliknya).
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Access denied. You do not own this short URL.",
          "data": null,
          "errors": [
            {
              "code": "FORBIDDEN_ACCESS",
              "message": "User does not have permission to access this resource."
            }
          ]
        }
        ```
        
- **404 Not Found**
    - Deskripsi: Short URL dengan `shortCode` yang diberikan tidak ditemukan milik pengguna ini.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Short URL not found.",
          "data": null,
          "errors": [
            {
              "code": "URL_NOT_FOUND",
              "message": "The requested short URL does not exist or does not belong to you."
            }
          ]
        }
        ```
        
- **500 Internal Server Error** (Sama seperti `GET /urls`)

##### **Endpoint:** `DELETE /urls/{shortCode}`

Deskripsi: Menghapus short URL milik pengguna yang terautentikasi.

Service Tujuan: User Account and Data Service (/service/users/{userId}/urls/{shortCode})

**Path Parameters:**

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`shortCode`|string|Ya|Kode pendek unik dari short URL yang akan dihapus.|"my-cool-link"|

**Responses:**

- **200 OK** (Beberapa API menggunakan 204 No Content untuk DELETE sukses tanpa body)
    - Deskripsi: Short URL berhasil dihapus.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "success",
          "message": "Short URL deleted successfully.",
          "data": null, // Atau objek yang berisi ID URL yang dihapus
          "errors": null
        }
        ```
        
- **401 Unauthorized** (Sama seperti `POST /urls`)
- **403 Forbidden** (Sama seperti `GET /urls/{shortCode}`)
- **404 Not Found** (Sama seperti `GET /urls/{shortCode}`)
- **500 Internal Server Error**
    - Deskripsi: Terjadi kesalahan internal pada server saat mencoba menghapus short URL.
    - Body: `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred while deleting the short URL.",
          "data": null,
          "errors": [
            {
              "code": "URL_DELETION_FAILED",
              "message": "Failed to delete the short URL."
            }
          ]
        }
        ```
        

---

#### **1.3. Redirect URL (Diteruskan ke URL Shortener Service)**

Endpoint ini tidak memerlukan autentikasi dan biasanya ditempatkan di root path domain shortener atau path khusus. API Gateway akan meneruskan ini ke _URL Shortener Service_.

##### **Endpoint:** `GET /{shortCode}` (Biasanya di root domain, misal `https://yourdomain.com/{shortCode}`)

Deskripsi: Mengalihkan shortCode ke longUrl yang sesuai dan mencatat kunjungan.

Service Tujuan: URL Shortener Service (/service/redirect/{shortCode})

**Path Parameters:**

|   |   |   |   |   |
|---|---|---|---|---|
|**Parameter**|**Tipe**|**Wajib**|**Deskripsi**|**Contoh**|
|`shortCode`|string|Ya|Kode pendek unik dari short URL yang dikunjungi.|"my-cool-link"|

**Responses (dari API Gateway setelah menerima dari URL Shortener Service):**

- **302 Found** (atau 301 Moved Permanently, tergantung strategi SEO)
    
    - Deskripsi: Pengalihan berhasil.
    - **Headers:**
        - `Location`: `https://www.example.com/a/very/long/path/that/needs/shortening` (URL panjang tujuan)
    - _Tidak ada body respons JSON untuk redirect HTTP._
- **404 Not Found**
    
    - Deskripsi: `shortCode` tidak ditemukan atau sudah kedaluwarsa. API Gateway bisa menampilkan halaman 404 kustom atau respons JSON.
    - Body (Jika respons JSON, bukan halaman HTML): `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "Short URL not found or has expired.",
          "data": null,
          "errors": [
            {
              "code": "SHORT_URL_UNAVAILABLE",
              "message": "The requested short URL does not exist or is no longer active."
            }
          ]
        }
        ```
        
- **500 Internal Server Error**
    
    - Deskripsi: Terjadi kesalahan internal pada server saat mencoba melakukan pengalihan.
    - Body (Jika respons JSON): `application/json`
        
        JSON
        
        ```
        {
          "status": "error",
          "message": "An internal server error occurred during redirection.",
          "data": null,
          "errors": [
            {
              "code": "REDIRECT_FAILED",
              "message": "Failed to process the URL redirection."
            }
          ]
        }
        ```
        

---

---

### 2. User Account and Data Service

Layanan ini menangani logika bisnis untuk akun pengguna dan data short URL mereka. Berinteraksi dengan **Postgres** (untuk data akun dan metadata/analitik short URL) dan **Redis** (untuk pengecekan ketersediaan `customShort` saat pembuatan, dan bisa juga untuk cache data pengguna jika diperlukan). Layanan ini hanya diakses melalui API Gateway.

**Prefix internal service:** `/service/users`

---

#### **2.1. Endpoint Akun Pengguna**

##### **Endpoint Internal:** `POST /service/users/register`

Deskripsi: Dipanggil oleh API Gateway untuk mendaftarkan pengguna baru.

Request Body: (Sama seperti POST /auth/register di API Gateway)

Logic:

1. Validasi input (username unik, format password).
2. Hash password.
3. Simpan `userId` (UUID), `username`, `hashedPassword` ke tabel `users` di **Postgres**.
4. Kembalikan data pengguna yang baru dibuat (`userId`, `username`).

**Responses (ke API Gateway):**

- **201 Created**
    - Body: `{ "userId": "...", "username": "..." }`
- **400 Bad Request** (Error validasi)
    - Body: `{ "errors": [{ "field": "...", "message": "..." }] }`
- **409 Conflict** (Username sudah ada)
    - Body: `{ "errors": [{ "field": "username", "message": "Username already exists." }] }`
- **500 Internal Server Error**

##### **Endpoint Internal:** `POST /service/users/login`

Deskripsi: Dipanggil oleh API Gateway untuk memvalidasi kredensial dan membuat token.

Request Body: (Sama seperti POST /auth/login di API Gateway)

Logic:

1. Cari pengguna berdasarkan `username` di tabel `users` **Postgres**.
2. Jika ditemukan, bandingkan `password` yang diberikan dengan `hashedPassword` yang tersimpan.
3. Jika cocok, buat JWT yang berisi `userId`, `username`, dan `expiration`.
4. Kembalikan data pengguna dan token.

**Responses (ke API Gateway):**

- **200 OK**
    - Body: `{ "token": "...", "user": { "userId": "...", "username": "..." } }`
- **400 Bad Request** (Error validasi)
- **401 Unauthorized** (Kredensial salah)
    - Body: `{ "errors": [{ "code": "INVALID_CREDENTIALS", "message": "..." }] }`
- **500 Internal Server Error**

---

#### **2.2. Endpoint Manajemen Short URL Pengguna**

Endpoint-endpoint ini akan menerima `userId` (yang sudah diekstrak dan diverifikasi oleh API Gateway dari token JWT) sebagai bagian dari path atau sebagai parameter internal.

##### **Endpoint Internal:** `POST /service/users/{userId}/urls`

Deskripsi: Dipanggil oleh API Gateway untuk membuat short URL baru.

Path Parameters:

* userId: string (ID pengguna dari token)

Request Body: (Sama seperti POST /urls di API Gateway: longUrl, customShort, expiresInDays)

Logic:

1. Validasi input (`longUrl`, `expiresInDays`, format `customShort`).
2. Jika `customShort` diberikan:
    - Periksa ketersediaan `customShort` di **Redis** (misalnya, dengan `EXISTS shortcode:<customShort>`).
    - Jika sudah ada di Redis atau sebagai `shortCode` di tabel `short_urls` **Postgres** (perlu konsistensi atau sumber kebenaran yang jelas), kembalikan 409.
3. Jika tidak ada `customShort` atau `customShort` tersedia:
    - Generate `shortCode` unik jika `customShort` tidak diberikan. Pastikan keunikannya dengan mengecek **Redis** dan **Postgres**.
    - Hitung `expiresAt` (UTC) berdasarkan `expiresInDays`.
    - Buat `shortUrlId` (UUID).
    - Simpan data ke tabel `short_urls` di **Postgres**: `shortUrlId`, `userId`, `longUrl`, `shortCode` (yang final), `createdAt` (UTC now), `expiresAt`, `visits` (awal 0).
    - Simpan `shortCode:longUrl` ke **Redis** dengan `EX` (expiration in seconds) yang sesuai dengan `expiresInDays`.
        - Contoh Key di Redis: `shorturl:actualShortCode`
        - Contoh Value di Redis: `longUrl`
        - Contoh TTL: `EX (expiresInDays * 24 * 60 * 60)`
4. Kembalikan detail short URL yang baru dibuat.

**Responses (ke API Gateway):**

- **201 Created**
    - Body: `{ "shortUrlId": "...", "longUrl": "...", "shortCode": "...", "createdAt": "...", "expiresAt": "...", "visits": 0 }`
- **400 Bad Request** (Error validasi)
- **409 Conflict** (`customShort` sudah digunakan)
- **500 Internal Server Error** (Kegagalan DB, dll.)

##### **Endpoint Internal:** `GET /service/users/{userId}/urls`

Deskripsi: Dipanggil oleh API Gateway untuk mengambil daftar short URL pengguna.

Path Parameters:

* userId: string

Query Parameters: (Sama seperti GET /urls di API Gateway: page, limit, sortBy, sortOrder, status)

Logic:

1. Ambil data dari tabel `short_urls` **Postgres** milik `userId` sesuai filter, paginasi, dan pengurutan.
2. Untuk setiap URL, tentukan `isActive` dengan membandingkan `expiresAt` (dari Postgres) dengan waktu server saat ini.
3. Kembalikan daftar URL dan metadata paginasi.

**Responses (ke API Gateway):**

- **200 OK**
    - Body: `{ "data": [{...}, {...}], "pagination": {...} }`
- **500 Internal Server Error**

##### **Endpoint Internal:** `GET /service/users/{userId}/urls/{shortCode}`

Deskripsi: Dipanggil oleh API Gateway untuk mengambil detail satu short URL.

Path Parameters:

* userId: string

* shortCode: string

Logic:

1. Ambil data dari tabel `short_urls` **Postgres** berdasarkan `shortCode` DAN `userId`.
2. Jika ditemukan, tentukan `isActive`.
3. Kembalikan detail URL.

**Responses (ke API Gateway):**

- **200 OK**
    - Body: `{ "shortUrlId": "...", ... "isActive": true/false }`
- **404 Not Found** (Jika URL tidak ada atau bukan milik user tersebut)
- **500 Internal Server Error**

##### **Endpoint Internal:** `DELETE /service/users/{userId}/urls/{shortCode}`

Deskripsi: Dipanggil oleh API Gateway untuk menghapus short URL.

Path Parameters:

* userId: string

* shortCode: string

Logic:

1. Verifikasi bahwa short URL dengan `shortCode` ada di **Postgres** dan dimiliki oleh `userId`. Jika tidak, kembalikan 404 (atau 403 jika ada tapi bukan milik user, meskipun API Gateway mungkin sudah handle ini).
2. Hapus entri `shorturl:<shortCode>` dari **Redis**.
3. Hapus entri dari tabel `short_urls` di **Postgres**.
4. Kembalikan status sukses.

**Responses (ke API Gateway):**

- **200 OK** (atau 204 No Content)
    - Body: `{ "message": "Short URL deleted successfully." }` (jika 200 OK)
- **404 Not Found**
- **500 Internal Server Error**

---

---

### 3. URL Shortener Service

Layanan ini sangat fokus dan sederhana: menerima `shortCode`, mencari `longUrl` di **Redis**, dan mencatat kunjungan di **Postgres**. Tidak ada autentikasi pengguna di sini.

**Prefix internal service:** `/service/redirect`

---

#### **3.1. Endpoint Redirect dan Analitik**

##### **Endpoint Internal:** `GET /service/redirect/{shortCode}`

Deskripsi: Dipanggil oleh API Gateway untuk mendapatkan longUrl dan memicu pencatatan analitik.

Path Parameters:

* shortCode: string

Logic:

1. Coba ambil `longUrl` dari **Redis** menggunakan key `shorturl:<shortCode>`.
2. Jika `longUrl` ditemukan di Redis:
    - Kembalikan `longUrl` ke API Gateway (yang akan melakukan HTTP redirect).
    - **Secara Asynchronous (sangat direkomendasikan untuk performa redirect):** Kirim pesan ke antrian (misalnya RabbitMQ, Kafka) yang berisi `shortCode` untuk di proses oleh worker terpisah yang akan melakukan increment pada `visits` di tabel `short_urls` **Postgres**.
    - **Alternatif Synchronous (jika overhead rendah atau tidak ada message queue):** Langsung lakukan `UPDATE short_urls SET visits = visits + 1 WHERE short_code = <shortCode>` di **Postgres**. Hati-hati dengan potensi bottleneck.
3. Jika `longUrl` tidak ditemukan di Redis (kemungkinan kedaluwarsa atau tidak valid):
    - Kembalikan 404.

**Responses (ke API Gateway):**

- **200 OK** (Jika `longUrl` ditemukan)
    - Body: HTML Page to forwarded into user browser
- **404 Not Found** (Jika `shortCode` tidak ada di Redis)
    - Body: HTML Page to forwarded into user browser
- **500 Internal Server Error** (Misalnya, jika ada masalah saat mencoba mengirim pesan ke queue atau (jika sync) saat update DB Postgres).

---

---

### Catatan Penting Tambahan:

- **Struktur Key Redis:**
    - Untuk short URL: `shorturl:<shortCode>` -> `longUrl` (dengan TTL)
    - Untuk pengecekan ketersediaan `customShort` saat pembuatan, bisa menggunakan `shortcode_exists:<customShort>` -> `1` (dengan TTL singkat jika hanya untuk lock sementara, atau tanpa TTL jika untuk menandai yang sudah dipakai permanen sampai dihapus dari Postgres). Atau cukup query ke Postgres tabel `short_urls` kolom `short_code` jika jumlahnya tidak terlalu masif.
- **Konsistensi Data antara Redis dan Postgres:**
    - **Pembuatan:** Simpan ke Postgres dulu, baru ke Redis. Jika Redis gagal, ada mekanisme retry atau kompensasi (misalnya, menghapus dari Postgres atau menandai sebagai tidak aktif).
    - **Penghapusan:** Hapus dari Redis dulu (untuk segera menghentikan redirect), lalu dari Postgres.
    - **Kedaluwarsa:** Redis akan menangani penghapusan otomatis. Data di Postgres akan tetap ada dan bisa ditandai `isActive: false` berdasarkan `expiresAt`. Pertimbangkan _cron job_ untuk membersihkan data lama di Postgres jika diperlukan, atau untuk memindahkan analitik ke tabel arsip.
- **Keunikan `shortCode` yang Digenerate:**
    - Gunakan algoritma yang menghasilkan string acak dengan probabilitas kolisi rendah (misalnya, base62 dari integer yang di-increment atau UUID yang dipotong).
    - Selalu cek keunikan di **Redis** dan/atau **Postgres** sebelum finalisasi. Jika terjadi kolisi (sangat jarang jika panjang kode cukup), generate ulang.
- **Error Codes:** Definisikan kode error internal yang konsisten untuk memudahkan debugging dan monitoring (`INVALID_CREDENTIALS`, `URL_NOT_FOUND`, `TOKEN_EXPIRED`, dll.).
- **Logging:** Setiap service harus memiliki logging yang detail untuk setiap request, terutama untuk error dan keputusan penting.
- **Transaksi Database:** Gunakan transaksi di Postgres untuk operasi yang melibatkan beberapa perubahan (misalnya, saat membuat short URL, penulisan ke tabel `short_urls` harus atomic).
- **Asynchronous Processing:** Untuk increment analitik, sangat disarankan menggunakan Message Queue untuk memisahkan proses redirect yang kritis waktu dari proses update database yang bisa memiliki latensi lebih tinggi.
