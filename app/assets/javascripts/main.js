(function(){

  'use strict';

  $(document).ready(initialize);

  var map;
  var stations = [];
  var homeMarker;
  var closestA, closestB, closestAddress;

  function initialize(){
    initMap(36.185, -86.7833, 11);
    setFirePins();
    $('#firefind').click(fireFind);
    $('#geolocation').click(geolocate);
  }

  function initMap(lat, lng, zoom){
    var mapOptions = {center: new google.maps.LatLng(lat, lng), zoom: zoom, mapTypeId: google.maps.MapTypeId.ROADMAP};
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
  }

  function setFirePins(){
    var url = "http://data.nashville.gov/resource/frq9-a5iv.json";
    $.getJSON(url, pinData);
  }

  function pinData(data){
    for(var i=0; i<data.length; i++){
      var station_number = data[i].station_number;
      var address = data[i].mapped_location;
      var lat = address.latitude;
      var lng = address.longitude;

      addStation(lat, lng, station_number);
    }
  }

  function addStation(lat, lng, station_number){
    var position = new google.maps.LatLng(lat, lng, station_number);
    var marker = new google.maps.Marker({map:map, position:position, title:station_number});
    stations.push(position);
  }

  function fireFind(event){
    var address = $('input[name="address"]').val();

    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({address:address}, function(results, status){
      var name = results[0].formatted_address;
      var lat = results[0].geometry.location.lat();
      var lng = results[0].geometry.location.lng();

      addHome(lat, lng, name);
    });

    event.preventDefault();
  }

  function geolocate(event){
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        addHome(position.coords.latitude, position.coords.longitude, "current location");
      });
    }

    event.preventDefault();
  }

  function addHome(lat, lng, title){
    if(homeMarker){
      homeMarker.setMap(null);
    }

    var position = new google.maps.LatLng(lat, lng, title);
    var marker = new google.maps.Marker({map:map, position:position, title:title, icon: "/assets/home.png"});
    homeMarker = marker;

    map.setCenter(position);

    calculateDistances(position);
  }

  function calculateDistances(origin){
    var firstSet = stations.slice(0, 25);
    var secondSet = stations.slice(25);

    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: firstSet,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      }, parseDistances
    );

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: secondSet,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      }, parseDistances
    );
  }

  function parseDistances(response, status) {
    var results = response.rows[0].elements;

    var closest = results[0];

    for(var i = 1; i<results.length; i++){
      if(results[i].duration.value < closest.duration.value){
        closest = results[i];
        closestAddress = response.destinationAddresses[i];
      }
    }

    if(closestA){
      closestB = {closest: closest, address: closestAddress};
    }else{
      closestA = {closest: closest, address: closestAddress};
    }

    console.log(response);
    if(closestA && closestB){
      finalComparison();
    }
  }

  function finalComparison(){
    var winner = closestA.closest.duration.value < closestB.closest.duration.value ? closestA : closestB;
    $('#info').text("Your closest fire station is at " + winner.address + " and is " + winner.closest.distance.text + " and " + winner.closest.duration.text + " away by vehicle.");
    closestA = null;
    closestB = null;
    closestAddress = null;
  }

})();
