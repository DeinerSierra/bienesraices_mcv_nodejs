import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'

import Usuario from '../models/Usuarios.js';
import { generarId, generarJWT } from '../helpers/token.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';


const formularioLogin = (req, res) => {
    res.render('auth/login',{
        pagina:'Iniciar Sesion',
        csrfToken: req.csrfToken()
    })
};
const autenticar = async (req, res) => {
    console.log('Autenticando...........')
    //Validar campos
    await check('email').isEmail().withMessage('Campo email invalido').run(req)
    await check('password').notEmpty().withMessage('Campo password es obligatorio').run(req)
    let resultado = validationResult(req)

  
    //Verificar el resultado vacio de las validaciones.
    if (!resultado.isEmpty()){
        //Errores.
        return res.render('auth/login',{
            pagina:'Login de acceso',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
            
        })
    }
    //verificar si existe el usuario.-
    const {email,password} = req.body
    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render('auth/login',{
            pagina:'Login de acceso',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Usuario no existe'}]
            
        })

    }
    //Comprobar que el usuario esta confirmado.
    if (!usuario.confirmado){
        return res.render('auth/login',{
            pagina:'Login de acceso',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Cuenta sin confirmar por favor verifica tu email y confirma'}]
            
        })

    }
    //Comprobar el password.
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login',{
            pagina:'Login de acceso',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Password incorrecto'}]
            
        })
    }
    //Autenticar el usuario.
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
    return res.cookie('_token', token,{
        httpOnly: true,
        //secure: true
    }).redirect('/mis-propiedades')
    
    

}
const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}
const formularioRegistro = (req, res) => {
    res.render('auth/registro',{
        pagina:'Crear Cuenta',
        csrfToken: req.csrfToken()
    }).redirect('/mis-propiedades')

};
const registrar = async (req, res) => {
    //Validar los datos.
    await check('nombre').notEmpty().withMessage('Campo nombre invalido').run(req)
    await check('email').isEmail().withMessage('Campo email invalido').run(req)
    await check('password').isLength({min:6}).withMessage('Campo password debe tener minimo 6 caracteres').run(req)
    await check('repetir-password').equals(req.body.password).withMessage('Password desiguales').run(req)
    //req.checkBody('password2','Passwords do not match.').equals(req.body.password1)
    let resultado = validationResult(req)

  
    //Verificar el resultado vacio de las validaciones.
    if (!resultado.isEmpty()){
        //Errores.
        return res.render('auth/registro',{
            pagina:'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email,
                
            }
        })


    }

    //Evitar usuarios duplicados en el sistema.
    const existeUsuarios = await Usuario.findOne({where: {email: req.body.email}})
    if (existeUsuarios){
        return res.render('auth/registro',{
            pagina:'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg:'Usuario ya registrado '}],
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email
                
            }
        })
    }
    //CREAR EL USUARIO.
    const usuario = await Usuario.create({
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        token: generarId()

    })
    //Enviar msg al email..
    emailRegistro({
        nombre: usuario.nombre, 
        email: usuario.email,
        token: usuario.token
    })

    /*const usuario = await Usuario.create(req.body)
    res.json(usuario);*/

    //Mostar mensaje de confirmacion.
    res.render('templates/mensaje',{
        pagina:'Cuenta Creada Correctamente',
        mensaje: 'Hemos enviado un mensaje de confirmacion a tu correo'
    })

}
//Funcion para confirmar una cuenta.argv
const confirmar =async (req, res) => {
    const {token} = req.params

    //Verificar si el token es valido
    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina:'Error al confirmar cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();
    res.render('auth/confirmar-cuenta', {
        pagina:'Cuenta confirmada',
        mensaje: 'Cuenta confirmada con exito'
        
    })

    

}
const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password',{
        pagina:'Recuperar tu acceso a Bienes Raices',
        csrfToken: req.csrfToken(),
    })

};

const resetPassword =async (req, res) => {
    //Validar los datos.
    
    await check('email').isEmail().withMessage('Campo email invalido').run(req)
  
    //req.checkBody('password2','Passwords do not match.').equals(req.body.password1)
    let resultado = validationResult(req)

  
    //Verificar el resultado vacio de las validaciones.
    if (!resultado.isEmpty()){
        //Errores.
        return res.render('auth/olvide-password',{
            pagina:'Recuperar tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
            
        })


    }
    //Buscar el usuario.
    const {email} = req.body
    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario) {
        return res.render('auth/olvide-password',{
            pagina:'Recuperar tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg:'El email no se encuentra registrado'}]
            
        })

    }
    //Generar un token y enviar un email.
    usuario.token = generarId();
    await usuario.save();

    //Enviar email.
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    //Renderizar el mensaje de enviado.
    
    res.render('templates/mensaje',{
        pagina:'Restablece tu password',
        mensaje: 'Hemos enviado un mensaje de intrucciones a tu correo'
    })


}

const comprobarToken =async (req, res) => {
    const {token} = req.params
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina:'Restablece tu password',
            mensaje: 'Hubo un error al restablecer tu password, intenta de nuevo',
            error: true
        })

    }
    //Si el usuario es valido mostramos un form para un nuevo password.
    res.render('auth/reset-password', {
        pagina:'Restablece tu password',
        csrfToken: req.csrfToken()

    })
}
const nuevoPassword = async (req, res) => {
    //Validar el password.
    await check('password').isLength({min:6}).withMessage('Campo password debe tener minimo 6 caracteres').run(req)
    let resultado = validationResult(req)
    //Verificar el resultado vacio de las validaciones.
    if (!resultado.isEmpty()){
        //Errores.
        return res.render('auth/reset-password',{
            pagina:'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })


    }
    const {token} = req.params
    const {password} = req.body
    //Identificar quien hace el cambio.
    const usuario = await Usuario.findOne({where: {token}})

    //Hash el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina:'Password restablecido',
        mensaje: 'Password restablecido con exito'
    })

}

export{ formularioLogin,
    formularioRegistro,
    registrar,
    formularioOlvidePassword,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,autenticar,cerrarSesion }