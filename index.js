const fragment = document.createElement('div');

jQuery.ajaxSetup({
    async: false
});

let currInfoWindow;

/**Return formatted exchange rate for a given city*/
function getExchangeRate(data) {
    const exRate = data[1]['float_value'];
    const currency = data[0]['string_value'];
    return exRate !== undefined && currency !== undefined ?
        exRate.toFixed(2).toString() + ' ' + currency :
        'info unavailable'
}

/**Return formatted growth rate for a given city*/
function getGrowthRate(data) {
    const grRate = data[2]['percent_value']
    return grRate !== undefined ? (grRate * 100).toFixed(2).toString() + '%' : 'info unavailable';
}

/**Return formatted GDP for a given city*/
function getGdp(data) {
    const gdp = data[4]['currency_dollar_value'];
    return gdp !== undefined ? '$' + (gdp).toFixed(2).toString() : 'info unavailable';
}

/**Return formatted apartment data for a given city*/
function getApartmentPrices(aptData) {
    const smallAptPrices = aptData[2]['currency_dollar_value'];
    const medAptPrices = aptData[1]['currency_dollar_value'];
    const largeAptPrices = aptData[0]['currency_dollar_value'];

    if (smallAptPrices === undefined || medAptPrices === undefined || largeAptPrices === undefined) {
        return 'info unavailable';
    } else {
        return "Small: $" + ((smallAptPrices).toFixed(2)).toString() +
            "<br>Medium: $" + ((medAptPrices).toFixed(2)).toString() +
            "<br>Large: $" + ((largeAptPrices).toFixed(2)).toString();
    }
}

/**Return formatted unemployment rate for a given city*/
function getUnemployment(unemploymentData) {
    const rawUnemploymentRate = unemploymentData[3]['percent_value'];
    if (unemploymentData[3] === undefined && rawUnemploymentRate === undefined) {
        return 'info unavailable';
    } else {
        return ((rawUnemploymentRate * 1000).toFixed(2)).toString() + '%';
    }
}

/** Create google map marker for each urban area*/
function createMapPoints(map) {

    $.getJSON('https://api.teleport.org/api/urban_areas/', (links) => {
        for (let i = 0; i < links['count']; i++) {

            const linkArray = links['_links']['ua:item'][i]['href'];

            $.getJSON(linkArray, (cityLink) => {
                const markerPosition = {
                    lat: cityLink['bounding_box']['latlon']['north'],
                    lng: cityLink['bounding_box']['latlon']['east'],
                }

                //creates new google maps marker using latitude and longitude provided by teleport API
                const marker = new google.maps.Marker({
                    position: markerPosition,
                    map: map,
                    icon: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png',
                    cityName: cityLink['full_name']
                });

                //opens info window when the user hovers over marker
                marker.addListener('mouseover', () => {
                    $.getJSON(linkArray + 'details/', (details) => {
                        setInfoWindow(marker, details);
                    });
                });
            });
        }
    });
}

/** Sets info window according to selection when marker is hovered over */
function setInfoWindow(marker, details) {

    if (currInfoWindow !== undefined) {
        currInfoWindow.close();
    }

    const selector = document.getElementById('selector')

    const selectionMapping = {
        'Exchange Rate (per $1 US)': { 'function': getExchangeRate, 'data': details['categories'][5]['data'] },
        'GDP Growth Rate': { 'function': getGrowthRate, 'data': details['categories'][5]['data'] },
        'GDP Per Capita (USD)': { 'function': getGdp, 'data': details['categories'][5]['data'] },
        'Unemployment Rate': { 'function': getUnemployment, 'data': details['categories'][9]['data'] },
        'Apartment Rent Prices (USD)': { 'function': getApartmentPrices, 'data': details['categories'][8]['data'] }
    }

    const selectorValue = selectionMapping[selector.value];


    //sets content of info window according to city (key) and user selection (request)
    let infowindow = new google.maps.InfoWindow({
        content: '<b>' + marker.cityName + '</b><br>' + selectorValue.function(selectorValue.data)
    });

    infowindow.open(map, marker);
    currInfoWindow = infowindow;
}

//sets and centers maps
let uluru = {
    lat: 0,
    lng: 0
};


$(document).ready(() => {
    const map = new google.maps.Map(fragment, {
        zoom: 2,
        center: uluru
    });

    //initializes pins and dictionary
    createMapPoints(map);

    fragment.id = 'map';
    document.getElementById('map-container').innerHTML = "";
    document.getElementById('map-container').style.margin = "0%";
    document.getElementById('map-container').appendChild(fragment);
});
