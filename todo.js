// To do list application with Search (from the Strings lab)
// You can use this code as your starting point, or continue with
// your own code.
//
window.onload = init;

var map = null;

Date.prototype.customFormat = function(formatString){
	var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhhh,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
	YY = ((YYYY=this.getFullYear())+"").slice(-2);
	MM = (M=this.getMonth()+1)<10?('0'+M):M;
	MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
	DD = (D=this.getDate())<10?('0'+D):D;
	DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substring(0,3);
	th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
	formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);
	h=(hhh=this.getHours());
	if (h==0) h=24;
	if (h>12) h-=12;
	hh = h<10?('0'+h):h;
	hhhh = h<10?('0'+hhh):hhh;
	AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
	mm=(m=this.getMinutes())<10?('0'+m):m;
	ss=(s=this.getSeconds())<10?('0'+s):s;
	return formatString.replace("#hhhh#",hhhh).replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
};
function Location(lat, long) {
	this.lat = lat;
	this.long = long;
}

function Todo(id, task, who, dueDate, lat, long) {
	this.id = id;
	this.task = task;
	this.who = who;
	this.dueDate = dueDate;
	this.done = false;
	this.lat = lat;
	this.long = long;
}
var globalLocation = [];
var todos = new Array();

function init() {
	userLocation();
	var submitButton = document.getElementById("submit");
	submitButton.onclick = getFormData;

	// get the search term and call the click handler
	var searchButton = document.getElementById("searchButton");
	searchButton.onclick = searchTodos;

	getTodoItems();
}

function getTodoItems() {
	if (localStorage) {
		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key.substring(0, 4) == "todo") {
				var item = localStorage.getItem(key);
				var todoItem = JSON.parse(item);
				todos.push(todoItem);
			}
		}
		addTodosToPage();
	}
	else {
		console.log("Error: you don't have localStorage!");
	}
}

function addTodosToPage() {
	var ul = document.getElementById("todoList");
	var listFragment = document.createDocumentFragment();
	for (var i = 0; i < todos.length; i++) {
		var todoItem = todos[i];
		var li = createNewTodo(todoItem);
		listFragment.appendChild(li);
	}
	ul.appendChild(listFragment);
}

function addTodoToPage(todoItem) {
	var ul = document.getElementById("todoList");
	var li = createNewTodo(todoItem);
	ul.appendChild(li);
	document.forms[0].reset();
}

function createNewTodo(todoItem) {
	var li = document.createElement("li");
	li.setAttribute("id", todoItem.id);

	var spanTodo = document.createElement("span");
	spanTodo.innerHTML =
		todoItem.who + " needs to " + todoItem.task + " by " + todoItem.dueDate;

	var spanDone = document.createElement("span");
	if (!todoItem.done) {
		spanDone.setAttribute("class", "notDone");
		spanDone.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	}
	else {
		spanDone.setAttribute("class", "done");
		spanDone.innerHTML = "&nbsp;&#10004;&nbsp;";
	}

	// add the click handler to update the done state
	spanDone.onclick = updateDone;

	//add the lat and long span
	var spanLocation = document.createElement("span");
	spanLocation.innerHTML = "( " + todoItem.lat + ", " + todoItem.long + ")";

	// add the delete link
	var spanDelete = document.createElement("span");
	spanDelete.setAttribute("class", "delete");
	spanDelete.innerHTML = "&nbsp;&#10007;&nbsp;";

	// add the click handler to delete
	spanDelete.onclick = deleteItem;

	var spanDays = document.createElement("span");
	var now = new Date();
	var nowMili = Date.parse(now);
	var inputDate = todoItem.dueDate;
	var inputDateMili = Date.parse(inputDate);
	var diff = inputDateMili - nowMili;
	var days = Math.floor(diff / 1000 / 60 / 60 / 24);

	if (days === 0) {
		spanDays.innerHTML = "(TODAY)";
	} else if(days < 0) {
		if (Math.abs(days) != 1) {
			spanDays.innerHTML = "(OVERDUE by " + Math.abs(days) + " days)";
		} else {
			spanDays.innerHTML = "(OVERDUE by " + Math.abs(days) + " day)";
		}
	} else if(days > 0) {
		spanDays.innerHTML = "(" + days + " days)";
	}

	li.appendChild(spanDone);
	li.appendChild(spanLocation);
	li.appendChild(spanTodo);
	li.appendChild(spanDays);
	li.appendChild(spanDelete);

	return li;
}
function userLocation() {
	//process location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(getLocation, locationError);
	} else {
		console.log("Sorry, no Gelolocation support!");
		return;
	}

	function getLocation(position) {
		var latitude = position.coords.latitude;
		//console.log(latitude);
		var longitude = position.coords.longitude;
		if (!map) {
			showMap(latitude, longitude);
		}
		addMarker(latitude, longitude);
	}

	function showMap(lat, long) {
		var googleLatLong = new google.maps.LatLng(lat, long);
		var mapOptions = {
			zoom: 12,
			center: googleLatLong,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var mapDiv = document.getElementById("map");
		map = new google.maps.Map(mapDiv, mapOptions);
		map.panTo(googleLatLong);
	}

	function addMarker(lat, long) {
		var googleLatLong = new google.maps.LatLng(lat, long);
		var markerOptions = {
			position: googleLatLong,
			map: map,
			title: "Where I'm thinking today"
		};
		var marker = new google.maps.Marker(markerOptions);
		globalLocation[0] = lat.toFixed(5);
		globalLocation[1] = long.toFixed(5);

	}

	function locationError(error) {
		var errorTypes = {
			0: "Unknown Error",
			1: "Permission denied by user",
			2: "Position not available",
			3: "Request timed out"
		};
		var errorMessage = errorTypes[error.code];
		if (error.code == 0 || error.code == 2) {
			errorMessage += " " + error.message;
		}
		console.log(errorMessage);
		alert(errorMessage);
	}

	//console.log(latObj);
}
console.log(globalLocation["lat"]);
function getFormData() {
	var task = document.getElementById("task").value;
	if (checkInputText(task, "Please enter a task")) return;

	var who = document.getElementById("who").value;
	if (checkInputText(who, "Please enter a person to do the task")) return;

	var dateStr = document.getElementById("dueDate").value;
	if (checkInputText(dateStr, "Please enter a due date")) return;
	// process date here
	var dateMillis = Date.parse(dateStr);
	var aDate = new Date(dateMillis);

	try {
		if(dateStr == null) {
			throw new Error("Not a valid format: Looking for Strings");
		} else if(dateMillis == null) {
			throw new Error("Not a valid format: Looking for Integers");
		}
	} catch (e) {
		alert(e.message);
	} finally {

		var date = aDate.customFormat( "#MMMM# #DD#, #YYYY#");
	}

	var id = (new Date()).getTime();
	var todoItem = new Todo(id, task, who, date, globalLocation[0], globalLocation[1]);
	todos.push(todoItem);
	addTodoToPage(todoItem);
	saveTodoItem(todoItem);

	// hide search results
	hideSearchResults();
}

