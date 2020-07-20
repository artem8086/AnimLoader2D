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
              this.models[key] = ModelData.load(loader, model);
            }
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
            return nodesLoad(this.bones);
          }
        }
      });
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
    drawTypeObj.node.call(this, g, model, opacity);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3ByaXRlLmNvZmZlZSIsImFuaW1hdGlvbi5jb2ZmZWUiLCJtb2RlbC5jb2ZmZWUiLCJldmVudHMuY29mZmVlIiwibG9hZGVyLmNvZmZlZSIsIm1haW4uY29mZmVlIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFNwcml0ZVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRzcHJpdGUgPSBTcHJpdGUuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBzcHJpdGVcclxuXHRcdFx0c3ByaXRlID0gbmV3IFNwcml0ZVxyXG5cdFx0XHRzcHJpdGUubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0U3ByaXRlLmNhY2hlW2ZpbGVdID0gc3ByaXRlXHJcblx0XHRzcHJpdGVcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoQGRhdGEpID0+XHJcblx0XHRsb2FkZXIubG9hZEltYWdlIGZpbGUgKyAnLnBuZycsIChAdGV4dHVyZSkgPT5cclxuXHJcblx0ZHJhdzogKGcsIGZyYW1lLCB4LCB5LCBpbmRleCA9IDApIC0+XHJcblx0XHRkYXRhID0gQGRhdGFcclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0c3dpdGNoIGZyYW1lLmNvbnN0cnVjdG9yXHJcblx0XHRcdFx0d2hlbiBPYmplY3RcclxuXHRcdFx0XHRcdGcuZHJhd0ltYWdlIEB0ZXh0dXJlLFxyXG5cdFx0XHRcdFx0XHRmcmFtZS54LCBmcmFtZS55LCBmcmFtZS53LCBmcmFtZS5oLFxyXG5cdFx0XHRcdFx0XHR4ICsgZnJhbWUuY3gsIHkgKyBmcmFtZS5jeSwgZnJhbWUudywgZnJhbWUuaFxyXG5cdFx0XHRcdHdoZW4gQXJyYXlcclxuXHRcdFx0XHRcdEBkcmF3IGcsIGZyYW1lW01hdGguZmxvb3IoaW5kZXgpICUgZnJhbWUubGVuZ2h0XSwgeCwgeVxyXG5cdFx0XHRcdHdoZW4gU3RyaW5nXHJcblx0XHRcdFx0XHRAZHJhdyBnLCBkYXRhW2ZyYW1lXSwgeCwgeSwgaW5kZXhcclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IFNwcml0ZSB9IiwiY2xhc3MgQW5pbWF0aW9uRGF0YVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRhbmltRGF0YSA9IEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBhbmltRGF0YVxyXG5cdFx0XHRhbmltRGF0YSA9IG5ldyBBbmltYXRpb25EYXRhXHJcblx0XHRcdGFuaW1EYXRhLmxvYWQgbG9hZGVyLCBmaWxlXHJcblx0XHRcdEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV0gPSBhbmltRGF0YVxyXG5cdFx0YW5pbURhdGFcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoZGF0YSkgPT5cclxuXHRcdFx0aWYgZGF0YVxyXG5cdFx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlXHJcblxyXG5nZXRUaW1lID0gLT5cclxuXHRuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDBcclxuXHJcbm1ha2VFYXNlT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdDEgLSB0aW1pbmcoMSAtIHRpbWUpXHJcblxyXG5tYWtlRWFzZUluT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdGlmIHRpbWUgPCAwLjVcclxuXHRcdFx0dGltaW5nKDIgKiB0aW1lKSAvIDJcclxuXHRcdGVsc2VcclxuXHRcdFx0KDIgLSB0aW1pbmcoMiAqICgxIC0gdGltZSkpKSAvIDJcclxuXHJcblxyXG5zZXRUaW1pbmdGdW5jdGlvbiA9IChuYW1lLCB0aW1pbmcpIC0+XHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWVdID0gdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZU91dCddID0gbWFrZUVhc2VPdXQgdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZUluT3V0J10gPSBtYWtlRWFzZUluT3V0IHRpbWluZ1xyXG5cclxudGltaW5nRnVuY3Rpb25zID1cclxuXHRsaW5lYXI6ICh0aW1lKSAtPlxyXG5cdFx0dGltZVxyXG5cclxuXHRlYXNlT3V0OiAodGltZSkgLT5cclxuXHRcdDEgLSB0aW1lXHJcblxyXG5cdGVhc2VJbk91dDogKHRpbWUpIC0+XHJcblx0XHRpZiB0aW1lIDwgMC41XHJcblx0XHRcdHRpbWUgKiAyXHJcblx0XHRlbHNlXHJcblx0XHRcdDIgLSB0aW1lICogMlxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ3F1YWQnLCAodGltZSkgLT5cclxuXHR0aW1lICogdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2NpcmNsZScsICh0aW1lKSAtPlxyXG5cdDEgLSBNYXRoLnNpbiBNYXRoLmFjb3MgdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2JvdW5jZScsICh0aW1lKSAtPlxyXG5cdGEgPSAwXHJcblx0YiA9IDFcclxuXHR3aGlsZSB0cnVlXHJcblx0XHRpZiB0aW1lID49ICg3IC0gNCAqIGEpIC8gMTFcclxuXHRcdFx0cmV0dXJuIC1NYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogdGltZSkgLyA0LCAyKSArIE1hdGgucG93KGIsIDIpXHJcblx0XHRhICs9IGJcclxuXHRcdGIgLz0gMlxyXG5cclxuY2xhc3MgQW5pbWF0aW9uXHJcblx0QGdldFRpbWU6IGdldFRpbWVcclxuXHJcblx0bG9vcDogdHJ1ZVxyXG5cdHN0YXJ0VGltZTogMFxyXG5cdGR1cmF0aW9uOiAwXHJcblx0ZGVsdGFUaW1lOiAwXHJcblx0c2NhbGU6IDFcclxuXHJcblx0QHByb3BzOiBbXVxyXG5cdEBwcm9wc1VzZWQ6IFtdXHJcblxyXG5cdHJlc2V0OiAtPlxyXG5cdFx0QHN0YXJ0VGltZSA9IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IDBcclxuXHRcdHRoaXNcclxuXHJcblx0c2V0OiAobmFtZSwgbm9fcmVzZXQgPSBmYWxzZSwgZGF0YSA9IEBkYXRhKSAtPlxyXG5cdFx0YW5pbSA9IGRhdGE/W25hbWVdXHJcblx0XHRAcmVzZXQoKSB1bmxlc3Mgbm9fcmVzZXRcclxuXHRcdGlmIGFuaW1cclxuXHRcdFx0QGR1cmF0aW9uID0gYW5pbS5kdXJhdGlvbiB8fCAwXHJcblx0XHRcdEBmcmFtZSA9IGFuaW0uZnJhbWVzXHJcblx0XHRlbHNlXHJcblx0XHRcdEBkdXJhdGlvbiA9IDBcclxuXHRcdFx0QGZyYW1lID0gbnVsbFxyXG5cdFx0dGhpc1xyXG5cclxuXHRwbGF5OiAodGltZSkgLT5cclxuXHRcdHRpbWUgPSB0aW1lIHx8IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IGRlbHRhID0gKHRpbWUgLSBAc3RhcnRUaW1lKSAqIEBzY2FsZVxyXG5cdFx0ZHVyYXRpb24gPSBAZHVyYXRpb25cclxuXHRcdHVubGVzcyBkdXJhdGlvblxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdGlmIGRlbHRhID4gZHVyYXRpb25cclxuXHRcdFx0aWYgQGxvb3BcclxuXHRcdFx0XHRAZGVsdGFUaW1lICU9IGR1cmF0aW9uXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdHRydWVcclxuXHJcblx0YW5pbWF0ZTogKG5vZGUsIG5vZGVQYXRoID0gbm9kZS5ub2RlUGF0aCwgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lKSAtPlxyXG5cdFx0aWYgZnJhbWUgPSBAZnJhbWVcclxuXHRcdFx0dGltZXN0b3BzID0gZnJhbWVbbm9kZVBhdGhdIHx8IGZyYW1lW25vZGVOYW1lXVxyXG5cdFx0XHRpZiB0aW1lc3RvcHNcclxuXHRcdFx0XHRkZWx0YSA9IEBkZWx0YVRpbWVcclxuXHRcdFx0XHRwcm9wcyA9IEFuaW1hdGlvbi5wcm9wc1xyXG5cdFx0XHRcdHByb3BzVXNlZCA9IEFuaW1hdGlvbi5wcm9wc1VzZWRcclxuXHRcdFx0XHRmb3IgcG9pbnQgaW4gdGltZXN0b3BzXHJcblx0XHRcdFx0XHRpZiBkZWx0YSA+PSBwb2ludC5lbmRcclxuXHRcdFx0XHRcdFx0Zm9yIG5hbWUsIHRvVmFsIG9mIHBvaW50LnRvXHJcblx0XHRcdFx0XHRcdFx0dW5sZXNzIHByb3BzVXNlZFtuYW1lXVxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcHNbbmFtZV0gPSBub2RlW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1VzZWRbbmFtZV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0bm9kZVtuYW1lXSA9IHRvVmFsXHJcblx0XHRcdFx0XHRlbHNlIGlmIGRlbHRhID49IHBvaW50LnN0YXJ0XHJcblx0XHRcdFx0XHRcdGlmIHBvaW50LmZ1bmNcclxuXHRcdFx0XHRcdFx0XHR0RnVuYyA9IHRpbWluZ0Z1bmN0aW9uc1twb2ludC5mdW5jXVxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0dEZ1bmMgPSB0aW1pbmdGdW5jdGlvbnMubGluZWFyXHJcblx0XHRcdFx0XHRcdCNcclxuXHRcdFx0XHRcdFx0Zm9yIG5hbWUsIHRvVmFsIG9mIHBvaW50LnRvXHJcblx0XHRcdFx0XHRcdFx0cHJvcCA9IG5vZGVbbmFtZV1cclxuXHRcdFx0XHRcdFx0XHR1bmxlc3MgcHJvcHNVc2VkW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1tuYW1lXSA9IHByb3BcclxuXHRcdFx0XHRcdFx0XHRcdHByb3BzVXNlZFtuYW1lXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRwcm9wIHx8PSAwXHJcblx0XHRcdFx0XHRcdFx0aWYgdG9WYWwuY29uc3RydWN0b3IgPT0gTnVtYmVyXHJcblx0XHRcdFx0XHRcdFx0XHR0aW1lID0gdEZ1bmMoKGRlbHRhIC0gcG9pbnQuc3RhcnQpIC8gKHBvaW50LmVuZCAtIHBvaW50LnN0YXJ0KSlcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVbbmFtZV0gPSAodG9WYWwgLSBwcm9wKSAqIHRpbWUgKyBwcm9wXHJcblx0XHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZVtuYW1lXSA9IHRvVmFsXHJcblx0XHR0aGlzXHJcblxyXG5cdHJlY2l2ZVByb3BzOiAobm9kZSkgLT5cclxuXHRcdHByb3BzID0gQW5pbWF0aW9uLnByb3BzXHJcblx0XHRwcm9wc1VzZWQgPSBBbmltYXRpb24ucHJvcHNVc2VkXHJcblx0XHRmb3IgbmFtZSwgdXNlIG9mIHByb3BzVXNlZFxyXG5cdFx0XHRpZiB1c2VcclxuXHRcdFx0XHRub2RlW25hbWVdID0gcHJvcHNbbmFtZV1cclxuXHRcdFx0XHRkZWxldGUgcHJvcHNVc2VkW25hbWVdXHJcblx0XHR0aGlzXHJcblxyXG5cdGNyZWF0ZVdvcmtGcmFtZTogLT5cclxuXHRcdEBsb29wID0gZmFsc2VcclxuXHRcdEBmcmFtZSA9XHJcblx0XHRcdHdvcms6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRzdGFydDogMFxyXG5cdFx0XHRcdFx0ZW5kOiAwXHJcblx0XHRcdFx0XHR0bzoge31cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdHRoaXNcclxuXHJcblx0cmVzZXRXb3JrOiAtPlxyXG5cdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0Zm9yIG5hbWUsIHVzZSBvZiBwcm9wc1VzZWRcclxuXHRcdFx0aWYgdXNlIHRoZW4gcHJvcHNVc2VkW25hbWVdID0gZmFsc2VcclxuXHRcdHRoaXNcclxuXHJcblx0Y2xlYXJXb3JrOiAtPlxyXG5cdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0YU9iaiA9IEBmcmFtZS53b3JrWzBdXHJcblx0XHRhT2JqLnN0YXJ0ID0gYU9iai5lbmQgPSAwXHJcblx0XHR0byA9IFxyXG5cdFx0Zm9yIG5hbWUsIF8gb2YgdG9cclxuXHRcdFx0ZGVsZXRlIHRvW25hbWVdXHJcblx0XHR0aGlzXHJcblxyXG5cdGFuaW1hdGVQcm9wczogKHByb3BzLCBkdXJhdGlvbiwgZnVuYykgLT5cclxuXHRcdEBkdXJhdGlvbiA9IGR1cmF0aW9uXHJcblx0XHRhT2JqID0gQGZyYW1lLndvcmtbMF1cclxuXHRcdGFPYmouZW5kID0gZHVyYXRpb25cclxuXHRcdGFPYmouZnVuYyA9IGZ1bmNcclxuXHRcdHRvID0gYU9iai50b1xyXG5cdFx0Zm9yIG5hbWUsIHByb3Agb2YgcHJvcHNcclxuXHRcdFx0dG9bbmFtZV0gPSBwcm9wXHJcblx0XHRAcmVzZXQoKVxyXG5cdFx0dGhpc1xyXG5cclxuZXhwb3J0IHsgQW5pbWF0aW9uRGF0YSwgQW5pbWF0aW9uIH0iLCJpbXBvcnQgeyBTcHJpdGUgfSBmcm9tICcuL3Nwcml0ZSdcclxuaW1wb3J0IHsgQW5pbWF0aW9uIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcblxyXG5jbGFzcyBNb2RlbERhdGFcclxuXHRAY2FjaGU6IFtdXHJcblxyXG5cdEBsb2FkOiAobG9hZGVyLCBmaWxlKSAtPlxyXG5cdFx0bW9kZWwgPSBNb2RlbERhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBtb2RlbFxyXG5cdFx0XHRtb2RlbCA9IG5ldyBNb2RlbERhdGFcclxuXHRcdFx0bW9kZWwubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0TW9kZWxEYXRhLmNhY2hlW2ZpbGVdID0gbW9kZWxcclxuXHRcdG1vZGVsXHJcblxyXG5cdGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRsb2FkZXIubG9hZEpzb24gZmlsZSwgKGRhdGEpID0+XHJcblx0XHRcdGlmIGRhdGFcclxuXHRcdFx0XHRmb3Iga2V5LCB2YWx1ZSBvZiBkYXRhXHJcblx0XHRcdFx0XHR0aGlzW2tleV0gPSB2YWx1ZVxyXG5cclxuXHRcdFx0XHRpZiBAaW1hZ2VzXHJcblx0XHRcdFx0XHRpbWFnZXNEYXRhID0gQGltYWdlc1xyXG5cdFx0XHRcdFx0QGltYWdlcyA9IFtdXHJcblx0XHRcdFx0XHRmb3Iga2V5LCBpbWFnZSBvZiBpbWFnZXNEYXRhXHJcblx0XHRcdFx0XHRcdEBpbWFnZXNba2V5XSA9IGxvYWRlci5sb2FkSW1hZ2UgaW1hZ2VcclxuXHJcblx0XHRcdFx0aWYgQHNwcml0ZXNcclxuXHRcdFx0XHRcdHNwcml0ZXNEYXRhID0gQHNwcml0ZXNcclxuXHRcdFx0XHRcdEBzcHJpdGVzID0gW11cclxuXHRcdFx0XHRcdGZvciBrZXksIHNwcml0ZSBvZiBzcHJpdGVzRGF0YVxyXG5cdFx0XHRcdFx0XHRAc3ByaXRlc1trZXldID0gU3ByaXRlLmxvYWQgbG9hZGVyLCBzcHJpdGVcclxuXHJcblx0XHRcdFx0aWYgQG1vZGVsc1xyXG5cdFx0XHRcdFx0bW9kZWxzRGF0YSA9IEBtb2RlbHNcclxuXHRcdFx0XHRcdEBtb2RlbHMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yIGtleSwgbW9kZWwgb2YgbW9kZWxzRGF0YVxyXG5cdFx0XHRcdFx0XHRAbW9kZWxzW2tleV0gPSBNb2RlbERhdGEubG9hZCBsb2FkZXIsIG1vZGVsXHJcblxyXG5cdFx0XHRcdG5vZGVzTG9hZCA9IChub2Rlcywgbm9kZVBhdGggPSAnJykgLT5cclxuXHRcdFx0XHRcdGZvciBuYW1lLCBub2RlIG9mIG5vZGVzXHJcblx0XHRcdFx0XHRcdG5vZGUubm9kZVBhdGggPSBub2RlUGF0aCArIG5hbWVcclxuXHRcdFx0XHRcdFx0bm9kZS5ub2RlTmFtZSA9ICdAJyArIG5hbWVcclxuXHRcdFx0XHRcdFx0aWYgbm9kZS5iZWZvcmVcclxuXHRcdFx0XHRcdFx0XHRub2Rlc0xvYWQgbm9kZS5iZWZvcmUsIG5vZGUubm9kZVBhdGggKyAnPCdcclxuXHRcdFx0XHRcdFx0aWYgbm9kZS5hZnRlclxyXG5cdFx0XHRcdFx0XHRcdG5vZGVzTG9hZCBub2RlLmFmdGVyLCBub2RlLm5vZGVQYXRoICsgJz4nXHJcblxyXG5cdFx0XHRcdGlmIEBib25lc1xyXG5cdFx0XHRcdFx0bm9kZXNMb2FkIEBib25lc1xyXG5cclxuXHJcbmRyYXdUeXBlT2JqID1cclxuXHRsaW5lOiAoZykgLT5cclxuXHRcdGcubW92ZVRvIEB4MSB8fCAwLCBAeTEgfHwgMFxyXG5cdFx0Zy5saW5lVG8gQHgyIHx8IDAsIEB5MiB8fCAwXHJcblx0XHR0aGlzXHJcblxyXG5cdHJlY3Q6IChnKSAtPlxyXG5cdFx0Zy5yZWN0IEB4IHx8IDAsIEB5IHx8IDAsIEB3aWR0aCB8fCAxLCBAaGVpZ2h0IHx8IDFcclxuXHRcdHRoaXNcclxuXHJcblx0cmVjdFJvdW5kOiAoZykgLT5cclxuXHRcdEBub0Nsb3NlID0gZmFsc2VcclxuXHRcdHggPSBAeCB8fCAwXHJcblx0XHR5ID0gQHkgfHwgMFxyXG5cdFx0dyA9IEB3aWR0aFxyXG5cdFx0aCA9IEBoZWlnaHRcclxuXHRcdHIgPSBAcmFkaXVzXHJcblx0XHRpZiB3IDwgMiAqIHIgdGhlbiByID0gdyAvIDJcclxuXHRcdGlmIGggPCAyICogciB0aGVuIHIgPSBoIC8gMlxyXG5cclxuXHRcdGcubW92ZVRvIHggKyByLCB5XHJcblx0XHRnLmFyY1RvICB4ICsgdywgeSwgICAgIHggKyB3LCB5ICsgaCwgclxyXG5cdFx0Zy5hcmNUbyAgeCArIHcsIHkgKyBoLCB4LCAgICAgeSArIGgsIHJcclxuXHRcdGcuYXJjVG8gIHgsICAgICB5ICsgaCwgeCwgICAgIHksICAgICByXHJcblx0XHRnLmFyY1RvICB4LCAgICAgeSwgICAgIHggKyB3LCB5LCAgICAgclxyXG5cdFx0dGhpc1xyXG5cclxuXHRhcmM6IChnKSAtPlxyXG5cdFx0Zy5hcmMoXHJcblx0XHRcdEB4IHx8IDAsXHJcblx0XHRcdEB5IHx8IDAsXHJcblx0XHRcdEByYWRpdXMsXHJcblx0XHRcdChAc3RhcnRBbmdsZSB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAZW5kQW5nbGUgfHwgMzYwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdGlmIEBjbG9ja3dpc2UgdGhlbiBmYWxzZSBlbHNlIHRydWUpXHJcblx0XHR0aGlzXHJcblxyXG5cdGVsaXBzZTogKGcpIC0+XHJcblx0XHRnLmVsbGlwc2UoXHJcblx0XHRcdEB4IHx8IDAsXHJcblx0XHRcdEB5IHx8IDAsXHJcblx0XHRcdEByeCxcclxuXHRcdFx0QHJ5LFxyXG5cdFx0XHQoQHJvdGF0aW9uIHx8IDApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0KEBzdGFydEFuZ2xlIHx8IDApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0KEBlbmRBbmdsZSB8fCAzNjApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0aWYgQGNsb2Nrd2lzZSB0aGVuIGZhbHNlIGVsc2UgdHJ1ZSlcclxuXHRcdHRoaXNcclxuXHJcblx0cGF0aDogKGcpIC0+XHJcblx0XHR4ID0gQHggfHwgMFxyXG5cdFx0eSA9IEB5IHx8IDBcclxuXHRcdGlmIHR5cGVvZiBAcGF0aCA9PSAnc3RyaW5nJ1xyXG5cdFx0XHRAcGF0aCA9IG5ldyBQYXRoMkQgQHBhdGhcclxuXHRcdCNcclxuXHRcdEBub0Nsb3NlID0gdHJ1ZVxyXG5cdFx0Zy50cmFuc2xhdGUgeCwgeVxyXG5cdFx0ZHJhdyA9IEBkcmF3IHx8ICdmJnMnXHJcblx0XHRpZiBkcmF3ID09ICdmJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuZmlsbCBAcGF0aFxyXG5cdFx0aWYgZHJhdyA9PSAncycgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0XHRnLnN0cm9rZSBAcGF0aFxyXG5cdFx0dGhpc1xyXG5cclxuXHRub2RlOiAoZywgbW9kZWwsIG9wYWNpdHksIGRhdGEpIC0+XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0IyBTYXZlIGN1cnJlbnQgbW9kZWwgZGF0YVxyXG5cdFx0dERhdGEgPSBtb2RlbC5kYXRhXHJcblx0XHQjIFNlbGVjdCBtb2RlbFxyXG5cdFx0ZGF0YSA9IGRhdGEgfHwgdERhdGEubW9kZWxzP1tAbW9kZWxdXHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdG1vZGVsLmRhdGEgPSBkYXRhXHJcblx0XHRcdG5vZGVzID0gZGF0YS5ib25lc1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRub2RlcyA9IG1vZGVsLmRhdGEuYm9uZXNcclxuXHRcdGlmIG5vZGVzXHJcblx0XHRcdCMgU2VsZWN0IG5vZGUgaW4gbW9kZWxcclxuXHRcdFx0bm9kZSA9IEBub2RlXHJcblx0XHRcdGlmIHR5cGVvZiBub2RlID09ICdzdHJpbmcnXHJcblx0XHRcdFx0bm9kZSA9IG5vZGVzW25vZGVdXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRyb290ID0gbm9kZXNcclxuXHRcdFx0XHRmb3IgcGF0aCBpbiBub2RlXHJcblx0XHRcdFx0XHRyb290ID0gcm9vdFtwYXRoXVxyXG5cdFx0XHRcdG5vZGUgPSByb290XHJcblx0XHRcdGlmIG5vZGVcclxuXHRcdFx0XHRnLnRyYW5zbGF0ZSBAeCB8fCAwLCBAeSB8fCAwXHJcblx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cdFx0XHRcdCMgUmVjaXZlIG1vZGVsIGRhdGFcclxuXHRcdG1vZGVsLmRhdGEgPSB0RGF0YVxyXG5cdFx0dGhpc1xyXG5cclxuXHRhdHRhY2g6IChnLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdGRhdGEgPSBtb2RlbC5hdHRhY2htZW50W0BhdHRhY2hdXHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdGRyYXdUeXBlT2JqLm5vZGUuY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eSwgZGF0YVxyXG5cdFx0dGhpc1xyXG5cclxuXHRpbWFnZTogKGcsIG1vZGVsKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdGltYWdlID0gbW9kZWwuZGF0YS5pbWFnZXNbQGltYWdlXVxyXG5cdFx0aWYgQHdpZHRoIHx8IEBoZWlnaHRcclxuXHRcdFx0Zy5kcmF3SW1hZ2UgaW1hZ2UsIEB4IHx8IDAsIEB5IHx8IDAsIEB3aWR0aCwgQGhlaWdodFxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRnLmRyYXdJbWFnZSBpbWFnZSwgQHggfHwgMCwgQHkgfHwgMFxyXG5cdFx0dGhpc1xyXG5cclxuXHRzcHJpdGU6IChnLCBtb2RlbCkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHRzcHJpdGUgPSBAc3ByaXRlXHJcblx0XHRpZiBzcHJpdGUuY29uc3RydWN0b3IgPT0gU3RyaW5nXHJcblx0XHRcdEBzcHJpdGUgPSBzcHJpdGUgPSBtb2RlbC5kYXRhLnNwcml0ZXNbc3ByaXRlXVxyXG5cdFx0c3ByaXRlLmRyYXcgZywgQGZyYW1lLCBAeCB8fCAwLCBAeSB8fCAwLCBAaW5kZXhcclxuXHRcdHRoaXNcclxuXHJcblx0dGV4dDogKGcpIC0+XHJcblx0XHRpZiBAZHJhdyAhPSB0cnVlXHJcblx0XHRcdEBkcmF3VGV4dCA9IEBkcmF3XHJcblx0XHRkcmF3ID0gQGRyYXdUZXh0XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0I1xyXG5cdFx0aWYgQGZvbnQgdGhlbiBnLmZvbnQgPSBAZm9udFxyXG5cdFx0aWYgQHRleHRBbGlnbiB0aGVuIGcudGV4dEFsaWduID0gQHRleHRBbGlnblxyXG5cdFx0aWYgQHRleHRCYXNlbGluZSAhPSBudWxsIHRoZW4gZy50ZXh0QmFzZWxpbmUgPSBAdGV4dEJhc2VsaW5lXHJcblx0XHRpZiBAZGlyZWN0aW9uIHRoZW4gZy5kaXJlY3Rpb24gPSBAZGlyZWN0aW9uXHJcblx0XHQjXHJcblx0XHRpZiBkcmF3ID09ICdmJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuZmlsbFRleHQgQHRleHQsIEB4IHx8IDAsIEB5IHx8IDAsIEBtYXhXaWR0aFxyXG5cdFx0aWYgZHJhdyA9PSAncycgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0XHRnLnN0cm9rZVRleHQgQHRleHQsIEB4IHx8IDAsIEB5IHx8IDAsIEBtYXhXaWR0aFxyXG5cdFx0dGhpc1xyXG5cclxuc3R5bGVUeXBlRnVuYyA9XHJcblx0bGluZWFyOiAoZykgLT5cclxuXHRcdGdyYWRpZW50ID0gZy5jcmVhdGVMaW5lYXJHcmFkaWVudCBAeDAgfHwgMCwgQHkwIHx8IDAsIEB4MSB8fCAwLCBAeTEgfHwgMFxyXG5cdFx0Zm9yIGNvbG9yU3RvcCBpbiBAY29sb3JTdG9wc1xyXG5cdFx0XHRncmFkaWVudC5hZGRDb2xvclN0b3AgY29sb3JTdG9wLnBvcyB8fCAwLCBjb2xvclN0b3AuY29sb3JcclxuXHRcdGdyYWRpZW50XHJcblxyXG5cdHJhZGlhbDogKGcpIC0+XHJcblx0XHRncmFkaWVudCA9IGcuY3JlYXRlUmFkaWFsR3JhZGllbnQgQHgwIHx8IDAsIEB5MCB8fCAwLCBAcjAgfHwgMCwgQHgxIHx8IDAsIEB5MSB8fCAwLCBAcjEgfHwgMFxyXG5cdFx0Zm9yIGNvbG9yU3RvcCBpbiBAY29sb3JTdG9wc1xyXG5cdFx0XHRncmFkaWVudC5hZGRDb2xvclN0b3AgY29sb3JTdG9wLnBvcyB8fCAwLCBjb2xvclN0b3AuY29sb3JcclxuXHRcdGdyYWRpZW50XHJcblxyXG5cdHBhdHRlcm46IChnLCBtb2RlbCkgLT5cclxuXHRcdGltYWdlID0gbW9kZWwuZGF0YS5pbWFnZXNbQGltYWdlXVxyXG5cdFx0Zy5jcmVhdGVQYXR0ZXJuIGltYWdlLCBAcmVwZXRpdGlvbiB8fCBcInJlcGVhdFwiXHJcblxyXG5pbml0U3R5bGUgPSAoZywgbW9kZWwsIHN0eWxlKSAtPlxyXG5cdHN0eWxlVHlwZUZ1bmNbc3R5bGUudHlwZV0/LmNhbGwgc3R5bGUsIGcsIG1vZGVsXHJcblxyXG5zZXREcmF3U3R5bGUgPSAoZywgbW9kZWwpIC0+XHJcblx0c3Ryb2tlID0gQHN0cm9rZVxyXG5cdGlmIHN0cm9rZVxyXG5cdFx0aWYgc3Ryb2tlLmNvbnN0cnVjdG9yID09IE9iamVjdFxyXG5cdFx0XHRAc3Ryb2tlID0gaW5pdFN0eWxlIGcsIG1vZGVsLCBzdHJva2VcclxuXHRcdGcuc3Ryb2tlU3R5bGUgPSBAc3Ryb2tlXHJcblx0ZmlsbCA9IEBmaWxsXHJcblx0aWYgZmlsbFxyXG5cdFx0aWYgZmlsbC5jb25zdHJ1Y3RvciA9PSBPYmplY3RcclxuXHRcdFx0QGZpbGwgPSBpbml0U3R5bGUgZywgbW9kZWwsIGZpbGxcclxuXHRcdGcuZmlsbFN0eWxlID0gQGZpbGxcclxuXHRpZiBAbGluZVdpZHRoICE9IG51bGwgdGhlbiBnLmxpbmVXaWR0aCA9IEBsaW5lV2lkdGhcclxuXHRpZiBAbGluZUNhcCAhPSBudWxsIHRoZW4gZy5saW5lQ2FwID0gQGxpbmVDYXBcclxuXHRpZiBAbGluZUpvaW4gdGhlbiBnLmxpbmVKb2luID0gQGxpbmVKb2luXHJcblx0aWYgQGxpbmVEYXNoT2Zmc2V0ICE9IG51bGwgdGhlbiBnLmxpbmVEYXNoT2Zmc2V0ID0gQGxpbmVEYXNoT2Zmc2V0XHJcblx0dGhpc1xyXG5cclxuZHJhd05vZGUgPSAoZywgbW9kZWwsIG9wYWNpdHkpIC0+XHJcblx0Zy5zYXZlKClcclxuXHRtb2RlbC5hbmltYXRpb24uYW5pbWF0ZSB0aGlzXHJcblx0Zy50cmFuc2Zvcm0gQHNjYWxlWCB8fCAxLCBAc2tld1kgfHwgMCwgQHNrZXdYIHx8IDAsIEBzY2FsZVkgfHwgMSwgQG9yaWdYIHx8IDAsIEBvcmlnWSB8fCAwXHJcblx0aWYgQGFuZ2xlIHRoZW4gZy5yb3RhdGUgQGFuZ2xlICogTWF0aC5QSSAvIDE4MFxyXG5cdHNldERyYXdTdHlsZS5jYWxsIHRoaXMsIGcsIG1vZGVsXHJcblx0IyBTaGFkb3dzXHJcblx0aWYgQG5vU2hhZG93XHJcblx0XHRnLnNoYWRvd0JsdXIgPSAwXHJcblx0XHRnLnNoYWRvd09mZnNldFggPSAwXHJcblx0XHRnLnNoYWRvd09mZnNldFkgPSAwXHJcblx0aWYgQHNoYWRvd0JsdXIgIT0gbnVsbCB0aGVuIGcuc2hhZG93Qmx1ciA9IEBzaGFkb3dCbHVyXHJcblx0aWYgQHNoYWRvd0NvbG9yICE9IG51bGwgdGhlbiBnLnNoYWRvd0NvbG9yID0gQHNoYWRvd0NvbG9yXHJcblx0aWYgQHNoYWRvd09mZnNldFggIT0gbnVsbCB0aGVuIGcuc2hhZG93T2Zmc2V0WCA9IEBzaGFkb3dPZmZzZXRYXHJcblx0aWYgQHNoYWRvd09mZnNldFkgIT0gbnVsbCB0aGVuIGcuc2hhZG93T2Zmc2V0WSA9IEBzaGFkb3dPZmZzZXRZXHJcblx0Zy5nbG9iYWxBbHBoYSA9IG9wYWNpdHkgKiAoaWYgQG9wYWNpdHkgPT0gbnVsbCB0aGVuIDEgZWxzZSBAb3BhY2l0eSlcclxuXHJcblx0aWYgQGJlZm9yZVxyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLnJlY2l2ZVByb3BzIHRoaXNcclxuXHRcdCNcclxuXHRcdGZvciBrZXksIG5vZGUgb2YgQGJlZm9yZVxyXG5cdFx0XHRpZiAhbm9kZS5oaWRlXHJcblx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cdFx0I1xyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmFuaW1hdGUgdGhpc1xyXG5cclxuXHRnLmJlZ2luUGF0aCgpXHJcblx0ZHJhd1R5cGVPYmpbQHR5cGVdPy5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0aWYgIUBub0Nsb3NlIHRoZW4gZy5jbG9zZVBhdGgoKVxyXG5cclxuXHRkcmF3ID0gQGRyYXcgfHwgJ2YmcydcclxuXHRpZiBkcmF3ID09ICdmJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLmZpbGwoKVxyXG5cdGlmIGRyYXcgPT0gJ3MnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdGcuc3Ryb2tlKClcclxuXHJcblx0aWYgQGNsaXBcclxuXHRcdGcuY2xpcCgpXHJcblxyXG5cdG1vZGVsLmFuaW1hdGlvbi5yZWNpdmVQcm9wcyB0aGlzXHJcblxyXG5cdGlmIEBhZnRlclxyXG5cdFx0Zm9yIGtleSwgbm9kZSBvZiBAYWZ0ZXJcclxuXHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgbW9kZWwsIG9wYWNpdHlcclxuXHJcblx0aWYgTW9kZWwuZHJhd09yaWdpblxyXG5cdFx0Zy5maWxsU3R5bGUgPSAnI2YwMCdcclxuXHRcdGcuc2hhZG93Qmx1ciA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WCA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WSA9IDBcclxuXHRcdGcuZmlsbFJlY3QgLTIsIC0yLCA0LCA0XHJcblxyXG5cdGcucmVzdG9yZSgpXHJcblx0dGhpc1xyXG5cclxuXHJcbmRyYXdQYXJ0VHlwZSA9XHJcblx0cG9seTogKGcsIHZlcnRzLCBjYW1lcmEsIG1vZGVsKSAtPlxyXG5cdFx0diA9IHZlcnRzW0B2ZXJ0c1swXV1cclxuXHRcdHhjID0gY2FtZXJhLnhcclxuXHRcdHljID0gY2FtZXJhLnlcclxuXHRcdHp0ID0gY2FtZXJhLnpcclxuXHRcdHogPSAoKHYueiB8fCAxKSAqIHp0KVxyXG5cdFx0eCA9ICgodi54IHx8IDApICsgeGMpICogelxyXG5cdFx0eSA9ICgodi55IHx8IDApICsgeWMpICogelxyXG5cdFx0Zy5tb3ZlVG8geCwgeVxyXG5cdFx0bCA9IEB2ZXJ0cy5sZW5ndGggLSAxXHJcblx0XHRmb3IgaSBpbiBbMS4ubF1cclxuXHRcdFx0diA9IHZlcnRzW0B2ZXJ0c1tpXV07XHJcblx0XHRcdHogPSAoKHYueiB8fCAxKSAqIHp0KVxyXG5cdFx0XHR4ID0gKCh2LnggfHwgMCkgKyB4YykgKiB6XHJcblx0XHRcdHkgPSAoKHYueSB8fCAwKSArIHljKSAqIHpcclxuXHRcdFx0Zy5saW5lVG8geCwgeVxyXG5cdFx0dGhpc1xyXG5cclxuXHRwYXJ0OiAoZywgdmVydHMsIGNhbWVyYSwgbW9kZWwsIG9wYWNpdHkpIC0+XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0IyBTYXZlIG1vZGVsIGRhdGFcclxuXHRcdHREYXRhID0gbW9kZWwuZGF0YVxyXG5cdFx0IyBTZWxlY3QgbW9kZWxcclxuXHRcdGRhdGEgPSB0RGF0YS5tb2RlbHM/W0Btb2RlbF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0bW9kZWwuZGF0YSA9IGRhdGFcclxuXHRcdFx0cGFydHMgPSBkYXRhLnBhcnRzXHJcblx0XHRlbHNlXHJcblx0XHRcdHBhcnRzID0gbW9kZWwuZGF0YS5wYXJ0c1xyXG5cdFx0aWYgcGFydHNcclxuXHRcdFx0diA9IHZlcnRzW0B2ZXJ0XVxyXG5cdFx0XHRjID1cclxuXHRcdFx0XHR4OiBjYW1lcmEueCArICh2LnggfHwgMClcclxuXHRcdFx0XHR5OiBjYW1lcmEueSArICh2LnkgfHwgMClcclxuXHRcdFx0XHR6OiBjYW1lcmEueiAqICh2LnogfHwgMSlcclxuXHJcblx0XHRcdHBhcnQgPSBwYXJ0c1tAcGFydF1cclxuXHRcdFx0aWYgcGFydFxyXG5cdFx0XHRcdHRQYXJ0cyA9IG1vZGVsLnBhcnRzXHJcblx0XHRcdFx0bW9kZWwucGFydHMgPSBwYXJ0c1xyXG5cdFx0XHRcdGZvciBmYWNlIGluIHBhcnQuZmFjZXNcclxuXHRcdFx0XHRcdGRyYXdQYXJ0LmNhbGwgZmFjZSwgZywgbW9kZWwsIGMsIG9wYWNpdHlcclxuXHRcdFx0XHRtb2RlbC5wYXJ0cyA9IHRQYXJ0c1xyXG5cdFx0bW9kZWwuZGF0YSA9IHREYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdG5vZGU6IChnLCB2ZXJ0cywgY2FtZXJhLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnRdLCBjYW1lcmFcclxuXHRcdFx0LmFwcGx5IGdcclxuXHRcdGRyYXdUeXBlT2JqLm5vZGUuY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cdFx0dGhpc1xyXG5cclxuXHRhdHRhY2g6IChnLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnRdLCBjYW1lcmFcclxuXHRcdFx0LmFwcGx5IGdcclxuXHRcdGRhdGEgPSBtb2RlbC5hdHRhY2htZW50W0BhdHRhY2hdXHJcblx0XHRpZiBkYXRhXHJcblx0XHRcdGRyYXdUeXBlT2JqLm5vZGUuY2FsbCB0aGlzLCBnLCBtb2RlbCwgb3BhY2l0eSwgZGF0YVxyXG5cdFx0dGhpc1xyXG5cclxuXHRlbGlwc2U6IChnLCB2ZXJ0cywgY2FtZXJhKSAtPlxyXG5cdFx0diA9IHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnQxXSwgY2FtZXJhXHJcblx0XHR4MSA9IHYueFxyXG5cdFx0eTEgPSB2LnlcclxuXHRcdHYgPSB0cmFuc2Zvcm1WZXJ0IHZlcnRzW0B2ZXJ0Ml0sIGNhbWVyYVxyXG5cdFx0eDIgPSB2LnhcclxuXHRcdHkyID0gdi55XHJcblx0XHRyeCA9ICh4MiAtIHgxKSAvIDJcclxuXHRcdHJ5ID0gKHkyIC0geTEpIC8gMlxyXG5cdFx0Zy5lbGxpcHNlKFxyXG5cdFx0XHR4MSArIHJ4LFxyXG5cdFx0XHR5MSArIHJ5LFxyXG5cdFx0XHRyeCxcclxuXHRcdFx0cnksXHJcblx0XHRcdChAcm90YXRpb24gfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQHN0YXJ0QW5nbGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQGVuZEFuZ2xlIHx8IDM2MCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHRpZiBAY2xvY2t3aXNlIHRoZW4gZmFsc2UgZWxzZSB0cnVlKVxyXG5cdFx0dGhpc1xyXG5cclxuXHJcbmRyYXdQYXJ0ID0gKGcsIG1vZGVsLCBjYW1lcmEsIG9wYWNpdHkpIC0+XHJcblx0Zy5zYXZlKClcclxuXHRzdHJva2UgPSBAc3Ryb2tlXHJcblx0c2V0RHJhd1N0eWxlLmNhbGwgdGhpcywgZywgbW9kZWxcclxuXHRnLmdsb2JhbEFscGhhID0gb3BhY2l0eSAqIChpZiBAb3BhY2l0eSA9PSBudWxsIHRoZW4gMSBlbHNlIEBvcGFjaXR5KVxyXG5cclxuXHRnLmJlZ2luUGF0aCgpXHJcblx0ZHJhd1BhcnRUeXBlW0B0eXBlIHx8ICdwb2x5J10/LmNhbGwgdGhpcywgZywgbW9kZWwuZGF0YS52ZXJ0cywgY2FtZXJhLCBtb2RlbCwgb3BhY2l0eVxyXG5cdGlmICFAbm9DbG9zZSB0aGVuIGcuY2xvc2VQYXRoKClcclxuXHJcblx0ZHJhdyA9IEBkcmF3IHx8ICdmJnMnXHJcblx0aWYgZHJhdyA9PSAnZicgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0Zy5maWxsKClcclxuXHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLnN0cm9rZSgpXHJcblxyXG5cdGcucmVzdG9yZSgpXHJcblx0dGhpc1xyXG5cclxudHJzZk9iaiA9XHJcblx0eDogMFxyXG5cdHk6IDBcclxuXHRzY2FsZTogMVxyXG5cdGFwcGx5OiAoZykgLT5cclxuXHRcdGcudHJhbnNmb3JtIEBzY2FsZSwgMCwgMCwgQHNjYWxlLCBAeCwgQHlcclxuXHJcblxyXG5jbGFzcyBNb2RlbFxyXG5cdEB0cmFuc2Zvcm06ICh4LCB5LCB6LCBjYW1lcmEpIC0+XHJcblx0XHR6ID0gY2FtZXJhLnogKiB6XHJcblx0XHR0cnNmT2JqLnggPSAoeCArIGNhbWVyYS54KSAqIHpcclxuXHRcdHRyc2ZPYmoueSA9ICh5ICsgY2FtZXJhLnkpICogelxyXG5cdFx0dHJzZk9iai5zY2FsZSA9IHpcclxuXHRcdHRyc2ZPYmpcclxuXHJcblx0Y29uc3RydWN0b3I6IChAZGF0YSkgLT5cclxuXHRcdEBhdHRhY2htZW50ID0gW11cclxuXHRcdEBhbmltYXRpb24gPSBuZXcgQW5pbWF0aW9uXHJcblxyXG5cdHNldERhdGE6IChAZGF0YSkgLT5cclxuXHJcblx0ZHJhdzJEOiAoZywgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRmb3Iga2V5LCBub2RlIG9mIGJvbmVzXHJcblx0XHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCB0aGlzLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdOb2RlOiAoZywgbm9kZSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRub2RlID0gYm9uZXNbbm9kZV1cclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgdGhpcywgb3BhY2l0eVxyXG5cclxuXHRkcmF3UGFydDogKGcsIHBhcnQsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRmb3IgZmFjZSBpbiBwYXJ0LmZhY2VzXHJcblx0XHRcdGRyYXdQYXJ0LmNhbGwgZmFjZSwgZywgdGhpcywgY2FtZXJhLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdQYXJ0czogKGcsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBwYXJ0cyA9IEBkYXRhPy5wYXJ0c1xyXG5cdFx0XHRmb3IgXywgcGFydCBvZiBwYXJ0c1xyXG5cdFx0XHRcdGlmICFwYXJ0LmhpZGVcclxuXHRcdFx0XHRcdGZvciBmYWNlIGluIHBhcnQuZmFjZXNcclxuXHRcdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCB0aGlzLCBjYW1lcmEsIG9wYWNpdHlcclxuXHJcbnRyYW5zZm9ybSA9IE1vZGVsLnRyYW5zZm9ybVxyXG5cclxudHJhbnNmb3JtVmVydCA9ICh2LCBjYW1lcmEpIC0+XHJcblx0dHJhbnNmb3JtIHYueCB8fCAwLCB2LnkgfHwgMCwgdi56IHx8IDEsIGNhbWVyYVxyXG5cclxuZXhwb3J0IHsgTW9kZWxEYXRhLCBNb2RlbCB9IiwiY2xhc3MgRXZlbnRFbW1pdGVyXHJcblx0aGFuZGxlcnM6IFtdXHJcblxyXG5cdG9uOiAoZXZlbnQsIGNhbGxiYWNrKSAtPlxyXG5cdFx0aWYgY2FsbGJhY2tcclxuXHRcdFx0aGFuZGxlciA9IEBoYW5kbGVyc1tldmVudF1cclxuXHRcdFx0aWYgIWhhbmRsZXJcclxuXHRcdFx0XHRAaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlciA9IFtdXHJcblx0XHRcdGlmIGhhbmRsZXIuaW5kZXhPZihjYWxsYmFjaykgPCAwXHJcblx0XHRcdFx0aGFuZGxlci5wdXNoIGNhbGxiYWNrXHJcblx0XHR0aGlzXHJcblxyXG5cdG9mZjogKGV2ZW50LCBjYWxsYmFjaykgLT5cclxuXHRcdGlmIGNhbGxiYWNrXHJcblx0XHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRcdGlmIGhhbmRsZXJcclxuXHRcdFx0XHRpbmRleCA9IGhhbmRsZXIuaW5kZXhPZiBjYWxsYmFja1xyXG5cdFx0XHRcdGlmIGluZGV4ID49IDBcclxuXHRcdFx0XHRcdGhhbmRsZXIuc3BsaWNlIGluZGV4LCAxXHJcblx0XHR0aGlzXHJcblxyXG5cdHRyaWdnZXI6IChldmVudCwgYXJncykgLT5cclxuXHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRpZiBoYW5kbGVyXHJcblx0XHRcdGZvciBjYWxsYmFjayBpbiBoYW5kbGVyXHJcblx0XHRcdFx0Y2FsbGJhY2suYXBwbHkgdGhpcywgYXJnc1xyXG5cdFx0dGhpc1xyXG5cclxuXHRyZW1vdmVFdmVudDogKGV2ZW50KSAtPlxyXG5cdFx0ZGVsZXRlIEBoYW5kbGVyc1tldmVudF1cclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IEV2ZW50RW1taXRlciB9IiwiaW1wb3J0IHsgRXZlbnRFbW1pdGVyIH0gZnJvbSAnLi9ldmVudHMnXHJcblxyXG4jIEV2ZW50czpcclxuIyAnY2hhbmdlcGVyY2VudCcgdHJpZ2dlciB3aGVuIHNvbWUgcmVzb3JjZXMgbG9hZGVkXHJcbiMgJ2xvYWQnIHRyaWdnZXIgd2hlbiBhbGwgcmVzb3JjZXMgbG9hZGVkXHJcblxyXG5jbGFzcyBMb2FkZXIgZXh0ZW5kcyBFdmVudEVtbWl0ZXJcclxuXHRsb2FkUmVzTnVtYmVyID0gMFxyXG5cdGFsbFJlc0xvYWRlciA9IDBcclxuXHJcblx0cmVzZXQ6ICgpIC0+XHJcblx0XHRsb2FkUmVzTnVtYmVyID0gYWxsUmVzTG9hZGVyID0gMFxyXG5cclxuXHRnZXRQZXJjZW50OiAtPlxyXG5cdFx0MSAtIGlmIGFsbFJlc0xvYWRlciAhPSAwIHRoZW4gbG9hZFJlc051bWJlciAvIGFsbFJlc0xvYWRlciBlbHNlIDBcclxuXHJcblx0dXBkYXRlUGVyY2VudDogKCkgLT5cclxuXHRcdEB0cmlnZ2VyICdjaGFuZ2VwZXJjZW50JywgWyBAZ2V0UGVyY2VudCgpIF1cclxuXHJcblx0bG9hZDogKGNhbGxiYWNrKSAtPlxyXG5cdFx0X3RoaXMgPSB0aGlzXHJcblx0XHRsb2FkUmVzTnVtYmVyKytcclxuXHRcdGFsbFJlc0xvYWRlcisrXHJcblx0XHQjIEB1cGRhdGVQZXJjZW50KClcclxuXHRcdC0+XHJcblx0XHRcdGNhbGxiYWNrPy5hcHBseSBfdGhpcywgYXJndW1lbnRzXHJcblx0XHRcdGxvYWRSZXNOdW1iZXItLVxyXG5cdFx0XHRpZiBsb2FkUmVzTnVtYmVyIDw9IDBcclxuXHRcdFx0XHRfdGhpcy5yZXNldCgpXHJcblx0XHRcdFx0X3RoaXMudHJpZ2dlciAnbG9hZCdcclxuXHRcdFx0X3RoaXMudXBkYXRlUGVyY2VudCgpXHJcblxyXG5cdGxvYWRKc29uOiAoZmlsZSwgY2FsbGJhY2spIC0+XHJcblx0XHRjYWxsYmFjayA9IEBsb2FkIGNhbGxiYWNrXHJcblx0XHQkLmdldEpTT04gZmlsZSArICcuanNvbidcclxuXHRcdFx0LmRvbmUgY2FsbGJhY2tcclxuXHRcdFx0LmZhaWwgLT5cclxuXHRcdFx0XHRjYWxsYmFjayBudWxsXHJcblxyXG5cdGxvYWRJbWFnZTogKGZpbGUsIGNhbGxiYWNrKSAtPlxyXG5cdFx0Y2FsbGJhY2sgPSBAbG9hZCBjYWxsYmFja1xyXG5cdFx0aW1nID0gbmV3IEltYWdlXHJcblx0XHRpbWcub25sb2FkID0gLT5cclxuXHRcdFx0Y2FsbGJhY2sgaW1nXHJcblx0XHRpbWcuc3JjID0gZmlsZVxyXG5cdFx0aW1nXHJcblxyXG5leHBvcnQgeyBMb2FkZXIgfSIsImltcG9ydCB7IE1vZGVsRGF0YSwgTW9kZWwgfSBmcm9tICcuL21vZGVsJ1xyXG5pbXBvcnQgeyBBbmltYXRpb25EYXRhIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vbG9hZGVyJ1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkgLT5cclxuXHQkY2FudmFzID0gJCAnI2NhbnZhcydcclxuXHRjYW52YXMgPSAkY2FudmFzLmdldCAwXHJcblx0Y29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0ICcyZCcsIGFscGhhOiBmYWxzZVxyXG5cclxuXHRtb2RlbEZpbGUgPSAnbW9kZWxzL2Jhbm55J1xyXG5cdGxvYWRlciA9IG5ldyBMb2FkZXJcclxuXHRtb2RlbCA9IG5ldyBNb2RlbFxyXG5cdG1vZGVsRGF0YSA9IG5ldyBNb2RlbERhdGFcclxuXHRhbmltYXRpb25GcmFtZSA9IG51bGxcclxuXHRjYW1lcmEgPVxyXG5cdFx0Y2FudmFzOiBjYW52YXNcclxuXHRcdGc6IGNvbnRleHRcclxuXHRcdHg6IDBcclxuXHRcdHk6IDBcclxuXHRcdHo6IDFcclxuXHJcblx0cmVzaXplID0gLT5cclxuXHRcdGNhbnZhcy53aWR0aCA9ICQod2luZG93KS53aWR0aCgpXHJcblx0XHRjYW52YXMuaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnI2NhbnZhcycpLm9mZnNldCgpLnRvcFxyXG5cclxuXHRyZXNpemUoKVxyXG5cclxuXHQkKHdpbmRvdykub24gJ3Jlc2l6ZScsIHJlc2l6ZVxyXG5cclxuXHRtb2RlbFJlZnJlc2ggPSAtPlxyXG4jXHRcdGZvciBrZXksIF8gb2YgbW9kZWxEYXRhXHJcbiNcdFx0XHRkZWxldGUgbW9kZWxEYXRhW2tleV1cclxuXHRcdG1vZGVsRGF0YS5sb2FkIGxvYWRlciwgbW9kZWxGaWxlXHJcblx0XHJcblx0bG9hZGVyLm9uICdsb2FkJywgLT5cclxuXHRcdG1vZGVsLnNldERhdGEgbW9kZWxEYXRhXHJcblx0XHRpZiBtb2RlbC5hbmltYXRpb24uZGF0YVxyXG5cdFx0XHQjIG1vZGVsLmFuaW1hdGlvbi5zZXQgJ3Rlc3QnXHJcblx0XHRcdCNcclxuXHRcdFx0Y29udGFpbmVyID0gJCAnLmpzLWZyYW1lLWNvbnRhaW5lcidcclxuXHRcdFx0Y29udGFpbmVyLmVtcHR5KClcclxuXHRcdFx0Zm9yIGFuaW0sIF8gb2YgbW9kZWwuYW5pbWF0aW9uLmRhdGFcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kIFwiPGEgY2xhc3M9J2Ryb3Bkb3duLWl0ZW0ganMtZnJhbWUtc2VsZWN0JyBocmVmPScjJz4je2FuaW19PC9hPlwiXHJcblx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHRcdFx0JCgnLmpzLWZyYW1lLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRcdFx0YW5pbWF0aW9uRnJhbWUgPSAkKHRoaXMpLnRleHQoKVxyXG5cdFx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHJcblx0Y29uc29sZS5sb2cgbW9kZWxcclxuXHJcblx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblxyXG5cdHJlbmRlciA9IChkZWx0YSkgLT5cclxuXHRcdGNvbnRleHQuc2F2ZSgpXHJcblx0XHR3ID0gY2FudmFzLndpZHRoXHJcblx0XHRoID0gY2FudmFzLmhlaWdodFxyXG5cdFx0Y3ggPSB3IC8gMlxyXG5cdFx0Y3kgPSBoIC8gMlxyXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZidcclxuXHRcdGNvbnRleHQuZmlsbFJlY3QgMCwgMCwgdywgaFxyXG5cdFx0Y29udGV4dC5iZWdpblBhdGgoKVxyXG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSAyXHJcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gJyNmMDAnXHJcblx0XHRjb250ZXh0Lm1vdmVUbyBjeCwgMFxyXG5cdFx0Y29udGV4dC5saW5lVG8gY3gsIGhcclxuXHRcdGNvbnRleHQubW92ZVRvIDAsIGN5XHJcblx0XHRjb250ZXh0LmxpbmVUbyB3LCBjeVxyXG5cdFx0Y29udGV4dC5zdHJva2UoKVxyXG5cclxuXHRcdGNvbnRleHQudHJhbnNsYXRlIGN4LCBjeVxyXG5cclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5wbGF5KClcclxuXHJcblx0XHRtb2RlbC5kcmF3UGFydHMgY29udGV4dCwgY2FtZXJhXHJcblxyXG5cdFx0TW9kZWwudHJhbnNmb3JtKDAsIDAsIDEsIGNhbWVyYSlcclxuXHRcdFx0LmFwcGx5IGNvbnRleHRcclxuXHJcblx0XHRtb2RlbC5kcmF3MkQgY29udGV4dFxyXG5cclxuXHRcdGNvbnRleHQucmVzdG9yZSgpXHJcblx0XHQjIFxyXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcclxuXHJcblx0cmVuZGVyKDApXHJcblxyXG5cdG9sZE1vdXNlWCA9IG9sZE1vdXNlWSA9MFxyXG5cdG1vdmVDYW1lcmEgPSAoZSkgLT5cclxuXHRcdGNhbWVyYS54ICs9IGUuY2xpZW50WCAtIG9sZE1vdXNlWFxyXG5cdFx0Y2FtZXJhLnkgKz0gZS5jbGllbnRZIC0gb2xkTW91c2VZXHJcblx0XHRvbGRNb3VzZVggPSBlLmNsaWVudFhcclxuXHRcdG9sZE1vdXNlWSA9IGUuY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICdtb3VzZWRvd24nLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUuY2xpZW50WFxyXG5cdFx0b2xkTW91c2VZID0gZS5jbGllbnRZXHJcblx0XHQkY2FudmFzLm9uICdtb3VzZW1vdmUnLCBtb3ZlQ2FtZXJhXHJcblxyXG5cdCRjYW52YXMub24gJ3RvdWNoc3RhcnQnLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUudG91Y2hlc1swXS5jbGllbnRYXHJcblx0XHRvbGRNb3VzZVkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICd0b3VjaG1vdmUnLCAoZSkgLT5cclxuXHRcdG1vdmVDYW1lcmEgZS50b3VjaGVzWzBdXHJcblxyXG5cdCRjYW52YXMub24gJ21vdXNldXAnLCAtPlxyXG5cdFx0JGNhbnZhcy5vZmYgJ21vdXNlbW92ZScsIG1vdmVDYW1lcmFcclxuXHJcblx0JCgnLmpzLXotbnVtYmVyJylcclxuXHRcdC52YWwgY2FtZXJhLnpcclxuXHRcdC5vbiAnaW5wdXQgY2hhbmdlJywgLT5cclxuXHRcdFx0Y2FtZXJhLnogPSArICQodGhpcykudmFsKClcclxuXHJcblx0JCgnLmpzLW1vZGVsLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRtb2RlbERhdGEgPSBuZXcgTW9kZWxEYXRhXHJcblx0XHRtb2RlbEZpbGUgPSAkKHRoaXMpLmRhdGEgJ2ZpbGUnXHJcblxyXG5cdCQoJy5qcy1hbmltLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRmaWxlID0gJCh0aGlzKS5kYXRhICdmaWxlJ1xyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEgPSBuZXcgQW5pbWF0aW9uRGF0YVxyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdCQoJy5qcy1hbmltLXJlZnJlc2gnKS5kYXRhICdmaWxlJywgZmlsZVxyXG5cdFx0I1xyXG5cdFx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5wcm9wICdjaGVja2VkJywgZmFsc2VcclxuXHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHRNb2RlbC5kcmF3T3JpZ2luID0gdHJ1ZVxyXG5cdCQoJy5qcy1kcmF3LW9yaWdpbicpLmNoYW5nZSAtPlxyXG5cdFx0TW9kZWwuZHJhd09yaWdpbiA9ICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHJcblx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5jaGFuZ2UgLT5cclxuXHRcdGlmICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHRcdFx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblx0XHRlbHNlXHJcblx0XHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHQkKCcuanMtcmVzZXQtcG9zJykuY2xpY2sgLT5cclxuXHRcdGNhbWVyYS54ID0gY2FtZXJhLnkgPSAwXHJcblx0XHRjYW1lcmEueiA9IDFcclxuXHRcdCQoJy5qcy16LW51bWJlcicpLnZhbCAnMSdcclxuXHJcblx0ZnVsbHNjcmVlbiA9IGZhbHNlXHJcblx0JCgnLmpzLWZ1bGwtc2NyZWVuJykuY2xpY2sgLT5cclxuXHRcdGlmIGZ1bGxzY3JlZW5cclxuXHRcdFx0Y2FuY2VsRnVsbHNjcmVlbigpXHJcblx0XHRlbHNlXHJcblx0XHRcdGxhdW5jaEZ1bGxTY3JlZW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XHJcblx0XHRmdWxsc2NyZWVuID0gIWZ1bGxzY3JlZW5cclxuXHJcblx0bGF1bmNoRnVsbFNjcmVlbiA9IChlbGVtZW50KSAtPlxyXG5cdFx0aWYgZWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHJcblx0Y2FuY2VsRnVsbHNjcmVlbiA9IC0+XHJcblx0XHRpZiBkb2N1bWVudC5jYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LmNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LndlYmtpdENhbmNlbEZ1bGxTY3JlZW4oKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBQTs7QUFBTTtFQUFOLE1BQUEsT0FBQTtJQUdRLE9BQU4sSUFBTSxDQUFDLE1BQUQsRUFBUyxJQUFUO1VBQ047TUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLEtBQU0sQ0FBQSxJQUFBO01BQ3RCLElBQUEsQ0FBTyxNQUFQO1FBQ0MsTUFBQSxHQUFTLElBQUk7UUFDYixNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsSUFBcEI7UUFDQSxNQUFNLENBQUMsS0FBTSxDQUFBLElBQUEsQ0FBYixHQUFxQixPQUh0Qjs7YUFJQTs7O0lBRUQsSUFBTSxDQUFDLE1BQUQsRUFBUyxJQUFUO01BQ0wsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsSUFB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
