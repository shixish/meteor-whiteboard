// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

//Players = new Meteor.Collection("players");
Paths = new Meteor.Collection("paths");

function addPath(path){
  var json = path.toJSON(), type = json[0], data = json[1];
  //console.log(type, data);
  Paths.insert(data);
}

function removePath(path){
  Paths.remove(path._id);
  path.remove();
}

function updatePath(path){
  var json = path.toJSON(), type = json[0], data = json[1];
  console.log(type, data, path._id);
  Paths.update(path._id, {'$set': data });
  //path.remove();
}

if (Meteor.isClient) {
  Meteor.startup(function(){
    initialize();
  });
  
  var canvas;
  var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 10
  };
  
  var position = [150,0];
  var canvas_pos_matrix;
  
  var rendered_paths = {};
  
  function shift_canvas(point){
    console.log("shifting:", point);
    canvas_pos_matrix = new paper.Matrix();
    canvas_pos_matrix.translate(point);
    console.log("matrix:", canvas_pos_matrix);
    for (var p in paper.project.activeLayer._children){
      var path = paper.project.activeLayer._children[p];
      path.translate(canvas_pos_matrix);
      //console.log(path);
      
    }
    paper.view.draw();
  }
  
  function Menu(){
    var $menu, hidden = true;
    var dragging = false;
    
    function select_tool(t){
      //console.log('select tool:', t);
      if (tools[t]){//valid tool
        if (tool.deactivate)
          tool.deactivate();
        //console.log('old tool:', tool);
        tool = tools[t];
        //console.log('new tool:', tool);
        if (tool.activate)
          tool.activate();
      }
      $menu.hide();
      hidden = true;
    }
    
    this.init = function(){
      $menu = $('#menu');
      for (var t in tools){
        (function(tool_name){
          $('#'+tool_name, $menu).on('click', function(){
            select_tool(tool_name);
          });
        })(t);
      }
    }
    
    this.hide = function(){
      if (!hidden){
        $menu.hide();
        hidden = true;
      }
    }
    
    this.move = function(x, y){
      $menu.css({ top: y, left: x});
      if (hidden){
        $menu.show();
        hidden = false;
      }
    }
    
    this.onMouseDown = function(event){
      var e = event.event;
      // Create a new path and set its stroke color to black:
      if (e.button == 2){//right click
        this.move(e.clientX, e.clientY);
        dragging = true;
      }else{
        this.hide();
        dragging = false;
      }
    }
    
    this.onMouseDrag = function(event){
      var e = event.event;
      if (dragging)
        this.move(e.clientX, e.clientY);
    }
    
    this.onMouseUp = function(event){
      var e = event.event;
      dragging = false;
    }
  }
  
  function Draw(){
    var path;
    this.onMouseDown = function(event){
      var e = event.event;
      if ((e.button == 0) || //left click
	  (typeof(e.button) == "undefined")){ // not mouse
        path = new paper.Path({
          segments: [event.point],
          strokeColor: 'black',
          //fullySelected: true,
        });
        /*else if(tool == 'move'){
          shift_canvas(event.point);
        }*/
      }else if (path){
        path.remove();
        path = null;
      }
    }
    
    this.onMouseDrag = function(event){
      if (path){
        path.add(event.point);        
      }
    }
    
    this.onMouseUp = function(){
      if (path && path.length > 1){
        if (path.length > 1){
          path.simplify(5);
          //path.smooth();
          addPath(path);
        }
        path.remove();
      }
    }
  }
  
  function Select(){
    var segment, path;
    var movePath = false;
    this.deactivate = function(){
      if (path) path.selected = false;
      segment = path = null;
    }
    
    this.onKeyDown = function(event){
      //console.log('keydown: ', event);
      if (event.key=="delete" && path){
        //console.log(path);
        //path.remove();
        removePath(path);
      }
    }
    
    this.onMouseDown = function(event){
      var hitResult = paper.project.hitTest(event.point, hitOptions);
      var proceed = false;
      if (path) path.selected = false;
      if (hitResult){
        //console.log(hitResult);
        if (hitResult.item != path){
          path = hitResult.item;
          path.selected = true;
          segment = null;
          return;
        }else{
          path.selected = true;
        }
      }else{
        path = segment = null;
        return;
      }
      
      if (hitResult.type == 'segment'){
        segment = hitResult.segment;
        if (event.modifiers.shift) {
          segment.remove();
        }
        return;
      }else{
        segment = null;
      }
      
      if (hitResult.type == 'stroke') {
        var location = hitResult.location;
        segment = path.insert(location.index + 1, event.point);
        //path.smooth();
      }
      
      //this brings a filled area to the front...
      //if (hitResult.type == 'fill')
      //  paper.project.activeLayer.addChild(hitResult.item);
    }
    
    this.onMouseDrag = function(event){
      if (segment) {
        segment.point = event.point;
        //path.smooth();
      }
      if (movePath)
        path.position += event.delta;
    }
    
    this.onMouseUp = function(){
      if (segment){
        //console.log('segment: ', segment, path);
        updatePath(path);
      }
    }
  }
  
  function Move(){
    this.activate = function(){
      console.log('activating');
      $(canvas).addClass('move-cursor');
    }
    
    this.deactivate = function(){
      $(canvas).removeClass('move-cursor');
    }
    
    this.onMouseDown = function(event){
      var e = event.event;
      if (e.button == 0)//left click
        shift_canvas(event.point);
    }
    
    this.onMouseDrag = function(event){ }
    
    this.onMouseUp = function(){ }
    
  }
  
  var menu = new Menu();
  var tools = {draw:new Draw(), erase:null, select:new Select(), move:new Move(), note:null};
  var tool = tools['draw'];
  
  function initialize(){
    canvas = document.getElementById('canvas');
    paper.setup(canvas);
    
    menu.init();
    //shift_canvas(position);
    
    paper.tool.onMouseDown = function(event) {
      menu.onMouseDown(event);
      tool.onMouseDown(event);
    }
    document.addEventListener('contextmenu', function(event){
      event.preventDefault();
    });
    
    // While the user drags the mouse, points are added to the path
    // at the position of the mouse:
    paper.tool.onMouseDrag = function(event) {
      menu.onMouseDrag(event);
      tool.onMouseDrag(event);
    }
    
    // When the mouse is released, we simplify the path:
    paper.tool.onMouseUp = function(event) {
      menu.onMouseUp(event);
      tool.onMouseUp(event);
    }
    
    paper.tool.onKeyDown = function(event){
      if (tool.onKeyDown)
        tool.onKeyDown(event);
    }
    
    //paper.tool.onMouseMove = function(event) {
    //  //paper.project.activeLayer.selected = false;
    //  if (event.item)
    //    event.item.fullySelected = true;
    //}
    
    //Meteor.subscribe('paths', function(){
    //  //console.log('dah paths be loading', arguments, this);
    //  renderPaths();
    //});
    
    //get all of the current paths, then render them...
    Paths.find().observe({
      added: renderPaths,
      changed: renderPaths
    });
    
    //deprecated?:
    Session.set("paper_initialized", true);
    console.log('initialized');
  }
  
  //var paths = {};
  function renderPaths(obj){
    //var temp = _.extend(obj,{fullySelected: true});
    if (obj && !rendered_paths[obj._id]){//if the thing was already rendered, don't try to re-render it.
      var path = new paper.Path(obj);
      rendered_paths[obj._id] = path;
      paper.view.draw();//redraw the canvas
    }/*else{
      console.log('render the paths', obj);
    }*/
    //path.transform(canvas_pos_matrix);
  }  
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.publish("paths", function () {
    return Paths.find({});
  });
}
