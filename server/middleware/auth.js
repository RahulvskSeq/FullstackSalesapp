import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return res.status(401).json({ error:'No token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error:'Invalid token' });
  }
};

export const adminOnly = (req, res, next) => {
  if(req.user?.role !== 'admin') return res.status(403).json({ error:'Admins only' });
  next();
};
