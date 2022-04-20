
    const apiKey = "5ae2e3f221c38a28845f05b6012e95dbdd0f7cd2e708999ef03fd32d";

    //init global variables for paging
    let pageLength = 5;

    let offset = 0;
    let lon = 0;
    let lat = 0;
    let zoomAmount = 3;
    let count = 0;
    let poi = document.getElementById("poi");

    let map             /* google maps gets initialized here. */ 
    let bounds          /* defines an area on the map bit enough to fit all restaurants. */

    let textDiv = document.createElement("div");
    let placeDiv = document.createElement("div");
    let notice = document.createElement("div");
    let bodyDiv = document.getElementById("modalBody");
    
    //code from https://opentripmap.io/examples
    //This function calls API methods by fetch function
    function apiGet(method, query) {
        return new Promise(function (resolve, reject) {
            var otmAPI =
                "https://api.opentripmap.com/0.1/en/places/" +
                method +
                "?apikey=" +
                apiKey;
            if (query !== undefined) {
                otmAPI += "&" + query;
            }
            fetch(otmAPI)
                .then(response => response.json())
                .then(data => resolve(data))
                .catch(function (err) {
                    console.log("Fetch Error :-S", err);
                });
        });
    }

    //Uses the placename from input textbox and gets place location from API. If place was found it calls list loading function.
    document.getElementById("search_form").addEventListener("submit", function (event) {
        poi.innerHTML = "";
        let name = document.getElementById("textbox").value;
        apiGet("geoname", "name=" + name).then(function (data) {
            let message = "Name not found";
            if (data.status == "OK") {
                message = data.name + ", " + getCountryName(data.country);
                lon = data.lon;
                lat = data.lat;
                zoomAmount = 8;
                firstLoad();
                initMap();
            }else{
                console.log(data.status);
            }
                document.getElementById("info").innerHTML = `<p class="cityTitle">${message}</p>`;
        });
        event.preventDefault();
    });

    function initMap(){
            
            map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: lat, lng: lon },
                zoom: zoomAmount,
                disableDefaultUI: true
            });
  
            let cityCenter = {
                lat: lat,
                lng: lon
            };
            // the bounds get extended whenever we add a point. 
            // here we are adding the user's location to initialize the bounds
            bounds = new google.maps.LatLngBounds();
            bounds.extend(cityCenter); 
      
      }
    

    //This function gets total objects count within 1000 meters from specified location (lon, lat) and then loads first objects page.
    function firstLoad() {
        apiGet(
            "radius",
            `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=1&format=count`
        ).then(function (data) {
            count = data.count;
            offset = 0;
            document.getElementById(
                "info"
            ).innerHTML += `<p>${count} objects with description in a 1km radius</p>`;
            loadList();
        });
    }

    //This function load POI's list page to the left pane. It uses 1000 meters radius for objects search.
    function loadList() {
        apiGet(
            "radius",
            `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=1&format=json`
        ).then(function (data) {
            let list = document.getElementById("list");
            list.innerHTML = "";
            data.forEach(item => {
                    let xid = item.xid
                    apiGet("xid/" + xid).then(data => {
                        list.appendChild(createListItem(item));
                        createMarker(data);
                    })
            });
            // data.forEach(poi => createMarker(poi));
            let nextBtn = document.getElementById("next_button");
            if (count < offset + pageLength) {
                nextBtn.style.visibility = "hidden";
            } else {
                nextBtn.style.visibility = "visible";
                nextBtn.innerText = `Next (${offset + pageLength} of ${count})`;
            }
        });
    }

    //This function create a list item at the left pane
    function createListItem(item) {
        let a = document.createElement("a");
        a.className = "list-group-item list-group-item-action";

        //Sets bootstrap modal functionality on list item
        let toggle = document.createAttribute("data-toggle");
        toggle.value = "modal";
        a.setAttributeNode(toggle);
        let target = document.createAttribute("data-target");
        target.value = "#exampleModal";
        a.setAttributeNode(target);

        a.setAttribute("data-id", item.xid);
        a.innerHTML = `<h5 class="list-group-item-heading">${item.name}</h5>
          <p class="list-group-item-text">${getCategoryName(item.kinds)}</p>`;

        a.addEventListener("click", function () {
            //erases contents of popup so it is blank and ready to include the information for the new item
            textDiv.innerHTML = "";
            placeDiv.innerHTML = "";
            notice.innerHTML = "";
            bodyDiv.innerHTML = "";

            document.querySelectorAll("#list a").forEach(function (item) {
                item.classList.remove("active");
            });
            this.classList.add("active");
            let xid = this.getAttribute("data-id");
            apiGet("xid/" + xid).then(data => {
                // onShowPOI(data);
                displayPopup(data);
            })
        });
        return a;
    }

    //attributes the modal popup with the associated image and data
    function displayPopup(data) {
        let titleDiv = document.getElementById("exampleModalLabel");

        if(data.preview && data.wikipedia_extracts){
            titleDiv.textContent = data.name;
    
            textDiv.setAttribute("class", "bodyText");
            textDiv.innerHTML = data.wikipedia_extracts.html;
    
            placeDiv.setAttribute("class", "popupImg");
            placeDiv.innerHTML = `<img style=" max-height: 350px; margin: 3%; border-radius: 10px" src="${data.preview.source}">`;
    
            bodyDiv.appendChild(placeDiv);
            bodyDiv.appendChild(textDiv);
        }else{
            titleDiv.textContent = data.name;

            notice.innerHTML = `<div class="noticeText">no image available</div><p><a target="_blank" href="${data.otm}" style="color: #42adff">See more at OpenTripMap</a></p>`;

            bodyDiv.appendChild(notice);
        }
        
    }

        // This function shows preview and description at the right pane
        // function onShowPOI(data) {
        //     poi.innerHTML = "";
        //     if (data.preview) {
        //         poi.innerHTML += `<img style="width: 80%; border-radius: 20px" src="${data.preview.source}">`;
        //     }else{
        //         poi.innerHTML += `<div class="noticeText">no image available</div>`;
        //     }
        //     poi.innerHTML += data.wikipedia_extracts
        //         ? data.wikipedia_extracts.html
        //         : data.info
        //         ? data.info.descr
        //         : "No description";
    
        //     poi.innerHTML += `<p><a target="_blank" href="${data.otm}">Show more at OpenTripMap</a></p>`;
        // }
    
    //This block process Next page button
    document
        .getElementById("next_button")
        .addEventListener("click", function () {
            offset += pageLength;
            loadList();
        });

    /* Given a JSON object that describes a restaurant, we are ready to add it to the map.*/
    const createMarker = (data) => {
        /* Each YELP listing includes GPS coordinates.
        Here, we set up these coordinates in a way that Google understands. */ 
        console.log(data);

        let latLng = new google.maps.LatLng(
        data.point.lat,
        data.point.lon
        );
        
        /* extend the bounds of the map to fit each new point */ 
        bounds.extend(latLng);
        map.fitBounds(bounds);
        /* Make an "infowindow" for each restaurant. 
        This is like a bubble that appears when we click on a marker.
        You could modify this template to show a variety of details. */ 
        let infowindow;
        if(data.preview && data.wikipedia_extracts){
            infowindow = new google.maps.InfoWindow({
            maxWidth: 500,
            content: 
                `<img style=" max-height: 350px; margin: 3%; border-radius: 10px" src="${data.preview.source}"><div style="margin: 3%; margin-top: 0px">
                <h3>${data.name}</h3><div class="bodyText">${data.wikipedia_extracts.html}</div></div>`
            });
        }else{
            infowindow = new google.maps.InfoWindow({
                maxWidth: 500,
                content: 
                    `<h3>${data.name}</h3><div class="noticeText">no image available</div>`
            });
        }

        const icon = {
            url: "assets/marker.png", // url
            scaledSize: new google.maps.Size(50, 50), // scaled size
            origin: new google.maps.Point(0,0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
        };

        /* Markers are customizable with icons, etc.*/ 
        let marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: icon
        });

        /* here we control what happens when the user clicks on a marker.*/ 
        marker.addListener("click", () => {
        try{  
            /* if another window is already open, close it first*/ 
            currentWindow.close() 
        }
        catch(e){  
            /* no window is open yet  so we don't need to do anything. */ 
        }
        /* open the infowindow attached to this marker. */ 
        infowindow.open(map, marker);
        /* set the infowindow as "currentWindow"
        this will allow us to track it and close it on subsequent clicks. */
        currentWindow = infowindow; 
        });
    }
  
    // Note that "apikey" here is actually a URL. 
    // it corresponds to an endpoint on which NodeJS is listening.
    // After fetching the API Key from Node, the frontend will in turn fetch Google Maps.
    fetch("apikey")
    .then(response => response.json())
    .then(data => {
    if (data.Status == "OK"){
        /* Now that we have an API Key for Google Maps, 
        We can generate a URL to fetch the Google Maps Javascript.
        We Include parameters for the Google API Key and callback function.
        After the script is loadeded, the callback function "initMap" will run. */  
        let url = 'https://maps.googleapis.com/maps/api/js'+
                    '?key='+data.GOOGLE_KEY+
                    '&callback=initMap';
        /* Add the Google Maps JavaScript to the page. */ 
        let script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
    else{
        console.log(data);
    }
    })
    .catch(err => {
    console.error(err);
    });

            
