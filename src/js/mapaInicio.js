(function() {
    const lat = 4.6486259;
    const lng =  -74.2478967;
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 10);

    let markers = new L.FeatureGroup().addTo(mapa)

    let propiedades = [];
    
    //Filtros...
    const filtros = {
        categoria: '',
        precio: '',
    }
    const categoriasSelected = document.querySelector('#categorias');
    const preciosSelected = document.querySelector('#precios');


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //Filtrado de categorias y precios.
    categoriasSelected.addEventListener('change', e => {
        filtros.categoria= +e.target.value;
        filtrarPropiedades();
    })
    preciosSelected.addEventListener('change', e => {
        filtros.precio= +e.target.value;
        filtrarPropiedades();
    })

    //Consumir el json con los datos de propiedades del apiController.
    const obtenerPropiedades = async() => {
        try {
            const url = '/api/propiedades'
            const respuesta = await fetch(url)
            propiedades = await respuesta.json()
            mostrarPropiedades(propiedades);
        } catch (error) {
            console.error(error);
            
        }

    }
    const mostrarPropiedades = propiedades => {
        //Limpiar los pines.
        markers.clearLayers()
        propiedades.array.forEach(propiedad => {
            //Agregar los pines.
            const marker = new L.marker([propiedad?.lat, propiedad?.lng],{
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`<p class="text-indigo-600 font-bold">${propiedad?.categoria.nombre}</p>
                        <h1 class="text-xl font-extrabold uppercase my-2">${propiedad?.titulo}</h1>
                        <img src="/uploads/${propiedad?.imagen}"alt="Imagen propiedad"/>
                        <p class="text-gray-600 font-bold">${propiedad?.precio.nombre}</p>
                        <a href="/propiedad/${propiedad.id}" class="bg-indigo-600 block p-2 text-center font-bold uppercase text-white ">Ver Propiedad</a>
                        `)
            markers.addLayer(marker)
        });
    }
    const filtrarPropiedades = () => {
        const resultados = propiedades.filter(filtrarCategoria).filter(filtrarPrecio);
        mostrarPropiedades(resultados)

    }
    const filtrarCategoria = (propiedad) => {
        return filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad
    }
    const filtrarPrecio = (propiedad) => {
        return filtros.precio ? propiedad.precioId === filtros.precio : propiedad
    }
    obtenerPropiedades()

})()