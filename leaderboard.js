// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
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
    //console.log(canvas);
    //// Create an empty project and a view for the canvas:
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
    Session.set("paper_initialized", true);
    console.log('initialized');
  }
  
  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
  
  //var mouse_down = false;
  //var path;
  //
  //Template.whiteboard.events({
  //  'mousedown': function(event){
  //    console.log("down");
  //    mouse_down = true;
  //    path = new paper.Path({
  //      segments: [event.point],
  //      strokeColor: 'black',
  //      //fullySelected: true
  //    });
  //  },
  //  'mouseup': function(event){
  //    console.log("up")
  //    mouse_down = false;
  //  },
  //  'mousemove': function(event){
  //    if (mouse_down)
  //      path.add(event.point);
  //  }
  //});
  
  //Template.whiteboard.events({
  //  'click': function(event){
  //    Session.set("paper_initialized", true);
  //    console.log(Session.get("paper_initialized"));
  //  },
  //});
  
  Template.whiteboard.paths = function () {
    console.log('render the paths');
    //Paths.findOne();//this tells meteor to watch for updates...
    var paths = Paths.find().fetch();
    for(var p in paths){
      new paper.Path(paths[p]);
    }
  };
  
  Template.whiteboard.paper_initialized = function(){
    return Session.get("paper_initialized");
  }
  
  Template.whiteboard.created = function(){
    Session.set("paper_initialized", false);
  }
  
  Template.whiteboard.rendered = function(){
    //Note: use Paths.find().fetch() to check out the db.
    
    // Get a reference to the canvas object
    if (!Session.get("paper_initialized")){
      initialize();
    }
    console.log('whiteboard rendered');
  }
  
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}
