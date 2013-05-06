// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");

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
  
  Template.leaderboard.rendered = function(){
    // Get a reference to the canvas object
    var canvas = document.getElementById('canvas');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([ 200, -50 ]));
    // Draw the view now:
    paper.view.draw();

//		var layer = paper.project.activeLayer;
//
//		var values = {
//			count: 34,
//			points: 32
//		};
//
//		for (var i = 0; i < values.count; i++) {
//			var path = new paper.Path({
//				fillColor: i % 2 ? 'red' : 'black',
//				closed: true
//			});
//
//			var offset = new paper.Point(20 + 10 * i, 0);
//			var l = offset.length;
//			for (var j = 0; j < values.points * 2; j++) {
//				offset.angle += 360 / values.points;
//				var vector = offset.normalize(l * (j % 2 ? 0.1 : -0.1));
//				path.add(offset + vector);
//			}
//			path.smooth();
//			var placedSymbol = new paper.PlacedSymbol(path);
//			layer.insertChild(0, placedSymbol);
//		}
//    console.log(paper.view);
//		paper.view.onFrame = function (event) {
//			for (var i = 0; i < values.count; i++) {
//				var item = layer.children[i];
//				var angle = (values.count - i) * Math.sin(event.count / 128) / 10;
//				item.rotate(angle);
//			}
//		}
//		
//		// Reposition the paths whenever the window is resized:
//		paper.view.onResize = function(event) {
//			layer.position = view.center;
//		}
//    paper.view.draw();
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
