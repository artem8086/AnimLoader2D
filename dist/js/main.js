'use strict';

(function(){

var Sprite;

Sprite = (function() {
  class Sprite {
    static load(loader, file) {
      var sprite;
      sprite = Sprite.cache[file];
      if (!sprite) {
        sprite = new Sprite;
        sprite.load(loader, file);
        Sprite.cache[file] = sprite;
      }
      return sprite;
    }

    load(loader, file) {
      loader.loadJson(file, (data1) => {
        this.data = data1;
      });
      return loader.loadImage(file + '.png', (texture) => {
        this.texture = texture;
      });
    }

    draw(g, frame, x, y, index = 0) {
      var data;
      data = this.data;
      if (data) {
        switch (frame.constructor) {
          case Object:
            g.drawImage(this.texture, frame.x, frame.y, frame.w, frame.h, x + frame.cx, y + frame.cy, frame.w, frame.h);
            break;
          case Array:
            this.draw(g, frame[Math.floor(index) % frame.lenght], x, y);
            break;
          case String:
            this.draw(g, data[frame], x, y, index);
        }
      }
      return this;
    }

  }

  Sprite.cache = [];

  return Sprite;

}).call(undefined);

var Animation;
var AnimationData;
var getTime;
var makeEaseInOut;
var makeEaseOut;
var setTimingFunction;
var timingFunctions;

AnimationData = (function() {
  class AnimationData {
    static load(loader, file) {
      var animData;
      animData = AnimationData.cache[file];
      if (!animData) {
        animData = new AnimationData;
        animData.load(loader, file);
        AnimationData.cache[file] = animData;
      }
      return animData;
    }

    load(loader, file) {
      return loader.loadJson(file, (data) => {
        var key, results, value;
        if (data) {
          results = [];
          for (key in data) {
            value = data[key];
            results.push(this[key] = value);
          }
          return results;
        }
      });
    }

  }

  AnimationData.cache = [];

  return AnimationData;

}).call(undefined);

getTime = function() {
  return new Date().getTime() / 1000;
};

makeEaseOut = function(timing) {
  return function(time) {
    return 1 - timing(1 - time);
  };
};

makeEaseInOut = function(timing) {
  return function(time) {
    if (time < 0.5) {
      return timing(2 * time) / 2;
    } else {
      return (2 - timing(2 * (1 - time))) / 2;
    }
  };
};

setTimingFunction = function(name, timing) {
  timingFunctions[name] = timing;
  timingFunctions[name + 'EaseOut'] = makeEaseOut(timing);
  return timingFunctions[name + 'EaseInOut'] = makeEaseInOut(timing);
};

timingFunctions = {
  linear: function(time) {
    return time;
  },
  easeOut: function(time) {
    return 1 - time;
  },
  easeInOut: function(time) {
    if (time < 0.5) {
      return time * 2;
    } else {
      return 2 - time * 2;
    }
  }
};

setTimingFunction('quad', function(time) {
  return time * time;
});

setTimingFunction('circle', function(time) {
  return 1 - Math.sin(Math.acos(time));
});

setTimingFunction('bounce', function(time) {
  var a, b;
  a = 0;
  b = 1;
  while (true) {
    if (time >= (7 - 4 * a) / 11) {
      return -Math.pow((11 - 6 * a - 11 * time) / 4, 2) + Math.pow(b, 2);
    }
    a += b;
    b /= 2;
  }
});

Animation = (function() {
  class Animation {
    reset() {
      this.startTime = getTime();
      this.deltaTime = 0;
      return this;
    }

    set(name, no_reset = false, data = this.data) {
      var anim;
      anim = data != null ? data[name] : void 0;
      if (!no_reset) {
        this.reset();
      }
      if (anim) {
        this.duration = anim.duration || 0;
        this.frame = anim.frames;
      } else {
        this.duration = 0;
        this.frame = null;
      }
      return this;
    }

    play(time) {
      var delta, duration;
      time = time || getTime();
      this.deltaTime = delta = (time - this.startTime) * this.scale;
      duration = this.duration;
      if (!duration) {
        return false;
      }
      if (delta > duration) {
        if (this.loop) {
          this.deltaTime %= duration;
        } else {
          return false;
        }
      }
      return true;
    }

    animate(node, nodePath = node.nodePath, nodeName = node.nodeName) {
      var delta, frame, i, len, name, point, prop, props, propsUsed, ref, ref1, tFunc, time, timestops, toVal;
      if (frame = this.frame) {
        timestops = frame[nodePath] || frame[nodeName];
        if (timestops) {
          delta = this.deltaTime;
          props = Animation.props;
          propsUsed = Animation.propsUsed;
          for (i = 0, len = timestops.length; i < len; i++) {
            point = timestops[i];
            if (delta >= point.end) {
              ref = point.to;
              for (name in ref) {
                toVal = ref[name];
                if (!propsUsed[name]) {
                  props[name] = node[name];
                  propsUsed[name] = true;
                }
                node[name] = toVal;
              }
            } else if (delta >= point.start) {
              if (point.func) {
                tFunc = timingFunctions[point.func];
              } else {
                tFunc = timingFunctions.linear;
              }
              ref1 = point.to;
              
              for (name in ref1) {
                toVal = ref1[name];
                prop = node[name];
                if (!propsUsed[name]) {
                  props[name] = prop;
                  propsUsed[name] = true;
                }
                prop || (prop = 0);
                if (toVal.constructor === Number) {
                  time = tFunc((delta - point.start) / (point.end - point.start));
                  node[name] = (toVal - prop) * time + prop;
                } else {
                  node[name] = toVal;
                }
              }
            }
          }
        }
      }
      return this;
    }

    reciveProps(node) {
      var name, props, propsUsed, use;
      props = Animation.props;
      propsUsed = Animation.propsUsed;
      for (name in propsUsed) {
        use = propsUsed[name];
        if (use) {
          node[name] = props[name];
          delete propsUsed[name];
        }
      }
      return this;
    }

    createWorkFrame() {
      this.loop = false;
      this.frame = {
        work: [
          {
            start: 0,
            end: 0,
            to: {}
          }
        ]
      };
      return this;
    }

    resetWork() {
      var name, propsUsed, use;
      propsUsed = Animation.propsUsed;
      for (name in propsUsed) {
        use = propsUsed[name];
        if (use) {
          propsUsed[name] = false;
        }
      }
      return this;
    }

    clearWork() {
      var _, aObj, name, propsUsed, to;
      aObj = this.frame.work[0];
      aObj.start = aObj.end = 0;
      to = (function() {
        var results;
        results = [];
        for (name in to) {
          _ = to[name];
          results.push(delete to[name]);
        }
        return results;
      })();
      return this;
    }

    animateProps(props, duration, func) {
      var aObj, name, prop, to;
      this.duration = duration;
      aObj = this.frame.work[0];
      aObj.end = duration;
      aObj.func = func;
      to = aObj.to;
      for (name in props) {
        prop = props[name];
        to[name] = prop;
      }
      this.reset();
      return this;
    }

  }

  Animation.getTime = getTime;

  Animation.prototype.loop = true;

  Animation.prototype.startTime = 0;

  Animation.prototype.duration = 0;

  Animation.prototype.deltaTime = 0;

  Animation.prototype.scale = 1;

  Animation.props = [];

  Animation.propsUsed = [];

  return Animation;

}).call(undefined);

var Model;
var ModelData;
var drawNode;
var drawPart;
var drawPartType;
var drawTypeObj;
var initStyle;
var setDrawStyle;
var styleTypeFunc;
var transform;
var transformVert;
var trsfObj;

ModelData = (function() {
  class ModelData {
    static load(loader, file) {
      var model;
      model = ModelData.cache[file];
      if (!model) {
        model = new ModelData;
        model.load(loader, file);
        ModelData.cache[file] = model;
      }
      return model;
    }

    load(loader, file) {
      return loader.loadJson(file, (data) => {
        return this.loadData(loader, data);
      });
    }

    loadData(loader, data) {
      var image, imagesData, key, model, modelsData, nodesLoad, sprite, spritesData, value;
      if (data) {
        for (key in data) {
          value = data[key];
          this[key] = value;
        }
        if (this.images) {
          imagesData = this.images;
          this.images = [];
          for (key in imagesData) {
            image = imagesData[key];
            this.images[key] = loader.loadImage(image);
          }
        }
        if (this.sprites) {
          spritesData = this.sprites;
          this.sprites = [];
          for (key in spritesData) {
            sprite = spritesData[key];
            this.sprites[key] = Sprite.load(loader, sprite);
          }
        }
        if (this.models) {
          modelsData = this.models;
          this.models = [];
          for (key in modelsData) {
            model = modelsData[key];
            this.models[key] = typeof model === 'string' ? ModelData.load(loader, model) : this.loadData.call(new ModelData, loader, model);
          }
          nodesLoad = function(nodes, nodePath = '') {
            var name, node, results;
            results = [];
            for (name in nodes) {
              node = nodes[name];
              node.nodePath = nodePath + name;
              node.nodeName = '@' + name;
              if (node.before) {
                nodesLoad(node.before, node.nodePath + '<');
              }
              if (node.after) {
                results.push(nodesLoad(node.after, node.nodePath + '>'));
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
          if (this.bones) {
            nodesLoad(this.bones);
          }
        }
      }
      return this;
    }

  }

  ModelData.cache = [];

  return ModelData;

}).call(undefined);

drawTypeObj = {
  line: function(g) {
    g.moveTo(this.x1 || 0, this.y1 || 0);
    g.lineTo(this.x2 || 0, this.y2 || 0);
    return this;
  },
  rect: function(g) {
    g.rect(this.x || 0, this.y || 0, this.width || 1, this.height || 1);
    return this;
  },
  rectRound: function(g) {
    var h, r, w, x, y;
    this.noClose = false;
    x = this.x || 0;
    y = this.y || 0;
    w = this.width;
    h = this.height;
    r = this.radius;
    if (w < 2 * r) {
      r = w / 2;
    }
    if (h < 2 * r) {
      r = h / 2;
    }
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    return this;
  },
  arc: function(g) {
    g.arc(this.x || 0, this.y || 0, this.radius, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  },
  elipse: function(g) {
    g.ellipse(this.x || 0, this.y || 0, this.rx, this.ry, (this.rotation || 0) * Math.PI / 180, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  },
  path: function(g) {
    var draw, x, y;
    x = this.x || 0;
    y = this.y || 0;
    if (typeof this.path === 'string') {
      this.path = new Path2D(this.path);
    }
    
    this.noClose = true;
    g.translate(x, y);
    draw = this.draw || 'f&s';
    if (draw === 'f' || draw === 'f&s') {
      g.fill(this.path);
    }
    if (draw === 's' || draw === 'f&s') {
      g.stroke(this.path);
    }
    return this;
  },
  node: function(g, model, opacity, data) {
    var j, len, node, nodes, path, ref, root, tData;
    this.noClose = this.draw = true;
    // Save current model data
    tData = model.data;
    // Select model
    data = data || ((ref = tData.models) != null ? ref[this.model] : void 0);
    if (data) {
      model.data = data;
      nodes = data.bones;
    } else {
      nodes = model.data.bones;
    }
    if (nodes) {
      // Select node in model
      node = this.node;
      if (typeof node === 'string') {
        node = nodes[node];
      } else {
        root = nodes;
        for (j = 0, len = node.length; j < len; j++) {
          path = node[j];
          root = root[path];
        }
        node = root;
      }
      if (node) {
        g.translate(this.x || 0, this.y || 0);
        drawNode.call(node, g, model, opacity);
      }
    }
    // Recive model data
    model.data = tData;
    return this;
  },
  attach: function(g, model, opacity) {
    var data;
    data = model.attachment[this.attach];
    if (data) {
      drawTypeObj.node.call(this, g, model, opacity, data);
    }
    return this;
  },
  image: function(g, model) {
    var image;
    this.noClose = this.draw = true;
    image = model.data.images[this.image];
    if (this.width || this.height) {
      g.drawImage(image, this.x || 0, this.y || 0, this.width, this.height);
    } else {
      g.drawImage(image, this.x || 0, this.y || 0);
    }
    return this;
  },
  sprite: function(g, model) {
    var sprite;
    this.noClose = this.draw = true;
    sprite = this.sprite;
    if (sprite.constructor === String) {
      this.sprite = sprite = model.data.sprites[sprite];
    }
    sprite.draw(g, this.frame, this.x || 0, this.y || 0, this.index);
    return this;
  },
  text: function(g) {
    var draw;
    if (this.draw !== true) {
      this.drawText = this.draw;
    }
    draw = this.drawText;
    this.noClose = this.draw = true;
    
    if (this.font) {
      g.font = this.font;
    }
    if (this.textAlign) {
      g.textAlign = this.textAlign;
    }
    if (this.textBaseline !== null) {
      g.textBaseline = this.textBaseline;
    }
    if (this.direction) {
      g.direction = this.direction;
    }
    
    if (draw === 'f' || draw === 'f&s') {
      g.fillText(this.text, this.x || 0, this.y || 0, this.maxWidth);
    }
    if (draw === 's' || draw === 'f&s') {
      g.strokeText(this.text, this.x || 0, this.y || 0, this.maxWidth);
    }
    return this;
  }
};

styleTypeFunc = {
  linear: function(g) {
    var colorStop, gradient, j, len, ref;
    gradient = g.createLinearGradient(this.x0 || 0, this.y0 || 0, this.x1 || 0, this.y1 || 0);
    ref = this.colorStops;
    for (j = 0, len = ref.length; j < len; j++) {
      colorStop = ref[j];
      gradient.addColorStop(colorStop.pos || 0, colorStop.color);
    }
    return gradient;
  },
  radial: function(g) {
    var colorStop, gradient, j, len, ref;
    gradient = g.createRadialGradient(this.x0 || 0, this.y0 || 0, this.r0 || 0, this.x1 || 0, this.y1 || 0, this.r1 || 0);
    ref = this.colorStops;
    for (j = 0, len = ref.length; j < len; j++) {
      colorStop = ref[j];
      gradient.addColorStop(colorStop.pos || 0, colorStop.color);
    }
    return gradient;
  },
  pattern: function(g, model) {
    var image;
    image = model.data.images[this.image];
    return g.createPattern(image, this.repetition || "repeat");
  }
};

initStyle = function(g, model, style) {
  var ref;
  return (ref = styleTypeFunc[style.type]) != null ? ref.call(style, g, model) : void 0;
};

setDrawStyle = function(g, model) {
  var fill, stroke;
  stroke = this.stroke;
  if (stroke) {
    if (stroke.constructor === Object) {
      this.stroke = initStyle(g, model, stroke);
    }
    g.strokeStyle = this.stroke;
  }
  fill = this.fill;
  if (fill) {
    if (fill.constructor === Object) {
      this.fill = initStyle(g, model, fill);
    }
    g.fillStyle = this.fill;
  }
  if (this.lineWidth !== null) {
    g.lineWidth = this.lineWidth;
  }
  if (this.lineCap !== null) {
    g.lineCap = this.lineCap;
  }
  if (this.lineJoin) {
    g.lineJoin = this.lineJoin;
  }
  if (this.lineDashOffset !== null) {
    g.lineDashOffset = this.lineDashOffset;
  }
  return this;
};

drawNode = function(g, model, opacity) {
  var draw, key, node, ref, ref1, ref2;
  g.save();
  model.animation.animate(this);
  g.transform(this.scaleX || 1, this.skewY || 0, this.skewX || 0, this.scaleY || 1, this.origX || 0, this.origY || 0);
  if (this.angle) {
    g.rotate(this.angle * Math.PI / 180);
  }
  setDrawStyle.call(this, g, model);
  // Shadows
  if (this.noShadow) {
    g.shadowBlur = 0;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = 0;
  }
  if (this.shadowBlur !== null) {
    g.shadowBlur = this.shadowBlur;
  }
  if (this.shadowColor !== null) {
    g.shadowColor = this.shadowColor;
  }
  if (this.shadowOffsetX !== null) {
    g.shadowOffsetX = this.shadowOffsetX;
  }
  if (this.shadowOffsetY !== null) {
    g.shadowOffsetY = this.shadowOffsetY;
  }
  g.globalAlpha = opacity * (this.opacity === null ? 1 : this.opacity);
  if (this.before) {
    model.animation.reciveProps(this);
    ref = this.before;
    
    for (key in ref) {
      node = ref[key];
      if (!node.hide) {
        drawNode.call(node, g, model, opacity);
      }
    }
    
    model.animation.animate(this);
  }
  g.beginPath();
  if ((ref1 = drawTypeObj[this.type]) != null) {
    ref1.call(this, g, model, opacity);
  }
  if (!this.noClose) {
    g.closePath();
  }
  draw = this.draw || 'f&s';
  if (draw === 'f' || draw === 'f&s') {
    g.fill();
  }
  if (draw === 's' || draw === 'f&s') {
    g.stroke();
  }
  if (this.clip) {
    g.clip();
  }
  model.animation.reciveProps(this);
  if (this.after) {
    ref2 = this.after;
    for (key in ref2) {
      node = ref2[key];
      if (!node.hide) {
        drawNode.call(node, g, model, opacity);
      }
    }
  }
  if (Model.drawOrigin) {
    g.fillStyle = '#f00';
    g.shadowBlur = 0;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = 0;
    g.fillRect(-2, -2, 4, 4);
  }
  g.restore();
  return this;
};

drawPartType = {
  poly: function(g, verts, camera, model) {
    var i, j, l, ref, v, x, xc, y, yc, z, zt;
    v = verts[this.verts[0]];
    xc = camera.x;
    yc = camera.y;
    zt = camera.z;
    z = (v.z || 1) * zt;
    x = ((v.x || 0) + xc) * z;
    y = ((v.y || 0) + yc) * z;
    g.moveTo(x, y);
    l = this.verts.length - 1;
    for (i = j = 1, ref = l; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
      v = verts[this.verts[i]];
      z = (v.z || 1) * zt;
      x = ((v.x || 0) + xc) * z;
      y = ((v.y || 0) + yc) * z;
      g.lineTo(x, y);
    }
    return this;
  },
  part: function(g, verts, camera, model, opacity) {
    var c, data, face, j, len, part, parts, ref, ref1, tData, tParts, v;
    this.noClose = this.draw = true;
    // Save model data
    tData = model.data;
    // Select model
    data = (ref = tData.models) != null ? ref[this.model] : void 0;
    if (data) {
      model.data = data;
      parts = data.parts;
    } else {
      parts = model.data.parts;
    }
    if (parts) {
      v = verts[this.vert];
      c = {
        x: camera.x + (v.x || 0),
        y: camera.y + (v.y || 0),
        z: camera.z * (v.z || 1)
      };
      part = parts[this.part];
      if (part) {
        tParts = model.parts;
        model.parts = parts;
        ref1 = part.faces;
        for (j = 0, len = ref1.length; j < len; j++) {
          face = ref1[j];
          drawPart.call(face, g, model, c, opacity);
        }
        model.parts = tParts;
      }
    }
    model.data = tData;
    return this;
  },
  node: function(g, verts, camera, model, opacity) {
    transformVert(verts[this.vert], camera).apply(g);
    drawNode.call(this, g, model, opacity);
    return this;
  },
  attach: function(g, model, opacity) {
    var data;
    transformVert(verts[this.vert], camera).apply(g);
    data = model.attachment[this.attach];
    if (data) {
      drawTypeObj.node.call(this, g, model, opacity, data);
    }
    return this;
  },
  elipse: function(g, verts, camera) {
    var rx, ry, v, x1, x2, y1, y2;
    v = transformVert(verts[this.vert1], camera);
    x1 = v.x;
    y1 = v.y;
    v = transformVert(verts[this.vert2], camera);
    x2 = v.x;
    y2 = v.y;
    rx = (x2 - x1) / 2;
    ry = (y2 - y1) / 2;
    g.ellipse(x1 + rx, y1 + ry, rx, ry, (this.rotation || 0) * Math.PI / 180, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  }
};

drawPart = function(g, model, camera, opacity) {
  var draw, ref, stroke;
  g.save();
  stroke = this.stroke;
  setDrawStyle.call(this, g, model);
  g.globalAlpha = opacity * (this.opacity === null ? 1 : this.opacity);
  g.beginPath();
  if ((ref = drawPartType[this.type || 'poly']) != null) {
    ref.call(this, g, model.data.verts, camera, model, opacity);
  }
  if (!this.noClose) {
    g.closePath();
  }
  draw = this.draw || 'f&s';
  if (draw === 'f' || draw === 'f&s') {
    g.fill();
  }
  if (draw === 's' || draw === 'f&s') {
    g.stroke();
  }
  g.restore();
  return this;
};

trsfObj = {
  x: 0,
  y: 0,
  scale: 1,
  apply: function(g) {
    return g.transform(this.scale, 0, 0, this.scale, this.x, this.y);
  }
};

Model = class Model {
  static transform(x, y, z, camera) {
    z = camera.z * z;
    trsfObj.x = (x + camera.x) * z;
    trsfObj.y = (y + camera.y) * z;
    trsfObj.scale = z;
    return trsfObj;
  }

  constructor(data1) {
    this.data = data1;
    this.attachment = [];
    this.animation = new Animation;
  }

  setData(data1) {
    this.data = data1;
  }

  draw2D(g, opacity = 1) {
    var bones, key, node, ref, results;
    if (bones = (ref = this.data) != null ? ref.bones : void 0) {
      results = [];
      for (key in bones) {
        node = bones[key];
        if (!node.hide) {
          results.push(drawNode.call(node, g, this, opacity));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }

  drawNode(g, node, opacity = 1) {
    var bones, ref;
    if (bones = (ref = this.data) != null ? ref.bones : void 0) {
      node = bones[node];
      if (node) {
        return drawNode.call(node, g, this, opacity);
      }
    }
  }

  drawPart(g, part, camera, opacity = 1) {
    var face, j, len, ref, results;
    ref = part.faces;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      face = ref[j];
      results.push(drawPart.call(face, g, this, camera, opacity));
    }
    return results;
  }

  drawParts(g, camera, opacity = 1) {
    var _, face, part, parts, ref, results;
    if (parts = (ref = this.data) != null ? ref.parts : void 0) {
      results = [];
      for (_ in parts) {
        part = parts[_];
        if (!part.hide) {
          results.push((function() {
            var j, len, ref1, results1;
            ref1 = part.faces;
            results1 = [];
            for (j = 0, len = ref1.length; j < len; j++) {
              face = ref1[j];
              results1.push(drawPart.call(face, g, this, camera, opacity));
            }
            return results1;
          }).call(this));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }

};

transform = Model.transform;

transformVert = function(v, camera) {
  return transform(v.x || 0, v.y || 0, v.z || 1, camera);
};

var EventEmmiter;

EventEmmiter = (function() {
  class EventEmmiter {
    on(event, callback) {
      var handler;
      if (callback) {
        handler = this.handlers[event];
        if (!handler) {
          this.handlers[event] = handler = [];
        }
        if (handler.indexOf(callback) < 0) {
          handler.push(callback);
        }
      }
      return this;
    }

    off(event, callback) {
      var handler, index;
      if (callback) {
        handler = this.handlers[event];
        if (handler) {
          index = handler.indexOf(callback);
          if (index >= 0) {
            handler.splice(index, 1);
          }
        }
      }
      return this;
    }

    trigger(event, args) {
      var callback, handler, i, len;
      handler = this.handlers[event];
      if (handler) {
        for (i = 0, len = handler.length; i < len; i++) {
          callback = handler[i];
          callback.apply(this, args);
        }
      }
      return this;
    }

    removeEvent(event) {
      delete this.handlers[event];
      return this;
    }

  }

  EventEmmiter.prototype.handlers = [];

  return EventEmmiter;

}).call(undefined);

var Loader;

Loader = (function() {
  var allResLoader, loadResNumber;

  // Events:
  // 'changepercent' trigger when some resorces loaded
  // 'load' trigger when all resorces loaded
  class Loader extends EventEmmiter {
    reset() {
      return loadResNumber = allResLoader = 0;
    }

    getPercent() {
      return 1 - (allResLoader !== 0 ? loadResNumber / allResLoader : 0);
    }

    updatePercent() {
      return this.trigger('changepercent', [this.getPercent()]);
    }

    load(callback) {
      var _this;
      _this = this;
      loadResNumber++;
      allResLoader++;
      return function() {        // @updatePercent()
        if (callback != null) {
          callback.apply(_this, arguments);
        }
        loadResNumber--;
        if (loadResNumber <= 0) {
          _this.reset();
          _this.trigger('load');
        }
        return _this.updatePercent();
      };
    }

    loadJson(file, callback) {
      callback = this.load(callback);
      return $.getJSON(file + '.json').done(callback).fail(function() {
        return callback(null);
      });
    }

    loadImage(file, callback) {
      var img;
      callback = this.load(callback);
      img = new Image;
      img.onload = function() {
        return callback(img);
      };
      img.src = file;
      return img;
    }

  }

  loadResNumber = 0;

  allResLoader = 0;

  return Loader;

}).call(undefined);

$(document).ready(function() {
  var $canvas, animationFrame, camera, cancelFullscreen, canvas, context, fullscreen, launchFullScreen, loader, mRefreshInterval, model, modelData, modelFile, modelRefresh, moveCamera, oldMouseX, oldMouseY, render, resize;
  $canvas = $('#canvas');
  canvas = $canvas.get(0);
  context = canvas.getContext('2d', {
    alpha: false
  });
  modelFile = 'models/banny';
  loader = new Loader;
  model = new Model;
  modelData = new ModelData;
  animationFrame = null;
  camera = {
    canvas: canvas,
    g: context,
    x: 0,
    y: 0,
    z: 1
  };
  resize = function() {
    canvas.width = $(window).width();
    return canvas.height = $(window).height() - $('#canvas').offset().top;
  };
  resize();
  $(window).on('resize', resize);
  modelRefresh = function() {
    //		for key, _ of modelData
    //			delete modelData[key]
    return modelData.load(loader, modelFile);
  };
  loader.on('load', function() {
    var _, anim, container, ref;
    model.setData(modelData);
    if (model.animation.data) {
      // model.animation.set 'test'

      container = $('.js-frame-container');
      container.empty();
      ref = model.animation.data;
      for (anim in ref) {
        _ = ref[anim];
        container.append(`<a class='dropdown-item js-frame-select' href='#'>${anim}</a>`);
      }
      model.animation.set(animationFrame);
      return $('.js-frame-select').click(function() {
        animationFrame = $(this).text();
        return model.animation.set(animationFrame);
      });
    }
  });
  console.log(model);
  mRefreshInterval = setInterval(modelRefresh, 500);
  render = function(delta) {
    var cx, cy, h, w;
    context.save();
    w = canvas.width;
    h = canvas.height;
    cx = w / 2;
    cy = h / 2;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, w, h);
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = '#f00';
    context.moveTo(cx, 0);
    context.lineTo(cx, h);
    context.moveTo(0, cy);
    context.lineTo(w, cy);
    context.stroke();
    context.translate(cx, cy);
    model.animation.play();
    model.drawParts(context, camera);
    Model.transform(0, 0, 1, camera).apply(context);
    model.draw2D(context);
    context.restore();
    
    return window.requestAnimationFrame(render);
  };
  render(0);
  oldMouseX = oldMouseY = 0;
  moveCamera = function(e) {
    camera.x += e.clientX - oldMouseX;
    camera.y += e.clientY - oldMouseY;
    oldMouseX = e.clientX;
    return oldMouseY = e.clientY;
  };
  $canvas.on('mousedown', function(e) {
    oldMouseX = e.clientX;
    oldMouseY = e.clientY;
    return $canvas.on('mousemove', moveCamera);
  });
  $canvas.on('touchstart', function(e) {
    oldMouseX = e.touches[0].clientX;
    return oldMouseY = e.touches[0].clientY;
  });
  $canvas.on('touchmove', function(e) {
    return moveCamera(e.touches[0]);
  });
  $canvas.on('mouseup', function() {
    return $canvas.off('mousemove', moveCamera);
  });
  $('.js-z-number').val(camera.z).on('input change', function() {
    return camera.z = +$(this).val();
  });
  $('.js-model-select').click(function() {
    modelData = new ModelData;
    return modelFile = $(this).data('file');
  });
  $('.js-anim-select').click(function() {
    var file;
    file = $(this).data('file');
    model.animation.data = new AnimationData;
    model.animation.data.load(loader, file);
    $('.js-anim-refresh').data('file', file);
    
    $('.js-refresh-model').prop('checked', false);
    return clearInterval(mRefreshInterval);
  });
  Model.drawOrigin = true;
  $('.js-draw-origin').change(function() {
    return Model.drawOrigin = $(this).prop('checked');
  });
  $('.js-refresh-model').change(function() {
    if ($(this).prop('checked')) {
      return mRefreshInterval = setInterval(modelRefresh, 500);
    } else {
      return clearInterval(mRefreshInterval);
    }
  });
  $('.js-reset-pos').click(function() {
    camera.x = camera.y = 0;
    camera.z = 1;
    return $('.js-z-number').val('1');
  });
  fullscreen = false;
  $('.js-full-screen').click(function() {
    if (fullscreen) {
      cancelFullscreen();
    } else {
      launchFullScreen(document.documentElement);
    }
    return fullscreen = !fullscreen;
  });
  launchFullScreen = function(element) {
    if (element.requestFullScreen) {
      return element.requestFullScreen();
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      return element.webkitRequestFullScreen();
    }
  };
  return cancelFullscreen = function() {
    if (document.cancelFullScreen) {
      return document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      return document.webkitCancelFullScreen();
    }
  };
});

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3ByaXRlLmNvZmZlZSIsImFuaW1hdGlvbi5jb2ZmZWUiLCJtb2RlbC5jb2ZmZWUiLCJldmVudHMuY29mZmVlIiwibG9hZGVyLmNvZmZlZSIsIm1haW4uY29mZmVlIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFNwcml0ZVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRzcHJpdGUgPSBTcHJpdGUuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBzcHJpdGVcclxuXHRcdFx0c3ByaXRlID0gbmV3IFNwcml0ZVxyXG5cdFx0XHRzcHJpdGUubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0U3ByaXRlLmNhY2hlW2ZpbGVdID0gc3ByaXRlXHJcblx0XHRzcHJpdGVcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoQGRhdGEpID0+XHJcblx0XHRsb2FkZXIubG9hZEltYWdlIGZpbGUgKyAnLnBuZycsIChAdGV4dHVyZSkgPT5cclxuXHJcblx0ZHJhdzogKGcsIGZyYW1lLCB4LCB5LCBpbmRleCA9IDApIC0+XHJcblx0XHRkYXRhID0gQGRhdGFcclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0c3dpdGNoIGZyYW1lLmNvbnN0cnVjdG9yXHJcblx0XHRcdFx0d2hlbiBPYmplY3RcclxuXHRcdFx0XHRcdGcuZHJhd0ltYWdlIEB0ZXh0dXJlLFxyXG5cdFx0XHRcdFx0XHRmcmFtZS54LCBmcmFtZS55LCBmcmFtZS53LCBmcmFtZS5oLFxyXG5cdFx0XHRcdFx0XHR4ICsgZnJhbWUuY3gsIHkgKyBmcmFtZS5jeSwgZnJhbWUudywgZnJhbWUuaFxyXG5cdFx0XHRcdHdoZW4gQXJyYXlcclxuXHRcdFx0XHRcdEBkcmF3IGcsIGZyYW1lW01hdGguZmxvb3IoaW5kZXgpICUgZnJhbWUubGVuZ2h0XSwgeCwgeVxyXG5cdFx0XHRcdHdoZW4gU3RyaW5nXHJcblx0XHRcdFx0XHRAZHJhdyBnLCBkYXRhW2ZyYW1lXSwgeCwgeSwgaW5kZXhcclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IFNwcml0ZSB9IiwiY2xhc3MgQW5pbWF0aW9uRGF0YVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRhbmltRGF0YSA9IEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBhbmltRGF0YVxyXG5cdFx0XHRhbmltRGF0YSA9IG5ldyBBbmltYXRpb25EYXRhXHJcblx0XHRcdGFuaW1EYXRhLmxvYWQgbG9hZGVyLCBmaWxlXHJcblx0XHRcdEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV0gPSBhbmltRGF0YVxyXG5cdFx0YW5pbURhdGFcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoZGF0YSkgPT5cclxuXHRcdFx0aWYgZGF0YVxyXG5cdFx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlXHJcblxyXG5nZXRUaW1lID0gLT5cclxuXHRuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDBcclxuXHJcbm1ha2VFYXNlT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdDEgLSB0aW1pbmcoMSAtIHRpbWUpXHJcblxyXG5tYWtlRWFzZUluT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdGlmIHRpbWUgPCAwLjVcclxuXHRcdFx0dGltaW5nKDIgKiB0aW1lKSAvIDJcclxuXHRcdGVsc2VcclxuXHRcdFx0KDIgLSB0aW1pbmcoMiAqICgxIC0gdGltZSkpKSAvIDJcclxuXHJcblxyXG5zZXRUaW1pbmdGdW5jdGlvbiA9IChuYW1lLCB0aW1pbmcpIC0+XHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWVdID0gdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZU91dCddID0gbWFrZUVhc2VPdXQgdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZUluT3V0J10gPSBtYWtlRWFzZUluT3V0IHRpbWluZ1xyXG5cclxudGltaW5nRnVuY3Rpb25zID1cclxuXHRsaW5lYXI6ICh0aW1lKSAtPlxyXG5cdFx0dGltZVxyXG5cclxuXHRlYXNlT3V0OiAodGltZSkgLT5cclxuXHRcdDEgLSB0aW1lXHJcblxyXG5cdGVhc2VJbk91dDogKHRpbWUpIC0+XHJcblx0XHRpZiB0aW1lIDwgMC41XHJcblx0XHRcdHRpbWUgKiAyXHJcblx0XHRlbHNlXHJcblx0XHRcdDIgLSB0aW1lICogMlxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ3F1YWQnLCAodGltZSkgLT5cclxuXHR0aW1lICogdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2NpcmNsZScsICh0aW1lKSAtPlxyXG5cdDEgLSBNYXRoLnNpbiBNYXRoLmFjb3MgdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2JvdW5jZScsICh0aW1lKSAtPlxyXG5cdGEgPSAwXHJcblx0YiA9IDFcclxuXHR3aGlsZSB0cnVlXHJcblx0XHRpZiB0aW1lID49ICg3IC0gNCAqIGEpIC8gMTFcclxuXHRcdFx0cmV0dXJuIC1NYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogdGltZSkgLyA0LCAyKSArIE1hdGgucG93KGIsIDIpXHJcblx0XHRhICs9IGJcclxuXHRcdGIgLz0gMlxyXG5cclxuY2xhc3MgQW5pbWF0aW9uXHJcblx0QGdldFRpbWU6IGdldFRpbWVcclxuXHJcblx0bG9vcDogdHJ1ZVxyXG5cdHN0YXJ0VGltZTogMFxyXG5cdGR1cmF0aW9uOiAwXHJcblx0ZGVsdGFUaW1lOiAwXHJcblx0c2NhbGU6IDFcclxuXHJcblx0QHByb3BzOiBbXVxyXG5cdEBwcm9wc1VzZWQ6IFtdXHJcblxyXG5cdHJlc2V0OiAtPlxyXG5cdFx0QHN0YXJ0VGltZSA9IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IDBcclxuXHRcdHRoaXNcclxuXHJcblx0c2V0OiAobmFtZSwgbm9fcmVzZXQgPSBmYWxzZSwgZGF0YSA9IEBkYXRhKSAtPlxyXG5cdFx0YW5pbSA9IGRhdGE/W25hbWVdXHJcblx0XHRAcmVzZXQoKSB1bmxlc3Mgbm9fcmVzZXRcclxuXHRcdGlmIGFuaW1cclxuXHRcdFx0QGR1cmF0aW9uID0gYW5pbS5kdXJhdGlvbiB8fCAwXHJcblx0XHRcdEBmcmFtZSA9IGFuaW0uZnJhbWVzXHJcblx0XHRlbHNlXHJcblx0XHRcdEBkdXJhdGlvbiA9IDBcclxuXHRcdFx0QGZyYW1lID0gbnVsbFxyXG5cdFx0dGhpc1xyXG5cclxuXHRwbGF5OiAodGltZSkgLT5cclxuXHRcdHRpbWUgPSB0aW1lIHx8IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IGRlbHRhID0gKHRpbWUgLSBAc3RhcnRUaW1lKSAqIEBzY2FsZVxyXG5cdFx0ZHVyYXRpb24gPSBAZHVyYXRpb25cclxuXHRcdHVubGVzcyBkdXJhdGlvblxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdGlmIGRlbHRhID4gZHVyYXRpb25cclxuXHRcdFx0aWYgQGxvb3BcclxuXHRcdFx0XHRAZGVsdGFUaW1lICU9IGR1cmF0aW9uXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdHRydWVcclxuXHJcblx0YW5pbWF0ZTogKG5vZGUsIG5vZGVQYXRoID0gbm9kZS5ub2RlUGF0aCwgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lKSAtPlxyXG5cdFx0aWYgZnJhbWUgPSBAZnJhbWVcclxuXHRcdFx0dGltZXN0b3BzID0gZnJhbWVbbm9kZVBhdGhdIHx8IGZyYW1lW25vZGVOYW1lXVxyXG5cdFx0XHRpZiB0aW1lc3RvcHNcclxuXHRcdFx0XHRkZWx0YSA9IEBkZWx0YVRpbWVcclxuXHRcdFx0XHRwcm9wcyA9IEFuaW1hdGlvbi5wcm9wc1xyXG5cdFx0XHRcdHByb3BzVXNlZCA9IEFuaW1hdGlvbi5wcm9wc1VzZWRcclxuXHRcdFx0XHRmb3IgcG9pbnQgaW4gdGltZXN0b3BzXHJcblx0XHRcdFx0XHRpZiBkZWx0YSA+PSBwb2ludC5lbmRcclxuXHRcdFx0XHRcdFx0Zm9yIG5hbWUsIHRvVmFsIG9mIHBvaW50LnRvXHJcblx0XHRcdFx0XHRcdFx0dW5sZXNzIHByb3BzVXNlZFtuYW1lXVxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcHNbbmFtZV0gPSBub2RlW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1VzZWRbbmFtZV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0bm9kZVtuYW1lXSA9IHRvVmFsXHJcblx0XHRcdFx0XHRlbHNlIGlmIGRlbHRhID49IHBvaW50LnN0YXJ0XHJcblx0XHRcdFx0XHRcdGlmIHBvaW50LmZ1bmNcclxuXHRcdFx0XHRcdFx0XHR0RnVuYyA9IHRpbWluZ0Z1bmN0aW9uc1twb2ludC5mdW5jXVxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0dEZ1bmMgPSB0aW1pbmdGdW5jdGlvbnMubGluZWFyXHJcblx0XHRcdFx0XHRcdCNcclxuXHRcdFx0XHRcdFx0Zm9yIG5hbWUsIHRvVmFsIG9mIHBvaW50LnRvXHJcblx0XHRcdFx0XHRcdFx0cHJvcCA9IG5vZGVbbmFtZV1cclxuXHRcdFx0XHRcdFx0XHR1bmxlc3MgcHJvcHNVc2VkW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1tuYW1lXSA9IHByb3BcclxuXHRcdFx0XHRcdFx0XHRcdHByb3BzVXNlZFtuYW1lXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRwcm9wIHx8PSAwXHJcblx0XHRcdFx0XHRcdFx0aWYgdG9WYWwuY29uc3RydWN0b3IgPT0gTnVtYmVyXHJcblx0XHRcdFx0XHRcdFx0XHR0aW1lID0gdEZ1bmMoKGRlbHRhIC0gcG9pbnQuc3RhcnQpIC8gKHBvaW50LmVuZCAtIHBvaW50LnN0YXJ0KSlcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVbbmFtZV0gPSAodG9WYWwgLSBwcm9wKSAqIHRpbWUgKyBwcm9wXHJcblx0XHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZVtuYW1lXSA9IHRvVmFsXHJcblx0XHR0aGlzXHJcblxyXG5cdHJlY2l2ZVByb3BzOiAobm9kZSkgLT5cclxuXHRcdHByb3BzID0gQW5pbWF0aW9uLnByb3BzXHJcblx0XHRwcm9wc1VzZWQgPSBBbmltYXRpb24ucHJvcHNVc2VkXHJcblx0XHRmb3IgbmFtZSwgdXNlIG9mIHByb3BzVXNlZFxyXG5cdFx0XHRpZiB1c2VcclxuXHRcdFx0XHRub2RlW25hbWVdID0gcHJvcHNbbmFtZV1cclxuXHRcdFx0XHRkZWxldGUgcHJvcHNVc2VkW25hbWVdXHJcblx0XHR0aGlzXHJcblxyXG5cdGNyZWF0ZVdvcmtGcmFtZTogLT5cclxuXHRcdEBsb29wID0gZmFsc2VcclxuXHRcdEBmcmFtZSA9XHJcblx0XHRcdHdvcms6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRzdGFydDogMFxyXG5cdFx0XHRcdFx0ZW5kOiAwXHJcblx0XHRcdFx0XHR0bzoge31cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdHRoaXNcclxuXHJcblx0cmVzZXRXb3JrOiAtPlxyXG5cdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0Zm9yIG5hbWUsIHVzZSBvZiBwcm9wc1VzZWRcclxuXHRcdFx0aWYgdXNlIHRoZW4gcHJvcHNVc2VkW25hbWVdID0gZmFsc2VcclxuXHRcdHRoaXNcclxuXHJcblx0Y2xlYXJXb3JrOiAtPlxyXG5cdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0YU9iaiA9IEBmcmFtZS53b3JrWzBdXHJcblx0XHRhT2JqLnN0YXJ0ID0gYU9iai5lbmQgPSAwXHJcblx0XHR0byA9IFxyXG5cdFx0Zm9yIG5hbWUsIF8gb2YgdG9cclxuXHRcdFx0ZGVsZXRlIHRvW25hbWVdXHJcblx0XHR0aGlzXHJcblxyXG5cdGFuaW1hdGVQcm9wczogKHByb3BzLCBkdXJhdGlvbiwgZnVuYykgLT5cclxuXHRcdEBkdXJhdGlvbiA9IGR1cmF0aW9uXHJcblx0XHRhT2JqID0gQGZyYW1lLndvcmtbMF1cclxuXHRcdGFPYmouZW5kID0gZHVyYXRpb25cclxuXHRcdGFPYmouZnVuYyA9IGZ1bmNcclxuXHRcdHRvID0gYU9iai50b1xyXG5cdFx0Zm9yIG5hbWUsIHByb3Agb2YgcHJvcHNcclxuXHRcdFx0dG9bbmFtZV0gPSBwcm9wXHJcblx0XHRAcmVzZXQoKVxyXG5cdFx0dGhpc1xyXG5cclxuZXhwb3J0IHsgQW5pbWF0aW9uRGF0YSwgQW5pbWF0aW9uIH0iLCJpbXBvcnQgeyBTcHJpdGUgfSBmcm9tICcuL3Nwcml0ZSdcclxuaW1wb3J0IHsgQW5pbWF0aW9uIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcblxyXG5jbGFzcyBNb2RlbERhdGFcclxuXHRAY2FjaGU6IFtdXHJcblxyXG5cdEBsb2FkOiAobG9hZGVyLCBmaWxlKSAtPlxyXG5cdFx0bW9kZWwgPSBNb2RlbERhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBtb2RlbFxyXG5cdFx0XHRtb2RlbCA9IG5ldyBNb2RlbERhdGFcclxuXHRcdFx0bW9kZWwubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0TW9kZWxEYXRhLmNhY2hlW2ZpbGVdID0gbW9kZWxcclxuXHRcdG1vZGVsXHJcblxyXG5cdGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRsb2FkZXIubG9hZEpzb24gZmlsZSwgKGRhdGEpID0+XHJcblx0XHRcdEBsb2FkRGF0YSBsb2FkZXIsIGRhdGFcclxuXHJcblx0bG9hZERhdGE6IChsb2FkZXIsIGRhdGEpIC0+XHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHR0aGlzW2tleV0gPSB2YWx1ZVxyXG5cclxuXHRcdFx0aWYgQGltYWdlc1xyXG5cdFx0XHRcdGltYWdlc0RhdGEgPSBAaW1hZ2VzXHJcblx0XHRcdFx0QGltYWdlcyA9IFtdXHJcblx0XHRcdFx0Zm9yIGtleSwgaW1hZ2Ugb2YgaW1hZ2VzRGF0YVxyXG5cdFx0XHRcdFx0QGltYWdlc1trZXldID0gbG9hZGVyLmxvYWRJbWFnZSBpbWFnZVxyXG5cclxuXHRcdFx0aWYgQHNwcml0ZXNcclxuXHRcdFx0XHRzcHJpdGVzRGF0YSA9IEBzcHJpdGVzXHJcblx0XHRcdFx0QHNwcml0ZXMgPSBbXVxyXG5cdFx0XHRcdGZvciBrZXksIHNwcml0ZSBvZiBzcHJpdGVzRGF0YVxyXG5cdFx0XHRcdFx0QHNwcml0ZXNba2V5XSA9IFNwcml0ZS5sb2FkIGxvYWRlciwgc3ByaXRlXHJcblxyXG5cdFx0XHRpZiBAbW9kZWxzXHJcblx0XHRcdFx0bW9kZWxzRGF0YSA9IEBtb2RlbHNcclxuXHRcdFx0XHRAbW9kZWxzID0gW11cclxuXHRcdFx0XHRmb3Iga2V5LCBtb2RlbCBvZiBtb2RlbHNEYXRhXHJcblx0XHRcdFx0XHRAbW9kZWxzW2tleV0gPSBcclxuXHRcdFx0XHRcdFx0aWYgdHlwZW9mIG1vZGVsID09ICdzdHJpbmcnXHJcblx0XHRcdFx0XHRcdFx0TW9kZWxEYXRhLmxvYWQgbG9hZGVyLCBtb2RlbFxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0QGxvYWREYXRhLmNhbGwgbmV3IE1vZGVsRGF0YSwgbG9hZGVyLCBtb2RlbFxyXG5cclxuXHRcdFx0XHRub2Rlc0xvYWQgPSAobm9kZXMsIG5vZGVQYXRoID0gJycpIC0+XHJcblx0XHRcdFx0XHRmb3IgbmFtZSwgbm9kZSBvZiBub2Rlc1xyXG5cdFx0XHRcdFx0XHRub2RlLm5vZGVQYXRoID0gbm9kZVBhdGggKyBuYW1lXHJcblx0XHRcdFx0XHRcdG5vZGUubm9kZU5hbWUgPSAnQCcgKyBuYW1lXHJcblx0XHRcdFx0XHRcdGlmIG5vZGUuYmVmb3JlXHJcblx0XHRcdFx0XHRcdFx0bm9kZXNMb2FkIG5vZGUuYmVmb3JlLCBub2RlLm5vZGVQYXRoICsgJzwnXHJcblx0XHRcdFx0XHRcdGlmIG5vZGUuYWZ0ZXJcclxuXHRcdFx0XHRcdFx0XHRub2Rlc0xvYWQgbm9kZS5hZnRlciwgbm9kZS5ub2RlUGF0aCArICc+J1xyXG5cclxuXHRcdFx0XHRpZiBAYm9uZXNcclxuXHRcdFx0XHRcdG5vZGVzTG9hZCBAYm9uZXNcclxuXHRcdHRoaXNcclxuXHJcblxyXG5kcmF3VHlwZU9iaiA9XHJcblx0bGluZTogKGcpIC0+XHJcblx0XHRnLm1vdmVUbyBAeDEgfHwgMCwgQHkxIHx8IDBcclxuXHRcdGcubGluZVRvIEB4MiB8fCAwLCBAeTIgfHwgMFxyXG5cdFx0dGhpc1xyXG5cclxuXHRyZWN0OiAoZykgLT5cclxuXHRcdGcucmVjdCBAeCB8fCAwLCBAeSB8fCAwLCBAd2lkdGggfHwgMSwgQGhlaWdodCB8fCAxXHJcblx0XHR0aGlzXHJcblxyXG5cdHJlY3RSb3VuZDogKGcpIC0+XHJcblx0XHRAbm9DbG9zZSA9IGZhbHNlXHJcblx0XHR4ID0gQHggfHwgMFxyXG5cdFx0eSA9IEB5IHx8IDBcclxuXHRcdHcgPSBAd2lkdGhcclxuXHRcdGggPSBAaGVpZ2h0XHJcblx0XHRyID0gQHJhZGl1c1xyXG5cdFx0aWYgdyA8IDIgKiByIHRoZW4gciA9IHcgLyAyXHJcblx0XHRpZiBoIDwgMiAqIHIgdGhlbiByID0gaCAvIDJcclxuXHJcblx0XHRnLm1vdmVUbyB4ICsgciwgeVxyXG5cdFx0Zy5hcmNUbyAgeCArIHcsIHksICAgICB4ICsgdywgeSArIGgsIHJcclxuXHRcdGcuYXJjVG8gIHggKyB3LCB5ICsgaCwgeCwgICAgIHkgKyBoLCByXHJcblx0XHRnLmFyY1RvICB4LCAgICAgeSArIGgsIHgsICAgICB5LCAgICAgclxyXG5cdFx0Zy5hcmNUbyAgeCwgICAgIHksICAgICB4ICsgdywgeSwgICAgIHJcclxuXHRcdHRoaXNcclxuXHJcblx0YXJjOiAoZykgLT5cclxuXHRcdGcuYXJjKFxyXG5cdFx0XHRAeCB8fCAwLFxyXG5cdFx0XHRAeSB8fCAwLFxyXG5cdFx0XHRAcmFkaXVzLFxyXG5cdFx0XHQoQHN0YXJ0QW5nbGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQGVuZEFuZ2xlIHx8IDM2MCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHRpZiBAY2xvY2t3aXNlIHRoZW4gZmFsc2UgZWxzZSB0cnVlKVxyXG5cdFx0dGhpc1xyXG5cclxuXHRlbGlwc2U6IChnKSAtPlxyXG5cdFx0Zy5lbGxpcHNlKFxyXG5cdFx0XHRAeCB8fCAwLFxyXG5cdFx0XHRAeSB8fCAwLFxyXG5cdFx0XHRAcngsXHJcblx0XHRcdEByeSxcclxuXHRcdFx0KEByb3RhdGlvbiB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAc3RhcnRBbmdsZSB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAZW5kQW5nbGUgfHwgMzYwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdGlmIEBjbG9ja3dpc2UgdGhlbiBmYWxzZSBlbHNlIHRydWUpXHJcblx0XHR0aGlzXHJcblxyXG5cdHBhdGg6IChnKSAtPlxyXG5cdFx0eCA9IEB4IHx8IDBcclxuXHRcdHkgPSBAeSB8fCAwXHJcblx0XHRpZiB0eXBlb2YgQHBhdGggPT0gJ3N0cmluZydcclxuXHRcdFx0QHBhdGggPSBuZXcgUGF0aDJEIEBwYXRoXHJcblx0XHQjXHJcblx0XHRAbm9DbG9zZSA9IHRydWVcclxuXHRcdGcudHJhbnNsYXRlIHgsIHlcclxuXHRcdGRyYXcgPSBAZHJhdyB8fCAnZiZzJ1xyXG5cdFx0aWYgZHJhdyA9PSAnZicgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0XHRnLmZpbGwgQHBhdGhcclxuXHRcdGlmIGRyYXcgPT0gJ3MnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5zdHJva2UgQHBhdGhcclxuXHRcdHRoaXNcclxuXHJcblx0bm9kZTogKGcsIG1vZGVsLCBvcGFjaXR5LCBkYXRhKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdCMgU2F2ZSBjdXJyZW50IG1vZGVsIGRhdGFcclxuXHRcdHREYXRhID0gbW9kZWwuZGF0YVxyXG5cdFx0IyBTZWxlY3QgbW9kZWxcclxuXHRcdGRhdGEgPSBkYXRhIHx8IHREYXRhLm1vZGVscz9bQG1vZGVsXVxyXG5cdFx0aWYgZGF0YVxyXG5cdFx0XHRtb2RlbC5kYXRhID0gZGF0YVxyXG5cdFx0XHRub2RlcyA9IGRhdGEuYm9uZXNcclxuXHRcdGVsc2VcclxuXHRcdFx0bm9kZXMgPSBtb2RlbC5kYXRhLmJvbmVzXHJcblx0XHRpZiBub2Rlc1xyXG5cdFx0XHQjIFNlbGVjdCBub2RlIGluIG1vZGVsXHJcblx0XHRcdG5vZGUgPSBAbm9kZVxyXG5cdFx0XHRpZiB0eXBlb2Ygbm9kZSA9PSAnc3RyaW5nJ1xyXG5cdFx0XHRcdG5vZGUgPSBub2Rlc1tub2RlXVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0cm9vdCA9IG5vZGVzXHJcblx0XHRcdFx0Zm9yIHBhdGggaW4gbm9kZVxyXG5cdFx0XHRcdFx0cm9vdCA9IHJvb3RbcGF0aF1cclxuXHRcdFx0XHRub2RlID0gcm9vdFxyXG5cdFx0XHRpZiBub2RlXHJcblx0XHRcdFx0Zy50cmFuc2xhdGUgQHggfHwgMCwgQHkgfHwgMFxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgbW9kZWwsIG9wYWNpdHlcclxuXHRcdFx0XHQjIFJlY2l2ZSBtb2RlbCBkYXRhXHJcblx0XHRtb2RlbC5kYXRhID0gdERhdGFcclxuXHRcdHRoaXNcclxuXHJcblx0YXR0YWNoOiAoZywgbW9kZWwsIG9wYWNpdHkpIC0+XHJcblx0XHRkYXRhID0gbW9kZWwuYXR0YWNobWVudFtAYXR0YWNoXVxyXG5cdFx0aWYgZGF0YVxyXG5cdFx0XHRkcmF3VHlwZU9iai5ub2RlLmNhbGwgdGhpcywgZywgbW9kZWwsIG9wYWNpdHksIGRhdGFcclxuXHRcdHRoaXNcclxuXHJcblx0aW1hZ2U6IChnLCBtb2RlbCkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHRpbWFnZSA9IG1vZGVsLmRhdGEuaW1hZ2VzW0BpbWFnZV1cclxuXHRcdGlmIEB3aWR0aCB8fCBAaGVpZ2h0XHJcblx0XHRcdGcuZHJhd0ltYWdlIGltYWdlLCBAeCB8fCAwLCBAeSB8fCAwLCBAd2lkdGgsIEBoZWlnaHRcclxuXHRcdGVsc2VcclxuXHRcdFx0Zy5kcmF3SW1hZ2UgaW1hZ2UsIEB4IHx8IDAsIEB5IHx8IDBcclxuXHRcdHRoaXNcclxuXHJcblx0c3ByaXRlOiAoZywgbW9kZWwpIC0+XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0c3ByaXRlID0gQHNwcml0ZVxyXG5cdFx0aWYgc3ByaXRlLmNvbnN0cnVjdG9yID09IFN0cmluZ1xyXG5cdFx0XHRAc3ByaXRlID0gc3ByaXRlID0gbW9kZWwuZGF0YS5zcHJpdGVzW3Nwcml0ZV1cclxuXHRcdHNwcml0ZS5kcmF3IGcsIEBmcmFtZSwgQHggfHwgMCwgQHkgfHwgMCwgQGluZGV4XHJcblx0XHR0aGlzXHJcblxyXG5cdHRleHQ6IChnKSAtPlxyXG5cdFx0aWYgQGRyYXcgIT0gdHJ1ZVxyXG5cdFx0XHRAZHJhd1RleHQgPSBAZHJhd1xyXG5cdFx0ZHJhdyA9IEBkcmF3VGV4dFxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdCNcclxuXHRcdGlmIEBmb250IHRoZW4gZy5mb250ID0gQGZvbnRcclxuXHRcdGlmIEB0ZXh0QWxpZ24gdGhlbiBnLnRleHRBbGlnbiA9IEB0ZXh0QWxpZ25cclxuXHRcdGlmIEB0ZXh0QmFzZWxpbmUgIT0gbnVsbCB0aGVuIGcudGV4dEJhc2VsaW5lID0gQHRleHRCYXNlbGluZVxyXG5cdFx0aWYgQGRpcmVjdGlvbiB0aGVuIGcuZGlyZWN0aW9uID0gQGRpcmVjdGlvblxyXG5cdFx0I1xyXG5cdFx0aWYgZHJhdyA9PSAnZicgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0XHRnLmZpbGxUZXh0IEB0ZXh0LCBAeCB8fCAwLCBAeSB8fCAwLCBAbWF4V2lkdGhcclxuXHRcdGlmIGRyYXcgPT0gJ3MnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5zdHJva2VUZXh0IEB0ZXh0LCBAeCB8fCAwLCBAeSB8fCAwLCBAbWF4V2lkdGhcclxuXHRcdHRoaXNcclxuXHJcbnN0eWxlVHlwZUZ1bmMgPVxyXG5cdGxpbmVhcjogKGcpIC0+XHJcblx0XHRncmFkaWVudCA9IGcuY3JlYXRlTGluZWFyR3JhZGllbnQgQHgwIHx8IDAsIEB5MCB8fCAwLCBAeDEgfHwgMCwgQHkxIHx8IDBcclxuXHRcdGZvciBjb2xvclN0b3AgaW4gQGNvbG9yU3RvcHNcclxuXHRcdFx0Z3JhZGllbnQuYWRkQ29sb3JTdG9wIGNvbG9yU3RvcC5wb3MgfHwgMCwgY29sb3JTdG9wLmNvbG9yXHJcblx0XHRncmFkaWVudFxyXG5cclxuXHRyYWRpYWw6IChnKSAtPlxyXG5cdFx0Z3JhZGllbnQgPSBnLmNyZWF0ZVJhZGlhbEdyYWRpZW50IEB4MCB8fCAwLCBAeTAgfHwgMCwgQHIwIHx8IDAsIEB4MSB8fCAwLCBAeTEgfHwgMCwgQHIxIHx8IDBcclxuXHRcdGZvciBjb2xvclN0b3AgaW4gQGNvbG9yU3RvcHNcclxuXHRcdFx0Z3JhZGllbnQuYWRkQ29sb3JTdG9wIGNvbG9yU3RvcC5wb3MgfHwgMCwgY29sb3JTdG9wLmNvbG9yXHJcblx0XHRncmFkaWVudFxyXG5cclxuXHRwYXR0ZXJuOiAoZywgbW9kZWwpIC0+XHJcblx0XHRpbWFnZSA9IG1vZGVsLmRhdGEuaW1hZ2VzW0BpbWFnZV1cclxuXHRcdGcuY3JlYXRlUGF0dGVybiBpbWFnZSwgQHJlcGV0aXRpb24gfHwgXCJyZXBlYXRcIlxyXG5cclxuaW5pdFN0eWxlID0gKGcsIG1vZGVsLCBzdHlsZSkgLT5cclxuXHRzdHlsZVR5cGVGdW5jW3N0eWxlLnR5cGVdPy5jYWxsIHN0eWxlLCBnLCBtb2RlbFxyXG5cclxuc2V0RHJhd1N0eWxlID0gKGcsIG1vZGVsKSAtPlxyXG5cdHN0cm9rZSA9IEBzdHJva2VcclxuXHRpZiBzdHJva2VcclxuXHRcdGlmIHN0cm9rZS5jb25zdHJ1Y3RvciA9PSBPYmplY3RcclxuXHRcdFx0QHN0cm9rZSA9IGluaXRTdHlsZSBnLCBtb2RlbCwgc3Ryb2tlXHJcblx0XHRnLnN0cm9rZVN0eWxlID0gQHN0cm9rZVxyXG5cdGZpbGwgPSBAZmlsbFxyXG5cdGlmIGZpbGxcclxuXHRcdGlmIGZpbGwuY29uc3RydWN0b3IgPT0gT2JqZWN0XHJcblx0XHRcdEBmaWxsID0gaW5pdFN0eWxlIGcsIG1vZGVsLCBmaWxsXHJcblx0XHRnLmZpbGxTdHlsZSA9IEBmaWxsXHJcblx0aWYgQGxpbmVXaWR0aCAhPSBudWxsIHRoZW4gZy5saW5lV2lkdGggPSBAbGluZVdpZHRoXHJcblx0aWYgQGxpbmVDYXAgIT0gbnVsbCB0aGVuIGcubGluZUNhcCA9IEBsaW5lQ2FwXHJcblx0aWYgQGxpbmVKb2luIHRoZW4gZy5saW5lSm9pbiA9IEBsaW5lSm9pblxyXG5cdGlmIEBsaW5lRGFzaE9mZnNldCAhPSBudWxsIHRoZW4gZy5saW5lRGFzaE9mZnNldCA9IEBsaW5lRGFzaE9mZnNldFxyXG5cdHRoaXNcclxuXHJcbmRyYXdOb2RlID0gKGcsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdGcuc2F2ZSgpXHJcblx0bW9kZWwuYW5pbWF0aW9uLmFuaW1hdGUgdGhpc1xyXG5cdGcudHJhbnNmb3JtIEBzY2FsZVggfHwgMSwgQHNrZXdZIHx8IDAsIEBza2V3WCB8fCAwLCBAc2NhbGVZIHx8IDEsIEBvcmlnWCB8fCAwLCBAb3JpZ1kgfHwgMFxyXG5cdGlmIEBhbmdsZSB0aGVuIGcucm90YXRlIEBhbmdsZSAqIE1hdGguUEkgLyAxODBcclxuXHRzZXREcmF3U3R5bGUuY2FsbCB0aGlzLCBnLCBtb2RlbFxyXG5cdCMgU2hhZG93c1xyXG5cdGlmIEBub1NoYWRvd1xyXG5cdFx0Zy5zaGFkb3dCbHVyID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRYID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRZID0gMFxyXG5cdGlmIEBzaGFkb3dCbHVyICE9IG51bGwgdGhlbiBnLnNoYWRvd0JsdXIgPSBAc2hhZG93Qmx1clxyXG5cdGlmIEBzaGFkb3dDb2xvciAhPSBudWxsIHRoZW4gZy5zaGFkb3dDb2xvciA9IEBzaGFkb3dDb2xvclxyXG5cdGlmIEBzaGFkb3dPZmZzZXRYICE9IG51bGwgdGhlbiBnLnNoYWRvd09mZnNldFggPSBAc2hhZG93T2Zmc2V0WFxyXG5cdGlmIEBzaGFkb3dPZmZzZXRZICE9IG51bGwgdGhlbiBnLnNoYWRvd09mZnNldFkgPSBAc2hhZG93T2Zmc2V0WVxyXG5cdGcuZ2xvYmFsQWxwaGEgPSBvcGFjaXR5ICogKGlmIEBvcGFjaXR5ID09IG51bGwgdGhlbiAxIGVsc2UgQG9wYWNpdHkpXHJcblxyXG5cdGlmIEBiZWZvcmVcclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5yZWNpdmVQcm9wcyB0aGlzXHJcblx0XHQjXHJcblx0XHRmb3Iga2V5LCBub2RlIG9mIEBiZWZvcmVcclxuXHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgbW9kZWwsIG9wYWNpdHlcclxuXHRcdCNcclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5hbmltYXRlIHRoaXNcclxuXHJcblx0Zy5iZWdpblBhdGgoKVxyXG5cdGRyYXdUeXBlT2JqW0B0eXBlXT8uY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cdGlmICFAbm9DbG9zZSB0aGVuIGcuY2xvc2VQYXRoKClcclxuXHJcblx0ZHJhdyA9IEBkcmF3IHx8ICdmJnMnXHJcblx0aWYgZHJhdyA9PSAnZicgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0Zy5maWxsKClcclxuXHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLnN0cm9rZSgpXHJcblxyXG5cdGlmIEBjbGlwXHJcblx0XHRnLmNsaXAoKVxyXG5cclxuXHRtb2RlbC5hbmltYXRpb24ucmVjaXZlUHJvcHMgdGhpc1xyXG5cclxuXHRpZiBAYWZ0ZXJcclxuXHRcdGZvciBrZXksIG5vZGUgb2YgQGFmdGVyXHJcblx0XHRcdGlmICFub2RlLmhpZGVcclxuXHRcdFx0XHRkcmF3Tm9kZS5jYWxsIG5vZGUsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblxyXG5cdGlmIE1vZGVsLmRyYXdPcmlnaW5cclxuXHRcdGcuZmlsbFN0eWxlID0gJyNmMDAnXHJcblx0XHRnLnNoYWRvd0JsdXIgPSAwXHJcblx0XHRnLnNoYWRvd09mZnNldFggPSAwXHJcblx0XHRnLnNoYWRvd09mZnNldFkgPSAwXHJcblx0XHRnLmZpbGxSZWN0IC0yLCAtMiwgNCwgNFxyXG5cclxuXHRnLnJlc3RvcmUoKVxyXG5cdHRoaXNcclxuXHJcblxyXG5kcmF3UGFydFR5cGUgPVxyXG5cdHBvbHk6IChnLCB2ZXJ0cywgY2FtZXJhLCBtb2RlbCkgLT5cclxuXHRcdHYgPSB2ZXJ0c1tAdmVydHNbMF1dXHJcblx0XHR4YyA9IGNhbWVyYS54XHJcblx0XHR5YyA9IGNhbWVyYS55XHJcblx0XHR6dCA9IGNhbWVyYS56XHJcblx0XHR6ID0gKCh2LnogfHwgMSkgKiB6dClcclxuXHRcdHggPSAoKHYueCB8fCAwKSArIHhjKSAqIHpcclxuXHRcdHkgPSAoKHYueSB8fCAwKSArIHljKSAqIHpcclxuXHRcdGcubW92ZVRvIHgsIHlcclxuXHRcdGwgPSBAdmVydHMubGVuZ3RoIC0gMVxyXG5cdFx0Zm9yIGkgaW4gWzEuLmxdXHJcblx0XHRcdHYgPSB2ZXJ0c1tAdmVydHNbaV1dO1xyXG5cdFx0XHR6ID0gKCh2LnogfHwgMSkgKiB6dClcclxuXHRcdFx0eCA9ICgodi54IHx8IDApICsgeGMpICogelxyXG5cdFx0XHR5ID0gKCh2LnkgfHwgMCkgKyB5YykgKiB6XHJcblx0XHRcdGcubGluZVRvIHgsIHlcclxuXHRcdHRoaXNcclxuXHJcblx0cGFydDogKGcsIHZlcnRzLCBjYW1lcmEsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdCMgU2F2ZSBtb2RlbCBkYXRhXHJcblx0XHR0RGF0YSA9IG1vZGVsLmRhdGFcclxuXHRcdCMgU2VsZWN0IG1vZGVsXHJcblx0XHRkYXRhID0gdERhdGEubW9kZWxzP1tAbW9kZWxdXHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdG1vZGVsLmRhdGEgPSBkYXRhXHJcblx0XHRcdHBhcnRzID0gZGF0YS5wYXJ0c1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRwYXJ0cyA9IG1vZGVsLmRhdGEucGFydHNcclxuXHRcdGlmIHBhcnRzXHJcblx0XHRcdHYgPSB2ZXJ0c1tAdmVydF1cclxuXHRcdFx0YyA9XHJcblx0XHRcdFx0eDogY2FtZXJhLnggKyAodi54IHx8IDApXHJcblx0XHRcdFx0eTogY2FtZXJhLnkgKyAodi55IHx8IDApXHJcblx0XHRcdFx0ejogY2FtZXJhLnogKiAodi56IHx8IDEpXHJcblxyXG5cdFx0XHRwYXJ0ID0gcGFydHNbQHBhcnRdXHJcblx0XHRcdGlmIHBhcnRcclxuXHRcdFx0XHR0UGFydHMgPSBtb2RlbC5wYXJ0c1xyXG5cdFx0XHRcdG1vZGVsLnBhcnRzID0gcGFydHNcclxuXHRcdFx0XHRmb3IgZmFjZSBpbiBwYXJ0LmZhY2VzXHJcblx0XHRcdFx0XHRkcmF3UGFydC5jYWxsIGZhY2UsIGcsIG1vZGVsLCBjLCBvcGFjaXR5XHJcblx0XHRcdFx0bW9kZWwucGFydHMgPSB0UGFydHNcclxuXHRcdG1vZGVsLmRhdGEgPSB0RGF0YVxyXG5cdFx0dGhpc1xyXG5cclxuXHRub2RlOiAoZywgdmVydHMsIGNhbWVyYSwgbW9kZWwsIG9wYWNpdHkpIC0+XHJcblx0XHR0cmFuc2Zvcm1WZXJ0IHZlcnRzW0B2ZXJ0XSwgY2FtZXJhXHJcblx0XHRcdC5hcHBseSBnXHJcblx0XHRkcmF3Tm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHQjIGRyYXdUeXBlT2JqLm5vZGUuY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cdFx0dGhpc1xyXG5cclxuXHRhdHRhY2g6IChnLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnRdLCBjYW1lcmFcclxuXHRcdFx0LmFwcGx5IGdcclxuXHRcdGRhdGEgPSBtb2RlbC5hdHRhY2htZW50W0BhdHRhY2hdXHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdGRyYXdUeXBlT2JqLm5vZGUuY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eSwgZGF0YVxyXG5cdFx0dGhpc1xyXG5cclxuXHRlbGlwc2U6IChnLCB2ZXJ0cywgY2FtZXJhKSAtPlxyXG5cdFx0diA9IHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnQxXSwgY2FtZXJhXHJcblx0XHR4MSA9IHYueFxyXG5cdFx0eTEgPSB2LnlcclxuXHRcdHYgPSB0cmFuc2Zvcm1WZXJ0IHZlcnRzW0B2ZXJ0Ml0sIGNhbWVyYVxyXG5cdFx0eDIgPSB2LnhcclxuXHRcdHkyID0gdi55XHJcblx0XHRyeCA9ICh4MiAtIHgxKSAvIDJcclxuXHRcdHJ5ID0gKHkyIC0geTEpIC8gMlxyXG5cdFx0Zy5lbGxpcHNlKFxyXG5cdFx0XHR4MSArIHJ4LFxyXG5cdFx0XHR5MSArIHJ5LFxyXG5cdFx0XHRyeCxcclxuXHRcdFx0cnksXHJcblx0XHRcdChAcm90YXRpb24gfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQHN0YXJ0QW5nbGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQGVuZEFuZ2xlIHx8IDM2MCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHRpZiBAY2xvY2t3aXNlIHRoZW4gZmFsc2UgZWxzZSB0cnVlKVxyXG5cdFx0dGhpc1xyXG5cclxuXHJcbmRyYXdQYXJ0ID0gKGcsIG1vZGVsLCBjYW1lcmEsIG9wYWNpdHkpIC0+XHJcblx0Zy5zYXZlKClcclxuXHRzdHJva2UgPSBAc3Ryb2tlXHJcblx0c2V0RHJhd1N0eWxlLmNhbGwgdGhpcywgZywgbW9kZWxcclxuXHRnLmdsb2JhbEFscGhhID0gb3BhY2l0eSAqIChpZiBAb3BhY2l0eSA9PSBudWxsIHRoZW4gMSBlbHNlIEBvcGFjaXR5KVxyXG5cclxuXHRnLmJlZ2luUGF0aCgpXHJcblx0ZHJhd1BhcnRUeXBlW0B0eXBlIHx8ICdwb2x5J10/LmNhbGwgdGhpcywgZywgbW9kZWwuZGF0YS52ZXJ0cywgY2FtZXJhLCBtb2RlbCwgb3BhY2l0eVxyXG5cdGlmICFAbm9DbG9zZSB0aGVuIGcuY2xvc2VQYXRoKClcclxuXHJcblx0ZHJhdyA9IEBkcmF3IHx8ICdmJnMnXHJcblx0aWYgZHJhdyA9PSAnZicgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0Zy5maWxsKClcclxuXHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLnN0cm9rZSgpXHJcblxyXG5cdGcucmVzdG9yZSgpXHJcblx0dGhpc1xyXG5cclxudHJzZk9iaiA9XHJcblx0eDogMFxyXG5cdHk6IDBcclxuXHRzY2FsZTogMVxyXG5cdGFwcGx5OiAoZykgLT5cclxuXHRcdGcudHJhbnNmb3JtIEBzY2FsZSwgMCwgMCwgQHNjYWxlLCBAeCwgQHlcclxuXHJcblxyXG5jbGFzcyBNb2RlbFxyXG5cdEB0cmFuc2Zvcm06ICh4LCB5LCB6LCBjYW1lcmEpIC0+XHJcblx0XHR6ID0gY2FtZXJhLnogKiB6XHJcblx0XHR0cnNmT2JqLnggPSAoeCArIGNhbWVyYS54KSAqIHpcclxuXHRcdHRyc2ZPYmoueSA9ICh5ICsgY2FtZXJhLnkpICogelxyXG5cdFx0dHJzZk9iai5zY2FsZSA9IHpcclxuXHRcdHRyc2ZPYmpcclxuXHJcblx0Y29uc3RydWN0b3I6IChAZGF0YSkgLT5cclxuXHRcdEBhdHRhY2htZW50ID0gW11cclxuXHRcdEBhbmltYXRpb24gPSBuZXcgQW5pbWF0aW9uXHJcblxyXG5cdHNldERhdGE6IChAZGF0YSkgLT5cclxuXHJcblx0ZHJhdzJEOiAoZywgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRmb3Iga2V5LCBub2RlIG9mIGJvbmVzXHJcblx0XHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCB0aGlzLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdOb2RlOiAoZywgbm9kZSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRub2RlID0gYm9uZXNbbm9kZV1cclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgdGhpcywgb3BhY2l0eVxyXG5cclxuXHRkcmF3UGFydDogKGcsIHBhcnQsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRmb3IgZmFjZSBpbiBwYXJ0LmZhY2VzXHJcblx0XHRcdGRyYXdQYXJ0LmNhbGwgZmFjZSwgZywgdGhpcywgY2FtZXJhLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdQYXJ0czogKGcsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBwYXJ0cyA9IEBkYXRhPy5wYXJ0c1xyXG5cdFx0XHRmb3IgXywgcGFydCBvZiBwYXJ0c1xyXG5cdFx0XHRcdGlmICFwYXJ0LmhpZGVcclxuXHRcdFx0XHRcdGZvciBmYWNlIGluIHBhcnQuZmFjZXNcclxuXHRcdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCB0aGlzLCBjYW1lcmEsIG9wYWNpdHlcclxuXHJcbnRyYW5zZm9ybSA9IE1vZGVsLnRyYW5zZm9ybVxyXG5cclxudHJhbnNmb3JtVmVydCA9ICh2LCBjYW1lcmEpIC0+XHJcblx0dHJhbnNmb3JtIHYueCB8fCAwLCB2LnkgfHwgMCwgdi56IHx8IDEsIGNhbWVyYVxyXG5cclxuZXhwb3J0IHsgTW9kZWxEYXRhLCBNb2RlbCB9IiwiY2xhc3MgRXZlbnRFbW1pdGVyXHJcblx0aGFuZGxlcnM6IFtdXHJcblxyXG5cdG9uOiAoZXZlbnQsIGNhbGxiYWNrKSAtPlxyXG5cdFx0aWYgY2FsbGJhY2tcclxuXHRcdFx0aGFuZGxlciA9IEBoYW5kbGVyc1tldmVudF1cclxuXHRcdFx0aWYgIWhhbmRsZXJcclxuXHRcdFx0XHRAaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlciA9IFtdXHJcblx0XHRcdGlmIGhhbmRsZXIuaW5kZXhPZihjYWxsYmFjaykgPCAwXHJcblx0XHRcdFx0aGFuZGxlci5wdXNoIGNhbGxiYWNrXHJcblx0XHR0aGlzXHJcblxyXG5cdG9mZjogKGV2ZW50LCBjYWxsYmFjaykgLT5cclxuXHRcdGlmIGNhbGxiYWNrXHJcblx0XHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRcdGlmIGhhbmRsZXJcclxuXHRcdFx0XHRpbmRleCA9IGhhbmRsZXIuaW5kZXhPZiBjYWxsYmFja1xyXG5cdFx0XHRcdGlmIGluZGV4ID49IDBcclxuXHRcdFx0XHRcdGhhbmRsZXIuc3BsaWNlIGluZGV4LCAxXHJcblx0XHR0aGlzXHJcblxyXG5cdHRyaWdnZXI6IChldmVudCwgYXJncykgLT5cclxuXHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRpZiBoYW5kbGVyXHJcblx0XHRcdGZvciBjYWxsYmFjayBpbiBoYW5kbGVyXHJcblx0XHRcdFx0Y2FsbGJhY2suYXBwbHkgdGhpcywgYXJnc1xyXG5cdFx0dGhpc1xyXG5cclxuXHRyZW1vdmVFdmVudDogKGV2ZW50KSAtPlxyXG5cdFx0ZGVsZXRlIEBoYW5kbGVyc1tldmVudF1cclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IEV2ZW50RW1taXRlciB9IiwiaW1wb3J0IHsgRXZlbnRFbW1pdGVyIH0gZnJvbSAnLi9ldmVudHMnXHJcblxyXG4jIEV2ZW50czpcclxuIyAnY2hhbmdlcGVyY2VudCcgdHJpZ2dlciB3aGVuIHNvbWUgcmVzb3JjZXMgbG9hZGVkXHJcbiMgJ2xvYWQnIHRyaWdnZXIgd2hlbiBhbGwgcmVzb3JjZXMgbG9hZGVkXHJcblxyXG5jbGFzcyBMb2FkZXIgZXh0ZW5kcyBFdmVudEVtbWl0ZXJcclxuXHRsb2FkUmVzTnVtYmVyID0gMFxyXG5cdGFsbFJlc0xvYWRlciA9IDBcclxuXHJcblx0cmVzZXQ6ICgpIC0+XHJcblx0XHRsb2FkUmVzTnVtYmVyID0gYWxsUmVzTG9hZGVyID0gMFxyXG5cclxuXHRnZXRQZXJjZW50OiAtPlxyXG5cdFx0MSAtIGlmIGFsbFJlc0xvYWRlciAhPSAwIHRoZW4gbG9hZFJlc051bWJlciAvIGFsbFJlc0xvYWRlciBlbHNlIDBcclxuXHJcblx0dXBkYXRlUGVyY2VudDogKCkgLT5cclxuXHRcdEB0cmlnZ2VyICdjaGFuZ2VwZXJjZW50JywgWyBAZ2V0UGVyY2VudCgpIF1cclxuXHJcblx0bG9hZDogKGNhbGxiYWNrKSAtPlxyXG5cdFx0X3RoaXMgPSB0aGlzXHJcblx0XHRsb2FkUmVzTnVtYmVyKytcclxuXHRcdGFsbFJlc0xvYWRlcisrXHJcblx0XHQjIEB1cGRhdGVQZXJjZW50KClcclxuXHRcdC0+XHJcblx0XHRcdGNhbGxiYWNrPy5hcHBseSBfdGhpcywgYXJndW1lbnRzXHJcblx0XHRcdGxvYWRSZXNOdW1iZXItLVxyXG5cdFx0XHRpZiBsb2FkUmVzTnVtYmVyIDw9IDBcclxuXHRcdFx0XHRfdGhpcy5yZXNldCgpXHJcblx0XHRcdFx0X3RoaXMudHJpZ2dlciAnbG9hZCdcclxuXHRcdFx0X3RoaXMudXBkYXRlUGVyY2VudCgpXHJcblxyXG5cdGxvYWRKc29uOiAoZmlsZSwgY2FsbGJhY2spIC0+XHJcblx0XHRjYWxsYmFjayA9IEBsb2FkIGNhbGxiYWNrXHJcblx0XHQkLmdldEpTT04gZmlsZSArICcuanNvbidcclxuXHRcdFx0LmRvbmUgY2FsbGJhY2tcclxuXHRcdFx0LmZhaWwgLT5cclxuXHRcdFx0XHRjYWxsYmFjayBudWxsXHJcblxyXG5cdGxvYWRJbWFnZTogKGZpbGUsIGNhbGxiYWNrKSAtPlxyXG5cdFx0Y2FsbGJhY2sgPSBAbG9hZCBjYWxsYmFja1xyXG5cdFx0aW1nID0gbmV3IEltYWdlXHJcblx0XHRpbWcub25sb2FkID0gLT5cclxuXHRcdFx0Y2FsbGJhY2sgaW1nXHJcblx0XHRpbWcuc3JjID0gZmlsZVxyXG5cdFx0aW1nXHJcblxyXG5leHBvcnQgeyBMb2FkZXIgfSIsImltcG9ydCB7IE1vZGVsRGF0YSwgTW9kZWwgfSBmcm9tICcuL21vZGVsJ1xyXG5pbXBvcnQgeyBBbmltYXRpb25EYXRhIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vbG9hZGVyJ1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkgLT5cclxuXHQkY2FudmFzID0gJCAnI2NhbnZhcydcclxuXHRjYW52YXMgPSAkY2FudmFzLmdldCAwXHJcblx0Y29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0ICcyZCcsIGFscGhhOiBmYWxzZVxyXG5cclxuXHRtb2RlbEZpbGUgPSAnbW9kZWxzL2Jhbm55J1xyXG5cdGxvYWRlciA9IG5ldyBMb2FkZXJcclxuXHRtb2RlbCA9IG5ldyBNb2RlbFxyXG5cdG1vZGVsRGF0YSA9IG5ldyBNb2RlbERhdGFcclxuXHRhbmltYXRpb25GcmFtZSA9IG51bGxcclxuXHRjYW1lcmEgPVxyXG5cdFx0Y2FudmFzOiBjYW52YXNcclxuXHRcdGc6IGNvbnRleHRcclxuXHRcdHg6IDBcclxuXHRcdHk6IDBcclxuXHRcdHo6IDFcclxuXHJcblx0cmVzaXplID0gLT5cclxuXHRcdGNhbnZhcy53aWR0aCA9ICQod2luZG93KS53aWR0aCgpXHJcblx0XHRjYW52YXMuaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnI2NhbnZhcycpLm9mZnNldCgpLnRvcFxyXG5cclxuXHRyZXNpemUoKVxyXG5cclxuXHQkKHdpbmRvdykub24gJ3Jlc2l6ZScsIHJlc2l6ZVxyXG5cclxuXHRtb2RlbFJlZnJlc2ggPSAtPlxyXG4jXHRcdGZvciBrZXksIF8gb2YgbW9kZWxEYXRhXHJcbiNcdFx0XHRkZWxldGUgbW9kZWxEYXRhW2tleV1cclxuXHRcdG1vZGVsRGF0YS5sb2FkIGxvYWRlciwgbW9kZWxGaWxlXHJcblx0XHJcblx0bG9hZGVyLm9uICdsb2FkJywgLT5cclxuXHRcdG1vZGVsLnNldERhdGEgbW9kZWxEYXRhXHJcblx0XHRpZiBtb2RlbC5hbmltYXRpb24uZGF0YVxyXG5cdFx0XHQjIG1vZGVsLmFuaW1hdGlvbi5zZXQgJ3Rlc3QnXHJcblx0XHRcdCNcclxuXHRcdFx0Y29udGFpbmVyID0gJCAnLmpzLWZyYW1lLWNvbnRhaW5lcidcclxuXHRcdFx0Y29udGFpbmVyLmVtcHR5KClcclxuXHRcdFx0Zm9yIGFuaW0sIF8gb2YgbW9kZWwuYW5pbWF0aW9uLmRhdGFcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kIFwiPGEgY2xhc3M9J2Ryb3Bkb3duLWl0ZW0ganMtZnJhbWUtc2VsZWN0JyBocmVmPScjJz4je2FuaW19PC9hPlwiXHJcblx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHRcdFx0JCgnLmpzLWZyYW1lLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRcdFx0YW5pbWF0aW9uRnJhbWUgPSAkKHRoaXMpLnRleHQoKVxyXG5cdFx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHJcblx0Y29uc29sZS5sb2cgbW9kZWxcclxuXHJcblx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblxyXG5cdHJlbmRlciA9IChkZWx0YSkgLT5cclxuXHRcdGNvbnRleHQuc2F2ZSgpXHJcblx0XHR3ID0gY2FudmFzLndpZHRoXHJcblx0XHRoID0gY2FudmFzLmhlaWdodFxyXG5cdFx0Y3ggPSB3IC8gMlxyXG5cdFx0Y3kgPSBoIC8gMlxyXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZidcclxuXHRcdGNvbnRleHQuZmlsbFJlY3QgMCwgMCwgdywgaFxyXG5cdFx0Y29udGV4dC5iZWdpblBhdGgoKVxyXG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSAyXHJcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gJyNmMDAnXHJcblx0XHRjb250ZXh0Lm1vdmVUbyBjeCwgMFxyXG5cdFx0Y29udGV4dC5saW5lVG8gY3gsIGhcclxuXHRcdGNvbnRleHQubW92ZVRvIDAsIGN5XHJcblx0XHRjb250ZXh0LmxpbmVUbyB3LCBjeVxyXG5cdFx0Y29udGV4dC5zdHJva2UoKVxyXG5cclxuXHRcdGNvbnRleHQudHJhbnNsYXRlIGN4LCBjeVxyXG5cclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5wbGF5KClcclxuXHJcblx0XHRtb2RlbC5kcmF3UGFydHMgY29udGV4dCwgY2FtZXJhXHJcblxyXG5cdFx0TW9kZWwudHJhbnNmb3JtKDAsIDAsIDEsIGNhbWVyYSlcclxuXHRcdFx0LmFwcGx5IGNvbnRleHRcclxuXHJcblx0XHRtb2RlbC5kcmF3MkQgY29udGV4dFxyXG5cclxuXHRcdGNvbnRleHQucmVzdG9yZSgpXHJcblx0XHQjIFxyXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcclxuXHJcblx0cmVuZGVyKDApXHJcblxyXG5cdG9sZE1vdXNlWCA9IG9sZE1vdXNlWSA9MFxyXG5cdG1vdmVDYW1lcmEgPSAoZSkgLT5cclxuXHRcdGNhbWVyYS54ICs9IGUuY2xpZW50WCAtIG9sZE1vdXNlWFxyXG5cdFx0Y2FtZXJhLnkgKz0gZS5jbGllbnRZIC0gb2xkTW91c2VZXHJcblx0XHRvbGRNb3VzZVggPSBlLmNsaWVudFhcclxuXHRcdG9sZE1vdXNlWSA9IGUuY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICdtb3VzZWRvd24nLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUuY2xpZW50WFxyXG5cdFx0b2xkTW91c2VZID0gZS5jbGllbnRZXHJcblx0XHQkY2FudmFzLm9uICdtb3VzZW1vdmUnLCBtb3ZlQ2FtZXJhXHJcblxyXG5cdCRjYW52YXMub24gJ3RvdWNoc3RhcnQnLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUudG91Y2hlc1swXS5jbGllbnRYXHJcblx0XHRvbGRNb3VzZVkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICd0b3VjaG1vdmUnLCAoZSkgLT5cclxuXHRcdG1vdmVDYW1lcmEgZS50b3VjaGVzWzBdXHJcblxyXG5cdCRjYW52YXMub24gJ21vdXNldXAnLCAtPlxyXG5cdFx0JGNhbnZhcy5vZmYgJ21vdXNlbW92ZScsIG1vdmVDYW1lcmFcclxuXHJcblx0JCgnLmpzLXotbnVtYmVyJylcclxuXHRcdC52YWwgY2FtZXJhLnpcclxuXHRcdC5vbiAnaW5wdXQgY2hhbmdlJywgLT5cclxuXHRcdFx0Y2FtZXJhLnogPSArICQodGhpcykudmFsKClcclxuXHJcblx0JCgnLmpzLW1vZGVsLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRtb2RlbERhdGEgPSBuZXcgTW9kZWxEYXRhXHJcblx0XHRtb2RlbEZpbGUgPSAkKHRoaXMpLmRhdGEgJ2ZpbGUnXHJcblxyXG5cdCQoJy5qcy1hbmltLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRmaWxlID0gJCh0aGlzKS5kYXRhICdmaWxlJ1xyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEgPSBuZXcgQW5pbWF0aW9uRGF0YVxyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdCQoJy5qcy1hbmltLXJlZnJlc2gnKS5kYXRhICdmaWxlJywgZmlsZVxyXG5cdFx0I1xyXG5cdFx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5wcm9wICdjaGVja2VkJywgZmFsc2VcclxuXHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHRNb2RlbC5kcmF3T3JpZ2luID0gdHJ1ZVxyXG5cdCQoJy5qcy1kcmF3LW9yaWdpbicpLmNoYW5nZSAtPlxyXG5cdFx0TW9kZWwuZHJhd09yaWdpbiA9ICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHJcblx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5jaGFuZ2UgLT5cclxuXHRcdGlmICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHRcdFx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblx0XHRlbHNlXHJcblx0XHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHQkKCcuanMtcmVzZXQtcG9zJykuY2xpY2sgLT5cclxuXHRcdGNhbWVyYS54ID0gY2FtZXJhLnkgPSAwXHJcblx0XHRjYW1lcmEueiA9IDFcclxuXHRcdCQoJy5qcy16LW51bWJlcicpLnZhbCAnMSdcclxuXHJcblx0ZnVsbHNjcmVlbiA9IGZhbHNlXHJcblx0JCgnLmpzLWZ1bGwtc2NyZWVuJykuY2xpY2sgLT5cclxuXHRcdGlmIGZ1bGxzY3JlZW5cclxuXHRcdFx0Y2FuY2VsRnVsbHNjcmVlbigpXHJcblx0XHRlbHNlXHJcblx0XHRcdGxhdW5jaEZ1bGxTY3JlZW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XHJcblx0XHRmdWxsc2NyZWVuID0gIWZ1bGxzY3JlZW5cclxuXHJcblx0bGF1bmNoRnVsbFNjcmVlbiA9IChlbGVtZW50KSAtPlxyXG5cdFx0aWYgZWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHJcblx0Y2FuY2VsRnVsbHNjcmVlbiA9IC0+XHJcblx0XHRpZiBkb2N1bWVudC5jYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LmNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LndlYmtpdENhbmNlbEZ1bGxTY3JlZW4oKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBQTs7QUFBTTtFQUFOLE1BQUEsT0FBQTtJQUdRLE9BQU4sSUFBTSxDQUFDLE1BQUQsRUFBUyxJQUFUO1VBQ047TUFB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
