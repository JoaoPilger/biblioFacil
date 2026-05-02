const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) =>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Token não fornecido" });
    }
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido ou expirado" });
        }
        req.user = user; // payload do token
        req.userId = user?.sub;
        next();
    });
}

module.exports = authenticateToken;