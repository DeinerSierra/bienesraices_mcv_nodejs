import Propiedad from './Propiedad.js';
import Precio from './Precio.js';
import Categoria from './Categoria.js';
import Usuario from './Usuarios.js';
import Mensaje from './Mensaje.js';

//Relacion 1:1
//Precio.hasOne(Propiedad)
Propiedad.belongsTo(Precio,{foreingKey: 'precioId'})
Propiedad.belongsTo(Categoria,{foreingKey: 'categoriaId'})
Propiedad.belongsTo(Usuario,{foreingKey: 'usuarioId'})
Propiedad.hasMany(Mensaje,{foreingKey: 'propiedadId'})

Mensaje.belongsTo(Propiedad,{foreingKey: 'propiedadId'})
Mensaje.belongsTo(Usuario,{foreingKey: 'usuarioId'})
export {
    Propiedad,
    Precio,
    Categoria,
    Usuario,
    Mensaje
}