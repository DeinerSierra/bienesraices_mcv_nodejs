import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    const { email, nombre, token } = datos;
    //Enviar el email.
    await transport.sendMail({
        from:'BienesRaices.com',
        to: email,
        subject:'Confirma tu cuenta para tener acceso al portal Bienes Raices',
        text: 'Confirma tu cuenta para tener acceso al portal Bienes Raices',
        html:`
             <p>Hola ${nombre}, por favor confirma tu cuenta y accede al portal</p>
             <p>Para confirmar tu cuenta da click <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 4000}/auth/confirmar/${token}">Aqui</a> </p>

             <p>Si no creaste esta cuenta ignora este mensaje</p>
        `
    })

}


const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  const { email, nombre, token } = datos;
  //Enviar el email.
  await transport.sendMail({
      from:'BienesRaices.com',
      to: email,
      subject:'Restablece tu password para el acceso al portal Bienes Raices',
      text: 'Restablece tu password para el acceso al portal Bienes Raices',
      html:`
           <p>Hola ${nombre}, por favor restablece tu password y accede al portal</p>
           <p>Para restablecer da click <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 4000}/auth/olvide-password/${token}">Aqui</a> </p>

           <p>Si no hiciste  esta peticion ignora este mensaje</p>
      `
  })

}


export{
    emailRegistro,
    emailOlvidePassword
}