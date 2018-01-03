$(document).ready(function() {

    /**
    This makes sure that the map is not initialized before data is retrieved
    and stored successfully.
    **/
    jQuery.ajaxSetup({
        async: false
    });

    /**
    If option picked from the dropdown menu, change the map to match
    @param {function} function - function that listens for user selection
    **/
    document.getElementById("sell").addEventListener("change", function() {

        //If Exchange Rate selected
        if (document.getElementById("sell").value == "Exchange Rate (per $1 US)") {
            initMap(3);
        }

        //if GDP Growth Rate selected
        else if (document.getElementById("sell").value == "GDP Growth Rate") {
            initMap(4);
        }

        //If GDP Per Capita selected
        else if (document.getElementById("sell").value == "GDP Per Capita (USD)") {
            initMap(5);
        }

        //if Apartment Rent Prices selected
        else if (document.getElementById("sell").value == "Apartment Rent Prices (USD)") {
            initMap(6);
        }

        //if Unemployment Rate selected
        else if (document.getElementById("sell").value == "Unemployment Rate") {
            initMap(7);
        }
    });

    /**
    Gets list of Urban Area links from Teleport API
    To be used to store data in the dictionary
    **/
    function getLinkList() {
        var linkList = [];
        $.getJSON("https://api.teleport.org/api/urban_areas/", function(json) {
            for (var i = 0; i < json['count']; i++) {
                linkList.push(json['_links']['ua:item'][i]['href']);
            }
        });
        return linkList;
    }

    /**
    Gets Exchange Rate details
    @param {JSON} json - the json object for the specific urban area
    @return {String} pushObject - the string to be displayed on the city's info window
    **/
    function getExchangeDetails(json) {
        var jsonObject, jsonObject2;
        var pushObject;

        //Stores currency amount and currency name respectively
        jsonObject = json['categories'][5]['data'][1]['float_value'];
        jsonObject2 = json['categories'][5]['data'][0]['string_value'];

        if (jsonObject == undefined || jsonObject2 == undefined) {
            pushObject = 'info unavailible';
        } else {
            pushObject = ((jsonObject).toFixed(2)).toString() + " " + jsonObject2;
        }
        return pushObject;
    }

    /**
    Gets Growth Rate details
    @param {JSON} json - the json object for the specific urban area
    @return {String} pushObject - the string to be displayed on the city's info window
    **/
    function getGrowthRate(json) {
        var jsonObject;
        var pushObject;
        jsonObject = json['categories'][5]['data'][2]['percent_value'];
        if (jsonObject == undefined) {
            pushObject = 'info unavailible';
        } else {
            pushObject = (((jsonObject) * 100).toFixed(2)).toString() + "%";
        }
        return pushObject;
    }

    /**
    Gets GDP Per Capita details
    @param {JSON} json - the json object for the specific urban area
    @return {String} pushObject - the string to be displayed on the city's info window
    **/
    function getPerCapita(json) {
        var jsonObject;
        var pushObject;
        jsonObject = json['categories'][5]['data'][4]['currency_dollar_value'];
        if (jsonObject == undefined) {
            pushObject = 'info unavailible';
        } else {
            pushObject = "$" + ((jsonObject).toFixed(2)).toString();
        }
        return pushObject;
    }

    /**
    Gets Apartment Rent Price details
    @param {JSON} json - the json object for the specific urban area
    @return {String} pushObject - the string to be displayed on the city's info window
    **/
    function getApartmentRent(json) {
        var jsonObject, jsonObject1, jsonObject2;
        var pushObject;

        //Stores rent prices for small, medium and large apartments respectively
        jsonObject = json['categories'][8]['data'][2]['currency_dollar_value'];
        jsonObject1 = json['categories'][8]['data'][1]['currency_dollar_value'];
        jsonObject2 = json['categories'][8]['data'][0]['currency_dollar_value'];

        if (jsonObject == undefined || jsonObject1 == undefined || jsonObject2 == undefined) {
            pushObject = 'info unavailible';
        } else {
            pushObject = "Small: $" + ((jsonObject).toFixed(2)).toString();
            pushObject += "<br>Medium: $" + ((jsonObject1).toFixed(2)).toString();
            pushObject += "<br>Large: $" + ((jsonObject2).toFixed(2)).toString();
        }
        return pushObject;
    }

    /**
    Gets Unemployment details
    @param {JSON} json - the json object for the specific urban area
    @return {String} pushObject - the string to be displayed on the city's info window
    **/
    function getUnemployment(json) {
        jsonObject = json['categories'][9]['data'][3]['percent_value'];
        if (jsonObject == undefined) {
            pushObject = 'info unavailible';
        } else {
            //converts object to a percent value
            jsonObject = jsonObject * 10000;
            pushObject = ((jsonObject).toFixed(2)).toString() + "%";
        }
        return pushObject;
    }


    /**
    Returns dictionary storing city information
    @param {Array} array - the array of all city JSON object URLs
    @return {Dictionar} cityInfo - the dictionary that stores information about cities
    **/
    function getCityInfo(array) {

        var cityInfo = {};
        for (var i = 0; i < array.length; i++) {
            var cityInfoList = [];
            $.getJSON(array[i], function(json) {
                cityInfoList.push(json['full_name']); //0
                cityInfoList.push(json['bounding_box']['latlon']['north']); //1
                cityInfoList.push(json['bounding_box']['latlon']['east']); //2
            });

            $.getJSON(array[i] + 'details/', function(json) {
                cityInfoList.push(getExchangeDetails(json)); //3
                cityInfoList.push(getGrowthRate(json)); //4
                cityInfoList.push(getPerCapita(json)) //5
                cityInfoList.push(getApartmentRent(json)) //6
                cityInfoList.push(getUnemployment(json)) //7
            });

            cityInfo[i] = cityInfoList;
        }
        return cityInfo;
    }

    /**
    Initializes map based on menu selection by user
    @param {number} request - represents the position wanted from the value array in the dictionary
    **/
    window.initMap = function(request) {

        //initializes pins and dictionary
        var redPin = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
        var cityInfoDict = getCityInfo(getLinkList());

        //sets and centers maps
        var uluru = {
            lat: 0,
            lng: 0
        };
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 2,
            center: uluru
        });

        /**
        Sets up the info window for the corresponding marker
        @param {number} key - reprents the key wanted from the dictionary
        @param {number} request - represents the position wanted from the value array in the dictionary
        **/
        function setInfoWindow(key, marker) {

            //sets content of info window according to city (key) and user selection (request)
            var infowindow = new google.maps.InfoWindow({
                content: '<b>' + cityInfoDict[key][0] + '</b><br>' + cityInfoDict[key][request]
            });
            //opens info window when this marker is clicked
            marker.addListener('click', function() {
                infowindow.open(map, this);
            });
        }

        //creates a new marker for each urban area, with info window to match
        for (var key in cityInfoDict) {
            //sets position of marker
            var newPosition = {
                lat: cityInfoDict[key][1],
                lng: cityInfoDict[key][2]
            };

            var image = redPin;

            //creates new google maps marker
            var marker = new google.maps.Marker({
                position: newPosition,
                map: map,
                icon: image
            });
            //sets marker's info window
            setInfoWindow(key, marker);
        }
    }

    //default initialization to Exchange Rate map display
    initMap(3);
});
