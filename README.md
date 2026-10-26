# Lab 3 — Foreign Keys and Simple SQL

**Students:**
- Ahmed Khaled Habib — 2204153
- Mohamed Elhussiny — 2204073

**Course:** Introduction to Database Systems, Fall 2026 (Dr. Yasser Fouad)

```
lab3-2204153-2204073/
  problem1_DDL.sql       # Problem 1 – COMPANY database
  problem1_DML.sql
  problem1_Answers.txt
  problem2_DDL.sql       # Problem 2 – library database (AUTHOR, BOOK)
  problem2_DML.sql       # seed data: 4 authors, 8 books
  website/               # Express + MySQL website (F2.1 – F2.5 + image bonus)
  README.md
```

## Requirements

- **MySQL Server 8.0** (the `mysql` client must be on your PATH)
- **Node.js 18+** (comes with `npm`)

## 1. Problem 1 — COMPANY database

```bash
mysql -u root -p < problem1_DDL.sql
mysql -u root -p < problem1_DML.sql
```

The SQL and output for Q1.1 – Q1.3 are in `problem1_Answers.txt`.

## 2. Problem 2 — library database

Run from the `lab3-2204153-2204073` folder:

```bash
mysql -u root -p < problem2_DDL.sql    # creates database `library`, tables AUTHOR and BOOK
mysql -u root -p < problem2_DML.sql    # inserts the seed data
```

Check it:

```bash
mysql -u root -p library
mysql> SELECT * FROM AUTHOR;
mysql> SELECT * FROM BOOK;
```

Both scripts can be re-run at any time (the DDL drops and recreates the database).

### Schema

| Table  | Columns | Keys |
|--------|---------|------|
| AUTHOR | `author_id INT`, `name VARCHAR(100)`, `country VARCHAR(50)`, `photo VARCHAR(255)` | PK `author_id` |
| BOOK   | `book_id INT`, `title VARCHAR(150)`, `price DECIMAL(10,2)`, `author_id INT`, `cover VARCHAR(255)` | PK `book_id`, FK `author_id → AUTHOR(author_id)` **ON DELETE CASCADE** |

`photo` and `cover` store the path of the uploaded image (bonus). Because of `ON DELETE CASCADE`,
deleting an author deletes all of that author's books.

## 3. The website

### Step 1 — install packages (first time only)

```bash
cd website
npm install
```

### Step 2 — tell the website your MySQL password

The website connects as `root` on `localhost:3306` to the database `library`.
Set your password in an environment variable before starting:

| Shell | Command |
|-------|---------|
| Windows PowerShell | `$env:DB_PASSWORD="your_password"` |
| Windows CMD        | `set DB_PASSWORD=your_password` |
| macOS / Linux      | `export DB_PASSWORD=your_password` |

(Alternatively, edit the default password in `website/db.js`.)
Other optional variables: `DB_USER`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `PORT`.

### Step 3 — start it

```bash
npm start
```

Open **http://localhost:3000**

### Pages

| Feature | Where |
|---------|-------|
| **F2.1** Show the books (with `author_id`) and the authors | `/` (both tables), `/books`, `/authors` |
| **F2.2** Add a book / add an author | **+ Add book** (`/books/new`), **+ Add author** (`/authors/new`) |
| **F2.3** Edit a book / edit an author | **Edit** button on each row |
| **F2.4** Remove a book | **Remove** button on the Books page |
| **F2.5** Remove an author | **Remove** button on the Authors page (also removes that author's books) |
| **Bonus** Book covers and author photos | Upload on the add/edit forms; shown in the tables |

Uploaded images are saved in `website/public/uploads/books` and `website/public/uploads/authors`.
Books or authors without an image show a placeholder with their first letter.

## Troubleshooting

- **`Access denied for user 'root'@'localhost'`** — the password in `DB_PASSWORD` is wrong or not set in the same terminal you ran `npm start` from.
- **`Unknown database 'library'`** — run `problem2_DDL.sql` first.
- **`Cannot add or update a child row: a foreign key constraint fails`** — the chosen author does not exist; add the author first.
- **Port 3000 already in use** — start with another port, e.g. `PORT=4000 npm start` (PowerShell: `$env:PORT=4000; npm start`).
