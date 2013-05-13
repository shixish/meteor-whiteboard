// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

//Players = new Meteor.Collection("players");
Paths = new Meteor.Collection("paths");

function addPath(path){
  var json = path.toJSON(), type = json[0], data = json[1];
  //console.log(type, data);
  Paths.insert(data);
}

if (Meteor.isClient) {
  Meteor.startup(function(){
    console.log('startup');
    initialize();
  });
  
  var canvas;
  function initialize(){
    canvas = document.getElementById('canvas');
    paper.setup(canvas);
    
    var path;
    
    paper.tool.onMouseDown = function(event) {
      // If we produced a path before, deselect it:
      if (path) {
          path.selected = false;
      }
      // Create a new path and set its stroke color to black:
      path = new paper.Path({
        segments: [event.point],
        strokeColor: 'black',
        //fullySelected: true
      });
    }
    
    // While the user drags the mouse, points are added to the path
    // at the position of the mouse:
    paper.tool.onMouseDrag = function(event) {
      path.add(event.point);
    }
    
    // When the mouse is released, we simplify the path:
    paper.tool.onMouseUp = function(event) {
      path.simplify(10);
      addPath(path);
    }
    
    Meteor.subscribe('paths', function(){
      //console.log('dah paths be loading', arguments, this);
      renderPaths();
    });
    
    Paths.find().observe({
      added: renderPaths,
      changed: renderPaths
    });
    
    Session.set("paper_initialized", true);
    console.log('initialized');
  }
  
  //var paths = {};
  function renderPaths(obj){
    //console.log('render the paths', arguments);
    new paper.Path(obj);
  }  
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.publish("paths", function () {
    return Paths.find({});
  });
}
