$(document).ready(function() {
    jQuery.ajaxSetup({
        async: false
    });
    //when different things are selected, the description of pins change, map is initiated again
    document.getElementById("sell").addEventListener("change", function() {
        if (document.getElementById("sell").value == "Exchange Rate (per $1 US)") {
            document.getElementById("red-pin").style.visibility = "hidden";
            document.getElementById("yellow-pin").style.visibility = "hidden";
            document.getElementById("green-pin").style.visiblity = "hidden";
            initMap('exchangeRate');
        } else if (document.getElementById("sell").value == "GDP Growth Rate") {
            document.getElementById("red-pin").innerHTML = "Low";
            document.getElementById("green-pin").innerHTML = "High";
            initMap('gdpGrowthRate');
        } else if (document.getElementById("sell").value == "GDP Per Capita (USD)") {
            document.getElementById("red-pin").innerHTML = "Low";
            document.getElementById("green-pin").innerHTML = "High";
            initMap('gdpPerCapita');
        } else if (document.getElementById("sell").value == "Apartment Rent Prices (USD)") {
            document.getElementById("red-pin").innerHTML = "High";
            document.getElementById("green-pin").innerHTML = "Low";
            initMap('apartmentRent');
        } else if (document.getElementById("sell").value == "Unemployment Rate") {
            document.getElementById("red-pin").innerHTML = "High";
            document.getElementById("green-pin").innerHTML = "Low";
            initMap('unemploymentRate');
        }
    });

    //gets a list of all of the urban area links
    function getLinkList() {
        var linkList = [];
        $.getJSON("https://api.teleport.org/api/urban_areas/", function(json) {
            for (var i = 0; i < json['count']; i++) {
                linkList.push(json['_links']['ua:item'][i]['href']);
            }
        });
        return linkList;
    }

    //returns either a list of city names, latitudes, or longitudes reading the city list links
    function getCityInfo(array, request) {
        var cityInfoList = [];
        for (var i = 0; i < array.length; i++) {
            $.getJSON(array[i], function(json) {
                if (request == 'cityName') {
                    cityInfoList.push(json['full_name']);
                } else if (request == 'latCoord') {
                    cityInfoList.push(json['bounding_box']['latlon']['north']);
                } else {
                    cityInfoList.push(json['bounding_box']['latlon']['east']);
                }
            });
        }
        return cityInfoList;
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
      return [pushObject, jsonObject];
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
          return [pushObject, jsonObject]
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
        return [pushObject, jsonObject]
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
        return [pushObject, jsonObject]
    }

    //gets json for unemploymentRate
    function getUnemployment(){
      jsonObject = json['categories'][9]['data'][3]['percent_value'];
      if (jsonObject == undefined) {
          pushObject = 'info unavailible';
      } else {
          pushObject = (((jsonObject) * 100).toFixed(2)).toString() + "%";
      }
      return [pushObject, jsonObject]
    }


    function getCityDetails(array, request) {
        var cityDetailsList = [];
        for (var i = 0; i < array.length; i++) {
            $.getJSON(array[i] + 'details/', function(json) {
                if (request == 'exchangeRate') {
                  cityDetailsList.push(getExchangeDetails(json));
                }
                else if (request == 'gdpGrowthRate') {
                  cityDetailsList.push(getGrowthRate(json));
                }
                else if (request == 'gdpPerCapita') {
                  cityDetailsList.push(getPerCapita(json));
                }
                 else if (request == 'apartmentRent') {
                   cityDetailsList.push(getApartmentRent(json));

                } else {
                  cityDetailsList.push(getUnemployment(json));
                }
            });
        }
        return cityDetailsList;
    }

function valueAdd(array){
  //goes thorugh array
  var rawValList = []
  for (var i =0; i<array.length; i++){
    rawValList.push(array[i][1]);
  }

  function sortNumber(a,b) {
    return a - b;
}
 sortedList = rawValList.sort(sortNumber);
  return [sortedList[88], sortedList[177]];
}

    //okay so the strategy used here is that the initMap function is called, a map is set and the info window function is called to set each marker one at a time.
    //This is clearly taking a lot of time to keep calling each function over and over again
    //what works: initMap needs to take request parameter. sure.
    window.initMap = function(request) {
      var latCoordList = getCityInfo(getLinkList(), 'latCoord');
      var longCoordList = getCityInfo(getLinkList(), 'longCoord');
      var cityNamesList = getCityInfo(getLinkList(), 'cityName');
      var cityDetailsList = getCityDetails(getLinkList(), request);
        var uluru = {
            lat: 0,
            lng: 0
        };
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 2,
            center: uluru
        });

        function setInfoWindow(j, marker){
        //sets content of info window
        var infowindow = new google.maps.InfoWindow({
            content: '<b>' + cityNamesList[j] + '</b><br>' + cityDetailsList[j][0]
        })
        marker.addListener('click', function() {
            infowindow.open(map, this);
        });
      }
        for (var j = 0; j < cityDetailsList.length; j++) {
          //sets position
          var newPosition = {
              lat: latCoordList[j],
              lng: longCoordList[j]
          };
          //sets marker image (make if statements)
          var firstThird = valueAdd(cityDetailsList)[0];
          var secondThird = valueAdd(cityDetailsList)[1];

          if (cityDetailsList[j][1]<firstThird){
            if (request == 'gdpPerCapita' || request == 'gdpGrowthRate'){
              var image = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
            }
            else if (request == 'exchangeRate'){
              var image = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';
            }
            else{
              var image = 'https://maps.google.com/mapfiles/ms/micons/green-dot.png';

            }
          }
          else if (cityDetailsList[j][1]>firstThird && cityDetailsList[j][1]<secondThird){
            var image = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';
          }
          else{
            if (request == 'gdpPerCapita' || request == 'gdpGrowthRate'){
              var image = 'https://maps.google.com/mapfiles/ms/micons/green-dot.png';
            }
            else if (request = 'exchangeRate'){
              var image = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';
            }
            else{
              var image = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
            }
          }

          //creates new google maps marker
          var marker = new google.maps.Marker({
              position: newPosition,
              map: map,
              icon: image
          });
          setInfoWindow(j, marker);
        }
    }
    initMap('gdpGrowthRate');
});
