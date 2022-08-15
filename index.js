// IMPORTING MODULES
require("dotenv").config();
const db = require("./config/dbconn");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const {
    genSalt,
    compare,
    hash
} = require("bcrypt");
const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT) || 3001;

// SERVER LISTEN
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// allow access to fetch data from the api externally by  Seting header
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    next();
});

app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
    credentials: true
 }));


// add cors to the app variable
app.use(
    router,
    cors(),
    express.json(),
    express.urlencoded({
        extended: true,
    })
);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HOME PAGE ROUTER
router.get("/", (req, res) => {
    res.status(200).sendFile("./views/index.html", {
        root: __dirname
    });
});

// LOGIN PAGE ROUTER
router.get("/login", (req, res) => {
    res.status(200).sendFile("./views/login.html", {
        root: __dirname
    });
});

// REGISTER PAGE ROUTER
router.get("/register", (req, res) => {
    res.status(200).sendFile("./views/register.html", {
        root: __dirname
    });
});

// PRODUCTS PAGE ROUTER
router.get("/productss", (req, res) => {
    res.status(200).sendFile("./views/products.html", {
        root: __dirname
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// LOGIN

// Login
app.post('/login', bodyParser.json(),
    (req, res)=> {
    try{
        // Get email and password
        const { email, password } = req.body;
        const strQry =
        `
        SELECT email, password
        FROM users
        WHERE email = '${email}';
        `;
        db.query(strQry, async (err, results)=> {
            if(err) throw err;
            // const key = jwt.sign(JSON.stringify(results[0]), process.env.secret);
            // res.json({
            //     status: 200,
            //     results: key,
            // });
            // localStorage.setItem('key', JSON.stringify(key));
            // key = localStorage.getItem('key');
            switch(true){
                case (await compare(password,results[0].password)):
                res.redirect('/productss')
                break
                default:
                console.log("Bye");
            }
        })
    }catch(e) {
        console.log(`From login: ${e.message}`);
    }
});

// USER REGISTRATION
// ADD NEW USER

app.post("/register", bodyParser.json(), (req, res) => {
    let emails = `SELECT email FROM users WHERE ?`;
    let email = {
        email: req.body.email
    };
    db.query(emails, email, async (err, results) => {
        if (err) throw err;
        // VALIDATION
        if (results.length > 0) {
            res.send("The provided email/phone number exists. Please enter another one");
        } else {
            const bd = req.body;
            console.log(bd);
            let generateSalt = await genSalt();
            bd.password = await hash(bd.password, generateSalt);
            // QUERY
            const strQry = `
            INSERT INTO users(user_fullname, email, password, phone_number, join_date)
            VALUES(?, ?, ?, ?, ?);
            `;
            //
            db.query(
                strQry,
                [
                    bd.user_fullname,
                    bd.email,
                    bd.password,
                    bd.phone_number,
                    bd.join_date,
                ],
                (err, results) => {
                    if (err) throw err;
                    res.send(`${results.affectedRows} NEW USER ADDED`);
                }
            );
        }
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GET ALL USERS

router.get("/users", (req, res) => {
    const query = `SELECT * FROM users`;
    db.query(query, (err, results) => {
        if (err) throw err;
        if (results.length < 1) {
            res.json({
                status: 204,
                results: "There are no users",
            });
        } else {
            res.json({
                status: 200,
                results: results,
            });
        }
    });
});

// GET A USER WITH A SPECIFIC ID

router.get("/users/:id", (req, res) => {
    const query = `SELECT * FROM users WHERE user_id=?`;
    db.query(query, req.params.id, (err, results) => {
        if (err) throw err;
        if (results.length < 1) {
            res.json({
                status: 204,
                results: "User does not exist",
            });
        } else {
            res.json({
                status: 200,
                results: results,
            });
        }
    });
});

// DELETE USER WITH SPECIFIC ID

router.delete("/users/:id", (req, res) => {
    // Query
    const strQry = `
    DELETE FROM users 
    WHERE user_id = ?;
    ALTER TABLE users AUTO_INCREMENT = 1;
    `;
    db.query(strQry, [req.params.id], (err, data) => {
        if (err) throw err;
        res.send(`${data.affectedRows} USER/S DELETED`);
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GET ALL PRODUCTS

router.get("/products", (req, res) => {
    // Query
    const strQry = `
    SELECT product_id, title, category, description, img, price, created_by
    FROM products;
    `;
    db.query(strQry, (err, results) => {
        if (err) throw err;
        res.json({
            status: 200,
            results: results,
        });
    });
});

// GET ONE PRODUCT

router.get("/products/:id", (req, res) => {
    // Query
    const strQry = `
    SELECT product_id, title, category, description, img, price, created_by
    FROM products
    WHERE product_id = ?;
    `;
    db.query(strQry, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json({
            status: 200,
            results: results.length <= 0 ? "Sorry, no product was found." : results,
        });
    });
});

// CREATE A NEW PRODUCT

router.post("/products", bodyParser.json(), (req, res) => {
    const bd = req.body;
    bd.totalamount = bd.quantity * bd.price;
    // Query
    const strQry = `
    INSERT INTO products(title, category, description, img, price, created_by)
    VALUES(?, ?, ?, ?, ?, ?);
    `;
    db.query(
        strQry,
        [bd.title, bd.category, bd.description, bd.img, bd.price, bd.created_by],
        (err, results) => {
            if (err) throw err;
            res.send(`${results.affectedRows} PRODUCT/S ADDED`);
        }
    );
});

// DELETE A PRODUCT WITH A SPECIFIC ID

app.delete("/products/:id", (req, res) => {
    // QUERY
    const strQry = `
    DELETE FROM products 
    WHERE product_id = ?;
    ALTER TABLE products AUTO_INCREMENT = 1;
    `;
    db.query(strQry, [req.params.id], (err, data) => {
        if (err) throw err;
        res.send(`${data.affectedRows} PRODUCT/S WAS DELETED`);
    });
});

// UPDATE A PRODUCT

router.put("/products/:id", bodyParser.json(), (req, res) => {
    // const bd = req.body;
    // Query
    const strQry = `
    UPDATE products 
    SET title = ?, category = ?, description = ?, img = ?, price = ? 
    WHERE product_id = ?`;
    db.query(
        strQry,
        [req.body.title, req.body.category, req.body.description, req.body.img, req.body.price, req.body.created_by, req.params.id],
        (err, results) => {
            if (err) throw err;
            res.send(`${results.affectedRows} PRODUCT/S UPDATED`);
        }
    );
});

//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    devServer: {
        Proxy: "*",
    },
};


