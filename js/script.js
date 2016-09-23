//position.coords ~ accuracy, altitude, altitudeAccuracy, heading, latitude, longitude, speed

$(function(){
    /* Global vars*/
    var story = $(".modal.container");
    var containerLeft = (window.innerWidth < 640)?0:(window.innerWidth-640)/2
    $(".container").css({left:containerLeft+"px"});
    
    /* Get geolocation */
    function initGeolocation() {
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                enableHighAccuracy: true,
                timeout:60000,
                maximumAge:600000
            });
        } else {
            alert('Geolocation is not supported by the device!');
        }
    }
    
    /* Error handling */
    function errorCallback(){
        alert("Can't receive location data from device!")
    }
    
    /* Easing map pan */
    function smoothPan(map,p_start,p_end){
        var delta = {};
        //Set distance in change
        delta.A = -(p_start.A - p_end.A);
        delta.F = -(p_start.F - p_end.F);
        var f = 10, t = 0, d = 100; //do it 10 times with 0.1s interval
        setInterval(function(){
            //Easing wtih cubic in/out
            if(t < f){
                var v = t/(f/2);
                if(v < 1){
                    map.panTo(new google.maps.LatLng(delta.A/2*v*v*v + p_start.A,delta.F/2*v*v*v + p_start.F));
                }else{
                    v -= 2;
                    map.panTo(new google.maps.LatLng(delta.A/2*(v*v*v+2) + p_start.A,delta.F/2*(v*v*v+2) + p_start.F));
                }
                t++;
            }else{
                clearInterval(this);
            }
        },d)
    }
    
    /* Success handling - create map, retrieve data,  */
    function successCallback(position) {
        var getDevicePosition = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        /* recenter map */
        map.setCenter(getDevicePosition);
        /* Set map marker */
        var initMarker = new google.maps.Marker({
            position: getDevicePosition,
            map: map,
            icon: "../archtour/image/marker_current.png"
        });
    }
    
    //Setup Map
    var centerLatlng = new google.maps.LatLng(41.88406793446202, -87.6229190826416);  
    var map = new google.maps.Map($("#map")[0], {
        zoom: 15,
        center: centerLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        styles: [{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#50a5d1"}]},{"featureType":"transit","stylers":[{"color":"#808080"},{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"color":"#b3b3b3"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"weight":1.8}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":"#d7d7d7"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue": "#00FF6A"},{"saturation": -1.0989010989011234},{"lightness": 11.200000000000017},{"gamma": 1}]},{"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#a7a7a7"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue": "#FFBB00"},{"saturation": 43.400000000000006},{"lightness": 37.599999999999994},{"gamma": 1}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#696969"}]},{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"visibility":"on"},{"color":"#737373"}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#d6d6d6"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"hue": "#00FF6A"},{"saturation": -1.0989010989011234},{"lightness":11.200000000000017},{"gamma": 1}]}]
    });    
    
    /* Center Map */
    $(".btn.btn-center").on("click",function(){
        map.panTo(centerLatlng);
        map.setZoom(14);
    })

    /* Compile Data Request */
    var query = "SELECT * FROM " +"1qE0JZ2D4pQAgJ6FgTaLM0THtoVZDaOqSoL7n1duw";
    var encodedQuery = encodeURIComponent(query);
    var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&key=AIzaSyAyJu0DNQrfJf7wdMlxI9t7hE-lUgc655E');
    url.push('&callback=?');

    /* Call Data */ 
    $.ajax({
        url: url.join(''),
        dataType: 'jsonp',
        success: function (data) {
            console.log(data);
            var wpAttr = data.columns;//retrieve all object keys
            /* Create waypoint */
            $.each(data.rows,function(key,el){
                var building = new Object;
                var marker = new google.maps.Marker({
                    map: map
                });
                $.each(el,function(i,j){
                    building[wpAttr[i]] = j;
                    /* Put Marker */
                    if(wpAttr[i] == "location" && j != ""){
                        var wp = new google.maps.LatLng(j.split(",")[0],j.split(",")[1]);
                        marker.setPosition(wp);
                    }
                    if(wpAttr[i] == "thumb"){
                        marker.setIcon("../archtour/image/thumb_"+j+".png");
                    }
                })
                /* Binding objects with events*/
                google.maps.event.addListener(marker, 'click', function(){
                    var goal = new google.maps.LatLng(building.location.split(",")[0],building.location.split(",")[1]);
                    map.panTo(goal);
                    //smoothPan(map,map.getCenter(),goal);//Causing call overflow(Why?)
                    toggleStory(building);
                    console.log(building);
                });
            });
        }
    })

    /* hide Story */
    google.maps.event.addListener(map,'click',function(event){toggleStory()});
    
    //building ~ architect, description_zh, description_en, floors, height_ft, height_m, link, location, name_en, name_zh, picture, picture_l, picture_m, picture_t, picture_thumb, style_en, style_zh, year
    //building_sidenotes ~ sideNoteTitle_en, sideNoteTitle_zh, sideNote_en, sideNote_zh, sideNoteAttribution, sideNotePicture
    
    /* Show story */
    $(".building .caption").hide();
    function toggleStory(building){
        if(building == null){
            story.animate({top:"100vh"},750,"easeOutQuint");  
            $(".building .caption").fadeOut(300);
        }else{
            $(".building").scrollTop(0);
            /* Unhide */
            $(".building .caption").fadeIn(300);
            $(".building .meta_style").show();
            $(".building .meta_floors").show();
            $(".building .meta_height").show();
            $(".building .note_title").show();
            $(".building .note_title_en").show();
            $(".building .note_image").show();
            $(".building .note_attr").show();
            $(".building .note_content").show();
            /* Fill in data */
            $(".building .caption").text(building.name_zh);
            $(".building .title").text(building.name_zh);
            $(".building .title_en").text(building.name_en);
            if(building.style_zh == ""){
                $(".building .meta_style").hide();
            }else{
                $(".building .meta_style").text(building.style_zh);
            }
            if(isNaN(building.floors)){
                $(".building .meta_floors").hide();
            }else{
                $(".building .meta_floors").text(building.floors);
            }
            if(isNaN(building.height_m)){
                $(".building .meta_height").hide();
            }else{
                $(".building .meta_height").text(building.height_m);
            }
            $(".building .meta_year").text(building.year);
            $(".building .meta_architect").text(building.architect);
            $(".building .content").text(building.description_zh);
            if(building.sideNoteTitle_zh == ""){
                $(".building .note_title").hide();
            }else{
                $(".building .note_title").text(building.sideNoteTitle_zh);
            }
            if(building.sideNoteTitle_en == ""){
                $(".building .note_title_en").hide();
            }else{
                $(".building .note_title_en").text(building.sideNoteTitle_en);
            }
            if(building.sideNotePicture == ""){
                $(".building .note_image").hide();
            }else{
                $(".building .note_image").attr("src",building.sideNotePicture);
            }
            if(building.sideNoteAttribution == ""){
                $(".building .note_attr").hide();
            }else{
                $(".building .note_attr").html(building.sideNoteAttribution);
            }
            if(building.sideNote_zh == ""){
                $(".building .note_content").hide();
            }else{
                $(".building .note_content").text(building.sideNote_zh);
            }
            $(".building .image").css({
                backgroundImage:"url('"+building[getPic().size]+"')",
                height: getPic().height+"px"
            });
            story.animate({top:"63vh"},750,"easeOutQuint");
        }
    }
    
    /* Expand Story */
    story.on("click",function(){
        story.animate({top:"8vh"},750,"easeOutQuint");
        $(".building .caption").fadeOut(300);
    })
    
    /* Determine picture type & height */
    function getPic(){
        var back = {};
        var windowMin = (window.innerWidth > window.innerHeight)?window.innerHeight:window.innerWidth;
        var containerWidthPx = $(".container").css("width");
        var containerWidth = containerWidthPx.slice(0,containerWidthPx.indexOf("px"));
        if(windowMin <= 400){
            back.size = "picture_m";
        }else if(windowMin <= 1030){
            back.size = "picture_t";
        }else{
            back.size = "picture";
        }        
        back.height = containerWidth * 0.667;
        return back;
    }
    
    /* Reload */
    $(".btn.btn-reload").on("click",function(){
        location.reload(true)
    })
    
    /* Gradually fades */
    $(".building").on("scroll",function(){
        var distance = $(".building").scrollTop();
        var transparecy = (100-distance/2)/100;
        $(".building .image").css({opacity:transparecy});
    })
    
    /* Menu Transition */
    var nav_container = $("nav.modal");
    var nav_circle = $(".circle");
    var nav_content = $(".circle ul");
    nav_container.hide();
    nav_circle.hide();
    $(".btn.btn-menu").on("click",function(){
        nav_container.show();
        nav_circle.show();
        var radius = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
        $(".btn.btn-menu").hide();
        $(".btn.btn-close").show();
        $(".btn.btn-reload").addClass("white");
        nav_circle.animate({
            width: radius*2+"px",
            height: radius*2+"px",
            top: (22-radius)+"px",
            left: (29-radius)+"px"
        },500,"easeOutCubic");
        nav_content.animate({
            top: (-22+radius)+"px",
            left: (-29+radius)+"px"
        },500,"easeOutCubic");        
    })
    $(".btn.btn-close").on('click',function(){
        $(".btn.btn-reload").delay(250).removeClass("white");
        nav_circle.animate({
            width: "10px",
            height: "10px",
            top: "22px",
            left: "29px"
        },500,"easeOutCubic");
        nav_content.animate({
            top: "-22px",
            left: "-29px"
        },500,"easeOutCubic",function(){
            nav_circle.hide();
            nav_container.hide();
            $(".btn.btn-menu").show();
            $(".btn.btn-close").hide();
        });
    })
    
    /* Menu Item Expand */
    var navlis = $("nav li");
    var navlips = $("nav li p");
    var navlistrong = $("nav li strong");
    navlips.hide();
    navlis.on("mousedown",function(e){
        navlips.hide(250);
        navlistrong.removeClass("down");
        if($(e.currentTarget.children[2]).css("display") == "block"){
            $(e.currentTarget.children[2]).hide(250);
            $(e.currentTarget.children[0]).removeClass("down");
        }else{
            $(e.currentTarget.children[2]).show(250);
            $(e.currentTarget.children[0]).addClass("down");
        }
    })
    
    initGeolocation();
})