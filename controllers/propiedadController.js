import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator";
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from "../models/index.js";
import { esVendedor,formatearFechas } from "../helpers/index.js";
//import Precio from '../models/Precio.js';
//import Categoria from '../models/Categoria.js';

const admin = async (req, res) => {
  //Leer query string.
  const { pagina: paginaActual } = req.query;
  const expresion = /^[1-9]$/;
  if (!expresion.test(paginaActual)) {
    return res.redirect("/mis-propiedades?pagina=1");
  }
  try {
    const { id } = req.usuario;
    //Limites y offsets del paginador.
    const limit = 10;
    const offset = ((paginaActual * limit)- limit)
    const [propiedades, total] = await Promise.all([
        Propiedad.findAll({
            limit,
            offset,
            where: { usuarioId: id },
            include: [
                { model: Categoria, as: "categoria" },
                { model: Precio, as: "precio" },
                { model: Mensaje, as: "mensajes" }
            ],
        }),
        Propiedad.count({
            where: {
                usuarioId: id
            }
        })
    ])

    res.render("propiedades/admin", {
      pagina: "Mis propiedades",
      propiedades: propiedades,
      csrfToken: req.csrfToken(),
      paginas: Math.ceil(total/limit),
      paginaActual:Number(paginaActual),
      total,
      offset,
      limit

    });
  } catch (error) {
    console.log(error);
  }
};
//Formulario para crear una nueva propiedad
const crear = async (req, res) => {
  //Consultar Modelo de precio y categorias
  console.log("creando.....");
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/crear", {
    pagina: "Crear Propiedad",
    csrfToken: req.csrfToken(),
    categorias: categorias,
    precios: precios,
    datos: {},
  });
};

const guardar = async (req, res) => {
  //Resultado de la validacion.
  let resultado = validationResult(req);
  console.log("Guardando..........");
  console.log(req.usuario);
  if (!resultado.isEmpty()) {
    //Consultar Modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propiedades/crear", {
      pagina: "Crear Propiedad",
      csrfToken: req.csrfToken(),
      categorias: categorias,
      precios: precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }
  //Crear un registro en ldb.
  console.log(req.body);
  const {
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio,
    categoria,
  } = req.body;
  const { id: usuarioId } = req.usuario;
  console.log(req.usuario);
  try {
    const propiedadDB = await Propiedad.create({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId: precio,
      categoriaId: categoria,
      usuarioId,
      imagen: "",
    });
    const { id } = propiedadDB;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
  } catch (error) {
    console.log(error);
  }
};
const agregarImagen = async (req, res) => {
  const { id } = req.params;
  //Validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);
  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada.
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad que la propiedad pertene a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }
  res.render("propiedades/agregar-imagen", {
    pagina: `Agregar Imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad,
  });
};
const almacenarImagen = async (req, res, next) => {
  const { id } = req.params;
  //Validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);
  if (!propiedad) {
    return res.render("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada.
  if (propiedad.publicado) {
    return res.render("/mis-propiedades");
  }
  //Validar que la propiedad que la propiedad pertene a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.render("/mis-propiedades");
  }
  try {
    //Almacenar la img y publicar la propiedad.
    propiedad.imagen = req.file.filename;
    propiedad.publicado = 1;
    await propiedad.save();
    next();
  } catch (error) {}
};

const editar = async (req, res) => {
  const { id } = req.params;
  //validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar quien vista la url es quien crea la propiedad.
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Consultar Modelo de precio y categorias
  console.log("editando.....");
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/editar", {
    pagina: `Editar Propiedad: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias: categorias,
    precios: precios,
    datos: propiedad,
  });
};
const guardarCambios = async (req, res) => {
  //Validar los campos esten llenos.
  //Resultado de la validacion.
  let resultado = validationResult(req);
  console.log("Guardando..........");
  console.log(req.usuario);
  if (!resultado.isEmpty()) {
    //Consultar Modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propiedades/editar", {
      pagina: `Editar Propiedad`,
      csrfToken: req.csrfToken(),
      categorias: categorias,
      precios: precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  const { id } = req.params;
  //validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar quien vista la url es quien crea la propiedad.
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Reescribir el objecto.
  try {
    const {
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio: precioId,
      categoria: categoriaId,
    } = req.body;
    propiedad.set({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
    });
    await propiedad.save();
    res.redirect("/mis-propiedades");
  } catch (error) {
    console.log(error);
  }
};

//Modificar el estado de la propiedad.
const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  //validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar quien vista la url es quien crea la propiedad.
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Actualizar
  propiedad.publicado = !propiedad.publicado
  await propiedad.save();
  res.json({resultado:'ok'})
}
const eliminar = async (req, res) => {
  const { id } = req.params;
  //validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar quien vista la url es quien crea la propiedad.
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Eliminar la imagen de la propiedad.
  await unlink(`public/uploads/${propiedad.imagen}`);
  //Elimnar la propiedad.
  await propiedad.destroy();
  res.redirect("/mis-propiedades");
};

const mostrarPropiedad = async (req, res) => {
  const { id } = req.params;
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Precio, as: "precio" },
      { model: Categoria, as: "categoria" },
    ],
  });
  if (!propiedad || !propiedad.publicado) {
    return res.redirect("/404");
  }
  
  res.render("propiedades/mostrar", {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
  });
};

const enviarMensaje = async (req, res) => {
  const { id } = req.params;
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Precio, as: "precio" },
      { model: Categoria, as: "categoria" },
    ],
  });
  if (!propiedad) {
    return res.redirect("/404");
  }
  //Renderizar los errores
  
  let resultado = validationResult(req);
  
  if (!resultado.isEmpty()) {
    return res.render("propiedades/mostrar", {
      propiedad,
      pagina: propiedad.titulo,
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
      errores: resultado.array()
    });  
  }
  //Almacenar el mensaje
  const {mensaje} = req.body;
  const {id: propiedadId} = req.params;
  const {id: usuarioId} = req.usuario;
  await Mensaje.create({
    mensaje,
    propiedadId,
    usuarioId

  })
  
  res.redirect('/')
}

//Leer los mensajes recibidos.
const verMensajes = async (req, res) => {
  const { id } = req.params;
  //validar que exista la propiedad.
  const propiedad = await Propiedad.findByPk(id,{
    include: [
      { model: Mensaje, as: "mensajes",
        include: [{ model: Usuario.scope('eliminarPassword'), as: "usuario"}]
     }
    ],
  });

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar quien vista la url es quien crea la propiedad.
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  res.render('propiedades/mensajes',{
    pagina: 'Mensajes',
    mensajes: propiedad.mensajes,
    formatearFechas
    
  })
}
export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImagen,
  editar,
  guardarCambios,
  cambiarEstado,
  eliminar,
  mostrarPropiedad,
  enviarMensaje,
  verMensajes
};
