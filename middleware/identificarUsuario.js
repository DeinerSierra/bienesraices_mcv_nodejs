import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuarios.js';

const identificarusuarios = async (req, res, next) => {
    //identificar si hay un token en las cookies.
    const {_token} = req.cookies;
    if (!_token) {
        req.usuario = null;
        return next();
    }
    //Comprobar el token
    try {
        const decode = jwt.verify(_token, process.env.JWT_SECRET)
        const usuario = await Usuario.scope('eliminarPassword').findByPk(decode.id)
        
        if(usuario){
            req.usuario = usuario
        }
        
        return next();
        
    } catch (error) {
        console.log(error);
        return res.clearCookie('_token').redirect('/auth/login')
    }

}
export default identificarusuarios