function checkInputText(value, msg) {
	if (value == null || value == "") {
		alert(msg);
		return true;
	}
	return false;
}

function saveTodoItem(todoItem) {
	if (localStorage) {
		var key = "todo" + todoItem.id;
		var item = JSON.stringify(todoItem);
		localStorage.setItem(key, item);
	}
	else {
		console.log("Error: you don't have localStorage!");
	}
}

function updateDone(e) {
	var span = e.target;
	var id = span.parentElement.id;
	var item;
	for (var i = 0; i < todos.length; i++) {
		if (todos[i].id == id) {
			item = todos[i];
			break;
		}
	}
	if (item.done == false) {
		item.done = true;
		span.setAttribute("class", "done");
		span.innerHTML = "&nbsp;&#10004;&nbsp;";
	}
	else if (item.done == true) {
		item.done = false;
		span.setAttribute("class", "notDone");
		span.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	}
	var itemJson = JSON.stringify(item);
	var key = "todo" + id;
	localStorage.setItem(key, itemJson);
}

function deleteItem(e) {
	var span = e.target;
	var id = span.parentElement.id;

	// find and remove the item in localStorage
	var key = "todo" + id;
	localStorage.removeItem(key);

	// find and remove the item in the array
	for (var i = 0; i < todos.length; i++) {
		if (todos[i].id == id) {
			todos.splice(i, 1);
			break;
		}
	}

	// find and remove the item in the page
	var li = e.target.parentElement;
	var ul = document.getElementById("todoList");
	ul.removeChild(li);

	// hide search results
	hideSearchResults();
}

// Search
function searchTodos() {
	// new search, so clear previous results
	clearSearchResultsList();
	// get the text to search for
	var searchTerm = document.getElementById("searchTerm").value;
	var count = 0;
	// check all the todos in the list
	for (var i = 0; i < todos.length; i++) {
		var todoItem = todos[i];
		// make a regular expression to match the search term, regardless of case
		var re = new RegExp(searchTerm, "i");
		// try matching the expression with the task and the who from the to do item
		// in this case, we don't need the match results array; we just need to know
		// it exists for this to do item. If there is no match results, then the
		// result of match is null, so the "if" test will fail.
		if (todoItem.task.match(re) || todoItem.who.match(re)) {
			// if we find a match, add the to do item to the search results
			addSearchResultToPage(todoItem);
			// keep a count of the number of items we match
			count++;
		}
	}
	// if we don't match any items, display "no results" in the search results list
	if (count == 0) {
		var ul = document.getElementById("searchResultsList");
		var li = document.createElement("li");
		li.innerHTML = "No results!";
		ul.appendChild(li);
	}
	// show the search results
	showSearchResults();
}

// add a search result to the search results list in the page
function addSearchResultToPage(todoItem) {
	var ul = document.getElementById("searchResultsList");
	var li = document.createElement("li");
	li.innerHTML =
		todoItem.who + " needs to " + todoItem.task + " by " + todoItem.dueDate;
	ul.appendChild(li);
}

// clear the previous search results by removing all the children of the "searchResultsList" ul element
function clearSearchResultsList() {
	var ul = document.getElementById("searchResultsList");
	while (ul.firstChild) {
		ul.removeChild(ul.firstChild);
	}
}

// This is just a nifty trick to show/hide the search results, so we don't show anything
// unless the user's just searched. Extra credit! :-)
function hideSearchResults() {
	var div = document.getElementById("searchResults");
	div.style.display = "none";
	clearSearchResultsList();
}

function showSearchResults() {
	var div = document.getElementById("searchResults");
	div.style.display = "block";
	document.forms[0].reset();
} 