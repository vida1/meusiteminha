document.addEventListener('DOMContentLoaded', (event) => {
    // Inicializa o mapa
    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -5
    });

    // Dimensões da imagem do mapa
    const w = 5000; // Largura da imagem
    const h = 5000; // Altura da imagem
    const url = 'path/to/your/gta-v-map.jpg'; // Caminho para a imagem do mapa

    // Define os limites da imagem
    const southWest = map.unproject([0, h], map.getMaxZoom() - 1);
    const northEast = map.unproject([w, 0], map.getMaxZoom() - 1);
    const bounds = new L.LatLngBounds(southWest, northEast);

    // Adiciona a imagem do mapa como camada
    L.imageOverlay(url, bounds).addTo(map);

    // Define a visualização inicial do mapa
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);

    // Adiciona marcações personalizadas
    const locations = [
        { lat: 34.0522, lng: -118.2437, title: 'Spray 1' },
        { lat: 34.0622, lng: -118.2537, title: 'Spray 2' },
        { lat: 34.0722, lng: -118.2637, title: 'Spray 3' },
        // Adicione mais 23 localizações aqui
        { lat: 34.0822, lng: -118.2737, title: 'Spray 4' },
        { lat: 34.0922, lng: -118.2837, title: 'Spray 5' },
        { lat: 34.1022, lng: -118.2937, title: 'Spray 6' },
        { lat: 34.1122, lng: -118.3037, title: 'Spray 7' },
        { lat: 34.1222, lng: -118.3137, title: 'Spray 8' },
        { lat: 34.1322, lng: -118.3237, title: 'Spray 9' },
        { lat: 34.1422, lng: -118.3337, title: 'Spray 10' },
        { lat: 34.1522, lng: -118.3437, title: 'Spray 11' },
        { lat: 34.1622, lng: -118.3537, title: 'Spray 12' },
        { lat: 34.1722, lng: -118.3637, title: 'Spray 13' },
        { lat: 34.1822, lng: -118.3737, title: 'Spray 14' },
        { lat: 34.1922, lng: -118.3837, title: 'Spray 15' },
        { lat: 34.2022, lng: -118.3937, title: 'Spray 16' },
        { lat: 34.2122, lng: -118.4037, title: 'Spray 17' },
        { lat: 34.2222, lng: -118.4137, title: 'Spray 18' },
        { lat: 34.2322, lng: -118.4237, title: 'Spray 19' },
        { lat: 34.2422, lng: -118.4337, title: 'Spray 20' },
        { lat: 34.2522, lng: -118.4437, title: 'Spray 21' },
        { lat: 34.2622, lng: -118.4537, title: 'Spray 22' },
        { lat: 34.2722, lng: -118.4637, title: 'Spray 23' },
        { lat: 34.2822, lng: -118.4737, title: 'Spray 24' },
        { lat: 34.2922, lng: -118.4837, title: 'Spray 25' },
        { lat: 34.3022, lng: -118.4937, title: 'Spray 26' }
    ];

    locations.forEach(location => {
        L.marker([location.lat, location.lng])
            .addTo(map)
            .bindPopup(`<b>${location.title}</b>`);
    });
});