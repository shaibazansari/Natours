
export const displayMap = (locations) => {

    mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhaWJheiIsImEiOiJja2Y2eTlpamgweDhtMnpxZDV0dGVwZndkIn0.zIasgZ6wdwcBo6CQOSb3Vg';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/shaibaz/ckf6zdavd426g1asugzpzdcfq',
        scrollZoom: false
    });

    const bounds = new mapboxgl.LngLatBounds()

    locations.forEach(loc => {
        // Create marker
        const ele = document.createElement('div')
        ele.className = 'marker'

        // Add marker
        new mapboxgl.Marker({
            element: ele,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map)

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map)

        // Extends map bounds to include current locations
        bounds.extend(loc.coordinates)
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 200,
            left: 100,
            right: 100
        }
    })
}