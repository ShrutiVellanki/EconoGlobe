const fragment = document.createElement('div');
const icon = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
const map = new google.maps.Map(fragment, {
    zoom: 2,
    center: { lat: 0, lng: 0 },
});
const unavailable = 'info unavailable';
let currInfoWindow;

jQuery.ajaxSetup({
    async: false
});


$(document).ready(() => {
    createMapPoints();
    fragment.id = 'map';
    document.getElementById('map-container').innerHTML = "";
    document.getElementById('map-container').style.margin = "0%";
    document.getElementById('map-container').appendChild(fragment);
});

/** Create google map marker for each urban area*/
function createMapPoints() {

    $.getJSON('https://api.teleport.org/api/urban_areas/', (links) => {
        for (let i = 0; i < links['count']; i++) {

            const cityLinks = links['_links']['ua:item'][i]['href'];

            $.getJSON(cityLinks, (cityLink) => {
                
                const marker = getMarker(cityLink, map);
                //opens info window when the user hovers over marker
                marker.addListener('mouseover', () => {
                    $.getJSON(cityLinks + 'details/', (details) => {
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

    const selection = document.getElementById('selector').value;
    const selectionDetails = getSelectionMapping(details, selection);
    //sets content of info window according to city (key) and user selection (request)
    const infowindow = new google.maps.InfoWindow({
        content: `<b>${marker.cityName}</b><br>${selectionDetails}`
    });

    infowindow.open(map, marker);
    currInfoWindow = infowindow;
};

function getMarker (cityLink, map) {
    const markerPosition = getMarkerPosition(cityLink);

    //creates new google maps marker using latitude and longitude provided by teleport API
    const marker = new google.maps.Marker({
        position: markerPosition,
        map: map,
        icon: icon,
        cityName: cityLink['full_name']
    });
    
    return marker;
}

function formattedData(number) {
    return number!== undefined ? number.toFixed(2).toString() : undefined;
}

/**Return formatted exchange rate for a given city*/
function getExchangeRate(exRate, currency) {
    console.log(exRate, currency);
    return exRate && currency? `${exRate}  ${currency}` : unavailable;
}

/**Return formatted growth rate for a given city*/
function getGrowthRate (grwthRate) {;
    return grwthRate? `${grwthRate} %` : unavailable;
}

/**Return formatted GDP for a given city*/
function getGdp(gdp) {
    return gdp? `$${gdp}` : unavailable;
}

/**Return formatted apartment data for a given city*/
function getApartmentPrices (smallAptPrices, medAptPrices, largeAptPrices) {
    const priceString = `Small: $ ${smallAptPrices} 
                         <br>Medium: $${medAptPrices}
                         <br>Large: $${largeAptPrices}`;

    return (smallAptPrices && medAptPrices && largeAptPrices) ? priceString: unavailable;
}

/**Return formatted unemployment rate for a given city*/
function getUnemployment(unemploymentData) {
    return `${unemploymentData} %`;
}

/**Return the marker position for a city**/
function getMarkerPosition(cityLink) {
    const latLng = cityLink['bounding_box']['latlon'];
    return {
        lat: latLng['north'],
        lng: latLng['east'],
    };
}

function getSelectionMapping(details, selector) {
    const categories = details['categories'];
    
    if(selector === 'Exchange Rate (per $1 US)') {
        const exchData = categories[5]['data'];
        exchRate = formattedData(exchData[1]['float_value']);
        currency = exchData[0]['string_value']
        return getExchangeRate(exchRate, currency);
    } else if (selector === 'GDP Growth Rate') {
        gdpGrowth = formattedData(categories[5]['data'][2]['percent_value']);
        return getGrowthRate(gdpGrowth);
    } else if (selector === 'GDP Per Capita (USD)') {
        const gdpData = details['categories'][5]['data'];
        gdp = formattedData(gdpData[4]['currency_dollar_value']);
        return getGdp(gdp);
    } else if(selector === 'Unemployment Rate'){
        unemployment = formattedData(details['categories'][9]['data'][3]['percent_value']);
        return getUnemployment(unemployment);
    } else if (selector === 'Apartment Rent Prices (USD)'){
        const aptData = details['categories'][8]['data'];
        small = formattedData(aptData[2]['currency_dollar_value']);
        medium = formattedData(aptData[1]['currency_dollar_value']);
        large = formattedData(aptData[0]['currency_dollar_value']);
        return getApartmentPrices(small, medium, large);
    }
}

