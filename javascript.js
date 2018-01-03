$(document).ready(function() {

    /**

    **/
    jQuery.ajaxSetup({
        async: false
    });

    /**
    If option picked from the dropdown menu, change the map and legend to match
    @param {function} function - function that listens for user selection
    **/
    document.getElementById("sell").addEventListener("change", function() {

        //If Exchange Rate selected
        if (document.getElementById("sell").value == "Exchange Rate (per $1 US)") {
            document.getElementById("red-pin").innerHTML = "Low";
            document.getElementById("green-pin").innerHTML = "High";
            initMap(3);
        }

        //if GDP Growth Rate selected
        else if (document.getElementById("sell").value == "GDP Growth Rate") {
            document.getElementById("red-pin").innerHTML = "Low";
            document.getElementById("green-pin").innerHTML = "High";
            initMap(4);
        }

        //If GDP Per Capita selected
        else if (document.getElementById("sell").value == "GDP Per Capita (USD)") {
            document.getElementById("red-pin").innerHTML = "Low";
            document.getElementById("green-pin").innerHTML = "High";
            initMap(5);
        }

        //if Apartment Rent Prices selected
        else if (document.getElementById("sell").value == "Apartment Rent Prices (USD)") {
            document.getElementById("red-pin").innerHTML = "High";
            document.getElementById("green-pin").innerHTML = "Low";
            initMap(6);
        }

        //if Unemployment Rate selected
        else if (document.getElementById("sell").value == "Unemployment Rate") {
            document.getElementById("red-pin").innerHTML = "High";
            document.getElementById("green-pin").innerHTML = "Low";
            initMap(7);
        }
    });

    /**
    Gets list of Urban Area links from API

    **/
    function getLinkList() {
        var linkList = [];
        //gets list of all Links
        $.getJSON("https://api.teleport.org/api/urban_areas/", function(json) {
            for (var i = 0; i < json['count']; i++) {
                linkList.push(json['_links']['ua:item'][i]['href']);
            }
        });
        return linkList;
    }

    //gets json for exchange rate details
    function getExchangeDetails(json){
      var jsonObject, jsonObject2;
      var pushObject;
      jsonObject = json['categories'][5]['data'][1]['float_value'];
      jsonObject2 = json['categories'][5]['data'][0]['string_value'];
      if (jsonObject == undefined || jsonObject2 == undefined) {
          pushObject = 'info unavailible';
      } else {
          pushObject = ((jsonObject).toFixed(2)).toString() + " " + jsonObject2;
      }
      return pushObject;
    }

    //gets json for growth rate details
    function getGrowthRate(json){
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

    //gets json for gdpPerCapita
    function getPerCapita(json){
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

    //gets json for apartmentRent
    function getApartmentRent(json){
      var jsonObject, jsonObject1, jsonObject2;
      var pushObject;
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

    //gets json for unemploymentRate
    function getUnemployment(json){
      jsonObject = json['categories'][9]['data'][3]['percent_value'];
      if (jsonObject == undefined) {
          pushObject = 'info unavailible';
      } else {
          jsonObject = jsonObject * 10000;
          pushObject = ((jsonObject).toFixed(2)).toString() + "%";
      }
      return pushObject;
    }


/**
Returns a dictionary of information for cities
For each city: (accessed through links) cityName is the

**/
function getCityInfo(array) {

    var cityInfo = {};

    for (var i = 0; i < array.length; i++) {

       var cityInfoList = [];

        $.getJSON(array[i], function(json) {
                cityInfoList.push(json['full_name']);//0
                cityInfoList.push(json['bounding_box']['latlon']['north']);//1
                cityInfoList.push(json['bounding_box']['latlon']['east']);//2
        });

        $.getJSON(array[i] + 'details/', function(json) {
            cityInfoList.push(getExchangeDetails(json));//3
            cityInfoList.push(getGrowthRate(json));//4
            cityInfoList.push(getPerCapita(json))//5
            cityInfoList.push(getApartmentRent(json))//6
            cityInfoList.push(getUnemployment(json))//7
        });

        cityInfo[i] = cityInfoList;
      }

      return cityInfo;
}

    //okay so the strategy used here is that the initMap function is called, a map is set and the info window function is called to set each marker one at a time.
    //This is clearly taking a lot of time to keep calling each function over and over again
    //what works: initMap needs to take request parameter. sure.
    window.initMap = function(request) {

      //different types of pins
      var redPin = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
      var yellowPin = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';
      var greenPin = 'https://maps.google.com/mapfiles/ms/micons/green-dot.png';

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

      //console.log(getLinkList());

      function setInfoWindow(key, marker){

          //sets content of info window
          var infowindow = new google.maps.InfoWindow({
              content: '<b>' + cityInfoDict[key][0] + '</b><br>' + cityInfoDict[key][request]
          });

      marker.addListener('click', function() {
          infowindow.open(map, this);
      });

      }


      for (var key in cityInfoDict) {
          //sets position
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
          setInfoWindow(key, marker);
        }
    }
    initMap(3);
});
