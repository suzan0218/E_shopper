# EShopper Backend API

Spring Boot backend API for the `front-end` e-commerce template.

## Run

```bash
cd demo
./gradlew bootRun
```

On Windows:

```powershell
cd demo
.\gradlew.bat bootRun
```

Default API base URL: `http://localhost:8080/api`

## Admin Login

Seeded admin account:

- `email`: `admin@eshopper.com`
- `password`: `admin123`

## Database

By default this project uses H2 in-memory DB and auto-seeds categories/products.

To use MySQL, set environment variables:

- `DB_URL=jdbc:mysql://localhost:3306/eshopper`
- `DB_USERNAME=your_user`
- `DB_PASSWORD=your_password`
- `DB_DRIVER=com.mysql.cj.jdbc.Driver`

## Endpoints

### Health

- `GET /api/health`

### Categories

- `GET /api/categories`

### Products

- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

### Orders

- `GET /api/orders`
- `POST /api/orders`

### Users

- `GET /api/users`

### Contact

- `POST /api/contact`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
