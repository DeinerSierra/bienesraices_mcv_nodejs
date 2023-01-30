(function() {
    
    const lat = document.querySelector('#lat').value || 4.6486259;
    const lng = document.querySelector('#lng').value || -74.2478967;
    const mapa = L.map('mapa').setView([lat, lng ], 10);

    let marker;
    //Utilizar  Provider y Geocoder
    const geocodeService = L.esri.Geocoding.geocodeService();
    

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //Colocar el pin en el mapa.
    marker = L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
    .addTo(mapa);
    //Detectar el movimiento del pin.
    marker.on('moveend', function(e) {
        marker = e.target
        const posicion = marker.getLatLng();
        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

        //Detectar informacion de las calles.
        geocodeService.reverse().latlng(posicion,13).run(function(err, resultado) {
            //console.log(resultado)
            marker.bindPopup(resultado.address.LongLabel)
            //LLenar los campos.
            document.querySelector('.calle').textContent = resultado?.address?.Address ?? '';
            document.querySelector('#calle').value = resultado?.address?.Address ?? '';
            document.querySelector('#lat').value = resultado?.latlng?.lat ?? '';
            document.querySelector('#lng').value = resultado?.latlng?.lng ?? '';
        })


    })


})()