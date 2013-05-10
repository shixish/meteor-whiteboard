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
  //Template.canvas.events({
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
  
  Template.whiteboard.paths = function () {
    console.log('render the paths');
    //Paths.findOne();//this tells meteor to watch for updates...
    var paths = Paths.find().fetch();
    for(var p in paths){
      new paper.Path(paths[p]);
    }
  };
  
  Template.canvas.init = function(){
    console.log('init');
    var canvas = document.getElementById('canvas');//document.createElement('canvas');
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
  }
  
  Meteor.startup(function(){
    console.log('startup');
  });
  
  Template.canvas.created = function(){
    //this.canvas = document.createElement("canvas");
    //paper.setup(this.canvas);
  }
  
  Template.canvas.rendered = function(){
    console.log('rendered')
    //console.log(this.firstNode);
    //window.t = this.firstNode;
    
    //this.firstNode.appendChild(canvas);
    //Note: use Paths.find().fetch() to check out the db.
    
    // Get a reference to the canvas object
    var canvas = this.firstNode;//document.getElementById('canvas');
    //// Create an empty project and a view for the canvas:
    paper.setup(canvas);
    //
    //var paths = Paths.find().fetch();
    //for(var p in paths){
    //  new paper.Path(paths[p]);
    //}
    //
    //var path;
    
    //var textItem = new paper.PointText({
    //  content: 'Click and drag to draw a line.',
    //  point: new paper.Point(20, 30),
    //  fillColor: 'black',
    //});
    //
    //paper.tool.onMouseDown = function(event) {
    //  // If we produced a path before, deselect it:
    //  if (path) {
    //      path.selected = false;
    //  }
    //  // Create a new path and set its stroke color to black:
    //  path = new paper.Path({
    //    segments: [event.point],
    //    strokeColor: 'black',
    //    // Select the path, so we can see its segment points:
    //    //fullySelected: true
    //  });
    //}
    //
    //// While the user drags the mouse, points are added to the path
    //// at the position of the mouse:
    //paper.tool.onMouseDrag = function(event) {
    //  path.add(event.point);
    //  // Update the content of the text item to show how many
    //  // segments it has:
    //  //textItem.content = 'Segment count: ' + path.segments.length;
    //}
    //
    //// When the mouse is released, we simplify the path:
    //paper.tool.onMouseUp = function(event) {
    //  //var segmentCount = path.segments.length;
    //  // When the mouse is released, simplify it:
    //  path.simplify(10);
    //  // Select the path, so we can see its segments:
    //  //path.fullySelected = true;
    //  //Paths.push(path.toJSON());
    //  addPath(path);
    //  //var newSegmentCount = path.segments.length;
    //  //var difference = segmentCount - newSegmentCount;
    //  //var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    //  //textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';
    //}
  }
  
  //Template.canvas.addPath = function(path){
  //  json = path.toJSON();
  //  console.log(path, json);
  //  //Players.insert({segments: json.segments, strokeColor: json.strokeColor});
  //}
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
