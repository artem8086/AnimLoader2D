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

    set(name, data = this.data) {
      this.anim = data != null ? data[name] : void 0;
      this.reset();
      if (this.anim) {
        this.duration = this.anim ? this.anim.duration : 0;
        this.frame = this.anim.frames;
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
      frame = this.frame;
      if (frame) {
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
var Z_ORIGIN;
var Z_TRANSFORM;
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
        var image, imagesData, j, key, len, model, modelsData, nodes, nodesLoad, ref, results, sprite, spritesData, value;
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
            ref = this.bones;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              nodes = ref[j];
              results.push(nodesLoad(nodes));
            }
            return results;
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
    zt = Z_ORIGIN + camera.z;
    z = ((v.z || 0) + zt) * Z_TRANSFORM;
    x = ((v.x || 0) + xc) * z;
    y = ((v.y || 0) + yc) * z;
    g.moveTo(x, y);
    l = this.verts.length - 1;
    for (i = j = 1, ref = l; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
      v = verts[this.verts[i]];
      z = ((v.z || 0) + zt) * Z_TRANSFORM;
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
        z: camera.z + (v.z || 0)
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

Z_TRANSFORM = 0.0002;

Z_ORIGIN = 1 / Z_TRANSFORM;

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
    z = (Z_ORIGIN + z + camera.z) * Z_TRANSFORM;
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
  return transform(v.x || 0, v.y || 0, v.z || 0, camera);
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
  modelFile = 'models/arena';
  loader = new Loader;
  model = new Model;
  modelData = new ModelData;
  animationFrame = null;
  camera = {
    canvas: canvas,
    g: context,
    x: 0,
    y: 0,
    z: 0
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
    Model.transform(0, 0, 0, camera).apply(context);
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
  $('.js-model-select').click(function(e) {
    e.stopPropagation();
    modelData = new ModelData;
    return modelFile = $(this).data('file');
  });
  $('.js-anim-select').click(function(e) {
    var file;
    e.stopPropagation();
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
    camera.x = camera.y = camera.z = 0;
    return $('.js-z-number').val('0');
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3ByaXRlLmNvZmZlZSIsImFuaW1hdGlvbi5jb2ZmZWUiLCJtb2RlbC5jb2ZmZWUiLCJldmVudHMuY29mZmVlIiwibG9hZGVyLmNvZmZlZSIsIm1haW4uY29mZmVlIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFNwcml0ZVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRzcHJpdGUgPSBTcHJpdGUuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBzcHJpdGVcclxuXHRcdFx0c3ByaXRlID0gbmV3IFNwcml0ZVxyXG5cdFx0XHRzcHJpdGUubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0U3ByaXRlLmNhY2hlW2ZpbGVdID0gc3ByaXRlXHJcblx0XHRzcHJpdGVcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoQGRhdGEpID0+XHJcblx0XHRsb2FkZXIubG9hZEltYWdlIGZpbGUgKyAnLnBuZycsIChAdGV4dHVyZSkgPT5cclxuXHJcblx0ZHJhdzogKGcsIGZyYW1lLCB4LCB5LCBpbmRleCA9IDApIC0+XHJcblx0XHRkYXRhID0gQGRhdGFcclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0c3dpdGNoIGZyYW1lLmNvbnN0cnVjdG9yXHJcblx0XHRcdFx0d2hlbiBPYmplY3RcclxuXHRcdFx0XHRcdGcuZHJhd0ltYWdlIEB0ZXh0dXJlLFxyXG5cdFx0XHRcdFx0XHRmcmFtZS54LCBmcmFtZS55LCBmcmFtZS53LCBmcmFtZS5oLFxyXG5cdFx0XHRcdFx0XHR4ICsgZnJhbWUuY3gsIHkgKyBmcmFtZS5jeSwgZnJhbWUudywgZnJhbWUuaFxyXG5cdFx0XHRcdHdoZW4gQXJyYXlcclxuXHRcdFx0XHRcdEBkcmF3IGcsIGZyYW1lW01hdGguZmxvb3IoaW5kZXgpICUgZnJhbWUubGVuZ2h0XSwgeCwgeVxyXG5cdFx0XHRcdHdoZW4gU3RyaW5nXHJcblx0XHRcdFx0XHRAZHJhdyBnLCBkYXRhW2ZyYW1lXSwgeCwgeSwgaW5kZXhcclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IFNwcml0ZSB9IiwiY2xhc3MgQW5pbWF0aW9uRGF0YVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRhbmltRGF0YSA9IEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBhbmltRGF0YVxyXG5cdFx0XHRhbmltRGF0YSA9IG5ldyBBbmltYXRpb25EYXRhXHJcblx0XHRcdGFuaW1EYXRhLmxvYWQgbG9hZGVyLCBmaWxlXHJcblx0XHRcdEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV0gPSBhbmltRGF0YVxyXG5cdFx0YW5pbURhdGFcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoZGF0YSkgPT5cclxuXHRcdFx0aWYgZGF0YVxyXG5cdFx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlXHJcblxyXG5nZXRUaW1lID0gLT5cclxuXHRuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDBcclxuXHJcbm1ha2VFYXNlT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdDEgLSB0aW1pbmcoMSAtIHRpbWUpXHJcblxyXG5tYWtlRWFzZUluT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdGlmIHRpbWUgPCAwLjVcclxuXHRcdFx0dGltaW5nKDIgKiB0aW1lKSAvIDJcclxuXHRcdGVsc2VcclxuXHRcdFx0KDIgLSB0aW1pbmcoMiAqICgxIC0gdGltZSkpKSAvIDJcclxuXHJcblxyXG5zZXRUaW1pbmdGdW5jdGlvbiA9IChuYW1lLCB0aW1pbmcpIC0+XHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWVdID0gdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZU91dCddID0gbWFrZUVhc2VPdXQgdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZUluT3V0J10gPSBtYWtlRWFzZUluT3V0IHRpbWluZ1xyXG5cclxudGltaW5nRnVuY3Rpb25zID1cclxuXHRsaW5lYXI6ICh0aW1lKSAtPlxyXG5cdFx0dGltZVxyXG5cclxuXHRlYXNlT3V0OiAodGltZSkgLT5cclxuXHRcdDEgLSB0aW1lXHJcblxyXG5cdGVhc2VJbk91dDogKHRpbWUpIC0+XHJcblx0XHRpZiB0aW1lIDwgMC41XHJcblx0XHRcdHRpbWUgKiAyXHJcblx0XHRlbHNlXHJcblx0XHRcdDIgLSB0aW1lICogMlxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ3F1YWQnLCAodGltZSkgLT5cclxuXHR0aW1lICogdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2NpcmNsZScsICh0aW1lKSAtPlxyXG5cdDEgLSBNYXRoLnNpbiBNYXRoLmFjb3MgdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2JvdW5jZScsICh0aW1lKSAtPlxyXG5cdGEgPSAwXHJcblx0YiA9IDFcclxuXHR3aGlsZSB0cnVlXHJcblx0XHRpZiB0aW1lID49ICg3IC0gNCAqIGEpIC8gMTFcclxuXHRcdFx0cmV0dXJuIC1NYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogdGltZSkgLyA0LCAyKSArIE1hdGgucG93KGIsIDIpXHJcblx0XHRhICs9IGJcclxuXHRcdGIgLz0gMlxyXG5cclxuY2xhc3MgQW5pbWF0aW9uXHJcblx0QGdldFRpbWU6IGdldFRpbWVcclxuXHJcblx0bG9vcDogdHJ1ZVxyXG5cdHN0YXJ0VGltZTogMFxyXG5cdGR1cmF0aW9uOiAwXHJcblx0ZGVsdGFUaW1lOiAwXHJcblx0c2NhbGU6IDFcclxuXHJcblx0QHByb3BzOiBbXVxyXG5cdEBwcm9wc1VzZWQ6IFtdXHJcblxyXG5cdHJlc2V0OiAtPlxyXG5cdFx0QHN0YXJ0VGltZSA9IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IDBcclxuXHRcdHRoaXNcclxuXHJcblx0c2V0OiAobmFtZSwgZGF0YSA9IEBkYXRhKSAtPlxyXG5cdFx0QGFuaW0gPSBkYXRhP1tuYW1lXVxyXG5cdFx0QHJlc2V0KClcclxuXHRcdGlmIEBhbmltXHJcblx0XHRcdEBkdXJhdGlvbiA9IGlmIEBhbmltIHRoZW4gQGFuaW0uZHVyYXRpb24gZWxzZSAwXHJcblx0XHRcdEBmcmFtZSA9IEBhbmltLmZyYW1lc1xyXG5cdFx0dGhpc1xyXG5cclxuXHRwbGF5OiAodGltZSkgLT5cclxuXHRcdHRpbWUgPSB0aW1lIHx8IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IGRlbHRhID0gKHRpbWUgLSBAc3RhcnRUaW1lKSAqIEBzY2FsZVxyXG5cdFx0ZHVyYXRpb24gPSBAZHVyYXRpb25cclxuXHRcdHVubGVzcyBkdXJhdGlvblxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdGlmIGRlbHRhID4gZHVyYXRpb25cclxuXHRcdFx0aWYgQGxvb3BcclxuXHRcdFx0XHRAZGVsdGFUaW1lICU9IGR1cmF0aW9uXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdHRydWVcclxuXHJcblx0YW5pbWF0ZTogKG5vZGUsIG5vZGVQYXRoID0gbm9kZS5ub2RlUGF0aCwgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lKSAtPlxyXG5cdFx0ZnJhbWUgPSBAZnJhbWVcclxuXHRcdGlmIGZyYW1lXHJcblx0XHRcdHRpbWVzdG9wcyA9IGZyYW1lW25vZGVQYXRoXSB8fCBmcmFtZVtub2RlTmFtZV1cclxuXHRcdFx0aWYgdGltZXN0b3BzXHJcblx0XHRcdFx0ZGVsdGEgPSBAZGVsdGFUaW1lXHJcblx0XHRcdFx0cHJvcHMgPSBBbmltYXRpb24ucHJvcHNcclxuXHRcdFx0XHRwcm9wc1VzZWQgPSBBbmltYXRpb24ucHJvcHNVc2VkXHJcblx0XHRcdFx0Zm9yIHBvaW50IGluIHRpbWVzdG9wc1xyXG5cdFx0XHRcdFx0aWYgZGVsdGEgPj0gcG9pbnQuZW5kXHJcblx0XHRcdFx0XHRcdGZvciBuYW1lLCB0b1ZhbCBvZiBwb2ludC50b1xyXG5cdFx0XHRcdFx0XHRcdHVubGVzcyBwcm9wc1VzZWRbbmFtZV1cclxuXHRcdFx0XHRcdFx0XHRcdHByb3BzW25hbWVdID0gbm9kZVtuYW1lXVxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcHNVc2VkW25hbWVdID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRcdG5vZGVbbmFtZV0gPSB0b1ZhbFxyXG5cdFx0XHRcdFx0ZWxzZSBpZiBkZWx0YSA+PSBwb2ludC5zdGFydFxyXG5cdFx0XHRcdFx0XHRpZiBwb2ludC5mdW5jXHJcblx0XHRcdFx0XHRcdFx0dEZ1bmMgPSB0aW1pbmdGdW5jdGlvbnNbcG9pbnQuZnVuY11cclxuXHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdHRGdW5jID0gdGltaW5nRnVuY3Rpb25zLmxpbmVhclxyXG5cdFx0XHRcdFx0XHQjXHJcblx0XHRcdFx0XHRcdGZvciBuYW1lLCB0b1ZhbCBvZiBwb2ludC50b1xyXG5cdFx0XHRcdFx0XHRcdHByb3AgPSBub2RlW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0dW5sZXNzIHByb3BzVXNlZFtuYW1lXVxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcHNbbmFtZV0gPSBwcm9wXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1VzZWRbbmFtZV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0cHJvcCB8fD0gMFxyXG5cdFx0XHRcdFx0XHRcdGlmIHRvVmFsLmNvbnN0cnVjdG9yID09IE51bWJlclxyXG5cdFx0XHRcdFx0XHRcdFx0dGltZSA9IHRGdW5jKChkZWx0YSAtIHBvaW50LnN0YXJ0KSAvIChwb2ludC5lbmQgLSBwb2ludC5zdGFydCkpXHJcblx0XHRcdFx0XHRcdFx0XHRub2RlW25hbWVdID0gKHRvVmFsIC0gcHJvcCkgKiB0aW1lICsgcHJvcFxyXG5cdFx0XHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVbbmFtZV0gPSB0b1ZhbFxyXG5cdFx0dGhpc1xyXG5cclxuXHRyZWNpdmVQcm9wczogKG5vZGUpIC0+XHJcblx0XHRwcm9wcyA9IEFuaW1hdGlvbi5wcm9wc1xyXG5cdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0Zm9yIG5hbWUsIHVzZSBvZiBwcm9wc1VzZWRcclxuXHRcdFx0aWYgdXNlXHJcblx0XHRcdFx0bm9kZVtuYW1lXSA9IHByb3BzW25hbWVdXHJcblx0XHRcdFx0ZGVsZXRlIHByb3BzVXNlZFtuYW1lXVxyXG5cdFx0dGhpc1xyXG5cclxuXHRjcmVhdGVXb3JrRnJhbWU6IC0+XHJcblx0XHRAbG9vcCA9IGZhbHNlXHJcblx0XHRAZnJhbWUgPVxyXG5cdFx0XHR3b3JrOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0c3RhcnQ6IDBcclxuXHRcdFx0XHRcdGVuZDogMFxyXG5cdFx0XHRcdFx0dG86IHt9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR0aGlzXHJcblxyXG5cdHJlc2V0V29yazogLT5cclxuXHRcdHByb3BzVXNlZCA9IEFuaW1hdGlvbi5wcm9wc1VzZWRcclxuXHRcdGZvciBuYW1lLCB1c2Ugb2YgcHJvcHNVc2VkXHJcblx0XHRcdGlmIHVzZSB0aGVuIHByb3BzVXNlZFtuYW1lXSA9IGZhbHNlXHJcblx0XHR0aGlzXHJcblxyXG5cdGNsZWFyV29yazogLT5cclxuXHRcdHByb3BzVXNlZCA9IEFuaW1hdGlvbi5wcm9wc1VzZWRcclxuXHRcdGFPYmogPSBAZnJhbWUud29ya1swXVxyXG5cdFx0YU9iai5zdGFydCA9IGFPYmouZW5kID0gMFxyXG5cdFx0dG8gPSBcclxuXHRcdGZvciBuYW1lLCBfIG9mIHRvXHJcblx0XHRcdGRlbGV0ZSB0b1tuYW1lXVxyXG5cdFx0dGhpc1xyXG5cclxuXHRhbmltYXRlUHJvcHM6IChwcm9wcywgZHVyYXRpb24sIGZ1bmMpIC0+XHJcblx0XHRAZHVyYXRpb24gPSBkdXJhdGlvblxyXG5cdFx0YU9iaiA9IEBmcmFtZS53b3JrWzBdXHJcblx0XHRhT2JqLmVuZCA9IGR1cmF0aW9uXHJcblx0XHRhT2JqLmZ1bmMgPSBmdW5jXHJcblx0XHR0byA9IGFPYmoudG9cclxuXHRcdGZvciBuYW1lLCBwcm9wIG9mIHByb3BzXHJcblx0XHRcdHRvW25hbWVdID0gcHJvcFxyXG5cdFx0QHJlc2V0KClcclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IEFuaW1hdGlvbkRhdGEsIEFuaW1hdGlvbiB9IiwiaW1wb3J0IHsgU3ByaXRlIH0gZnJvbSAnLi9zcHJpdGUnXHJcbmltcG9ydCB7IEFuaW1hdGlvbiB9IGZyb20gJy4vYW5pbWF0aW9uJ1xyXG5cclxuY2xhc3MgTW9kZWxEYXRhXHJcblx0QGNhY2hlOiBbXVxyXG5cclxuXHRAbG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdG1vZGVsID0gTW9kZWxEYXRhLmNhY2hlW2ZpbGVdXHJcblx0XHR1bmxlc3MgbW9kZWxcclxuXHRcdFx0bW9kZWwgPSBuZXcgTW9kZWxEYXRhXHJcblx0XHRcdG1vZGVsLmxvYWQgbG9hZGVyLCBmaWxlXHJcblx0XHRcdE1vZGVsRGF0YS5jYWNoZVtmaWxlXSA9IG1vZGVsXHJcblx0XHRtb2RlbFxyXG5cclxuXHRsb2FkOiAobG9hZGVyLCBmaWxlKSAtPlxyXG5cdFx0bG9hZGVyLmxvYWRKc29uIGZpbGUsIChkYXRhKSA9PlxyXG5cdFx0XHRpZiBkYXRhXHJcblx0XHRcdFx0Zm9yIGtleSwgdmFsdWUgb2YgZGF0YVxyXG5cdFx0XHRcdFx0dGhpc1trZXldID0gdmFsdWVcclxuXHJcblx0XHRcdFx0aWYgQGltYWdlc1xyXG5cdFx0XHRcdFx0aW1hZ2VzRGF0YSA9IEBpbWFnZXNcclxuXHRcdFx0XHRcdEBpbWFnZXMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yIGtleSwgaW1hZ2Ugb2YgaW1hZ2VzRGF0YVxyXG5cdFx0XHRcdFx0XHRAaW1hZ2VzW2tleV0gPSBsb2FkZXIubG9hZEltYWdlIGltYWdlXHJcblxyXG5cdFx0XHRcdGlmIEBzcHJpdGVzXHJcblx0XHRcdFx0XHRzcHJpdGVzRGF0YSA9IEBzcHJpdGVzXHJcblx0XHRcdFx0XHRAc3ByaXRlcyA9IFtdXHJcblx0XHRcdFx0XHRmb3Iga2V5LCBzcHJpdGUgb2Ygc3ByaXRlc0RhdGFcclxuXHRcdFx0XHRcdFx0QHNwcml0ZXNba2V5XSA9IFNwcml0ZS5sb2FkIGxvYWRlciwgc3ByaXRlXHJcblxyXG5cdFx0XHRcdGlmIEBtb2RlbHNcclxuXHRcdFx0XHRcdG1vZGVsc0RhdGEgPSBAbW9kZWxzXHJcblx0XHRcdFx0XHRAbW9kZWxzID0gW11cclxuXHRcdFx0XHRcdGZvciBrZXksIG1vZGVsIG9mIG1vZGVsc0RhdGFcclxuXHRcdFx0XHRcdFx0QG1vZGVsc1trZXldID0gTW9kZWxEYXRhLmxvYWQgbG9hZGVyLCBtb2RlbFxyXG5cclxuXHRcdFx0XHRub2Rlc0xvYWQgPSAobm9kZXMsIG5vZGVQYXRoID0gJycpIC0+XHJcblx0XHRcdFx0XHRmb3IgbmFtZSwgbm9kZSBvZiBub2Rlc1xyXG5cdFx0XHRcdFx0XHRub2RlLm5vZGVQYXRoID0gbm9kZVBhdGggKyBuYW1lXHJcblx0XHRcdFx0XHRcdG5vZGUubm9kZU5hbWUgPSAnQCcgKyBuYW1lXHJcblx0XHRcdFx0XHRcdGlmIG5vZGUuYmVmb3JlXHJcblx0XHRcdFx0XHRcdFx0bm9kZXNMb2FkIG5vZGUuYmVmb3JlLCBub2RlLm5vZGVQYXRoICsgJzwnXHJcblx0XHRcdFx0XHRcdGlmIG5vZGUuYWZ0ZXJcclxuXHRcdFx0XHRcdFx0XHRub2Rlc0xvYWQgbm9kZS5hZnRlciwgbm9kZS5ub2RlUGF0aCArICc+J1xyXG5cclxuXHRcdFx0XHRpZiBAYm9uZXNcclxuXHRcdFx0XHRcdGZvciBub2RlcyBpbiBAYm9uZXNcclxuXHRcdFx0XHRcdFx0bm9kZXNMb2FkIG5vZGVzXHJcblxyXG5cclxuZHJhd1R5cGVPYmogPVxyXG5cdGxpbmU6IChnKSAtPlxyXG5cdFx0Zy5tb3ZlVG8gQHgxIHx8IDAsIEB5MSB8fCAwXHJcblx0XHRnLmxpbmVUbyBAeDIgfHwgMCwgQHkyIHx8IDBcclxuXHRcdHRoaXNcclxuXHJcblx0cmVjdDogKGcpIC0+XHJcblx0XHRnLnJlY3QgQHggfHwgMCwgQHkgfHwgMCwgQHdpZHRoIHx8IDEsIEBoZWlnaHQgfHwgMVxyXG5cdFx0dGhpc1xyXG5cclxuXHRyZWN0Um91bmQ6IChnKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBmYWxzZVxyXG5cdFx0eCA9IEB4IHx8IDBcclxuXHRcdHkgPSBAeSB8fCAwXHJcblx0XHR3ID0gQHdpZHRoXHJcblx0XHRoID0gQGhlaWdodFxyXG5cdFx0ciA9IEByYWRpdXNcclxuXHRcdGlmIHcgPCAyICogciB0aGVuIHIgPSB3IC8gMlxyXG5cdFx0aWYgaCA8IDIgKiByIHRoZW4gciA9IGggLyAyXHJcblxyXG5cdFx0Zy5tb3ZlVG8geCArIHIsIHlcclxuXHRcdGcuYXJjVG8gIHggKyB3LCB5LCAgICAgeCArIHcsIHkgKyBoLCByXHJcblx0XHRnLmFyY1RvICB4ICsgdywgeSArIGgsIHgsICAgICB5ICsgaCwgclxyXG5cdFx0Zy5hcmNUbyAgeCwgICAgIHkgKyBoLCB4LCAgICAgeSwgICAgIHJcclxuXHRcdGcuYXJjVG8gIHgsICAgICB5LCAgICAgeCArIHcsIHksICAgICByXHJcblx0XHR0aGlzXHJcblxyXG5cdGFyYzogKGcpIC0+XHJcblx0XHRnLmFyYyhcclxuXHRcdFx0QHggfHwgMCxcclxuXHRcdFx0QHkgfHwgMCxcclxuXHRcdFx0QHJhZGl1cyxcclxuXHRcdFx0KEBzdGFydEFuZ2xlIHx8IDApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0KEBlbmRBbmdsZSB8fCAzNjApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0aWYgQGNsb2Nrd2lzZSB0aGVuIGZhbHNlIGVsc2UgdHJ1ZSlcclxuXHRcdHRoaXNcclxuXHJcblx0ZWxpcHNlOiAoZykgLT5cclxuXHRcdGcuZWxsaXBzZShcclxuXHRcdFx0QHggfHwgMCxcclxuXHRcdFx0QHkgfHwgMCxcclxuXHRcdFx0QHJ4LFxyXG5cdFx0XHRAcnksXHJcblx0XHRcdChAcm90YXRpb24gfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQHN0YXJ0QW5nbGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQGVuZEFuZ2xlIHx8IDM2MCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHRpZiBAY2xvY2t3aXNlIHRoZW4gZmFsc2UgZWxzZSB0cnVlKVxyXG5cdFx0dGhpc1xyXG5cclxuXHRwYXRoOiAoZykgLT5cclxuXHRcdHggPSBAeCB8fCAwXHJcblx0XHR5ID0gQHkgfHwgMFxyXG5cdFx0aWYgdHlwZW9mIEBwYXRoID09ICdzdHJpbmcnXHJcblx0XHRcdEBwYXRoID0gbmV3IFBhdGgyRCBAcGF0aFxyXG5cdFx0I1xyXG5cdFx0QG5vQ2xvc2UgPSB0cnVlXHJcblx0XHRnLnRyYW5zbGF0ZSB4LCB5XHJcblx0XHRkcmF3ID0gQGRyYXcgfHwgJ2YmcydcclxuXHRcdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5maWxsIEBwYXRoXHJcblx0XHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuc3Ryb2tlIEBwYXRoXHJcblx0XHR0aGlzXHJcblxyXG5cdG5vZGU6IChnLCBtb2RlbCwgb3BhY2l0eSwgZGF0YSkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjIFNhdmUgY3VycmVudCBtb2RlbCBkYXRhXHJcblx0XHR0RGF0YSA9IG1vZGVsLmRhdGFcclxuXHRcdCMgU2VsZWN0IG1vZGVsXHJcblx0XHRkYXRhID0gZGF0YSB8fCB0RGF0YS5tb2RlbHM/W0Btb2RlbF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0bW9kZWwuZGF0YSA9IGRhdGFcclxuXHRcdFx0bm9kZXMgPSBkYXRhLmJvbmVzXHJcblx0XHRlbHNlXHJcblx0XHRcdG5vZGVzID0gbW9kZWwuZGF0YS5ib25lc1xyXG5cdFx0aWYgbm9kZXNcclxuXHRcdFx0IyBTZWxlY3Qgbm9kZSBpbiBtb2RlbFxyXG5cdFx0XHRub2RlID0gQG5vZGVcclxuXHRcdFx0aWYgdHlwZW9mIG5vZGUgPT0gJ3N0cmluZydcclxuXHRcdFx0XHRub2RlID0gbm9kZXNbbm9kZV1cclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHJvb3QgPSBub2Rlc1xyXG5cdFx0XHRcdGZvciBwYXRoIGluIG5vZGVcclxuXHRcdFx0XHRcdHJvb3QgPSByb290W3BhdGhdXHJcblx0XHRcdFx0bm9kZSA9IHJvb3RcclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGcudHJhbnNsYXRlIEB4IHx8IDAsIEB5IHx8IDBcclxuXHRcdFx0XHRkcmF3Tm9kZS5jYWxsIG5vZGUsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHRcdFx0IyBSZWNpdmUgbW9kZWwgZGF0YVxyXG5cdFx0bW9kZWwuZGF0YSA9IHREYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGF0dGFjaDogKGcsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0ZGF0YSA9IG1vZGVsLmF0dGFjaG1lbnRbQGF0dGFjaF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5LCBkYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGltYWdlOiAoZywgbW9kZWwpIC0+XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0aW1hZ2UgPSBtb2RlbC5kYXRhLmltYWdlc1tAaW1hZ2VdXHJcblx0XHRpZiBAd2lkdGggfHwgQGhlaWdodFxyXG5cdFx0XHRnLmRyYXdJbWFnZSBpbWFnZSwgQHggfHwgMCwgQHkgfHwgMCwgQHdpZHRoLCBAaGVpZ2h0XHJcblx0XHRlbHNlXHJcblx0XHRcdGcuZHJhd0ltYWdlIGltYWdlLCBAeCB8fCAwLCBAeSB8fCAwXHJcblx0XHR0aGlzXHJcblxyXG5cdHNwcml0ZTogKGcsIG1vZGVsKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdHNwcml0ZSA9IEBzcHJpdGVcclxuXHRcdGlmIHNwcml0ZS5jb25zdHJ1Y3RvciA9PSBTdHJpbmdcclxuXHRcdFx0QHNwcml0ZSA9IHNwcml0ZSA9IG1vZGVsLmRhdGEuc3ByaXRlc1tzcHJpdGVdXHJcblx0XHRzcHJpdGUuZHJhdyBnLCBAZnJhbWUsIEB4IHx8IDAsIEB5IHx8IDAsIEBpbmRleFxyXG5cdFx0dGhpc1xyXG5cclxuXHR0ZXh0OiAoZykgLT5cclxuXHRcdGlmIEBkcmF3ICE9IHRydWVcclxuXHRcdFx0QGRyYXdUZXh0ID0gQGRyYXdcclxuXHRcdGRyYXcgPSBAZHJhd1RleHRcclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjXHJcblx0XHRpZiBAZm9udCB0aGVuIGcuZm9udCA9IEBmb250XHJcblx0XHRpZiBAdGV4dEFsaWduIHRoZW4gZy50ZXh0QWxpZ24gPSBAdGV4dEFsaWduXHJcblx0XHRpZiBAdGV4dEJhc2VsaW5lICE9IG51bGwgdGhlbiBnLnRleHRCYXNlbGluZSA9IEB0ZXh0QmFzZWxpbmVcclxuXHRcdGlmIEBkaXJlY3Rpb24gdGhlbiBnLmRpcmVjdGlvbiA9IEBkaXJlY3Rpb25cclxuXHRcdCNcclxuXHRcdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5maWxsVGV4dCBAdGV4dCwgQHggfHwgMCwgQHkgfHwgMCwgQG1heFdpZHRoXHJcblx0XHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuc3Ryb2tlVGV4dCBAdGV4dCwgQHggfHwgMCwgQHkgfHwgMCwgQG1heFdpZHRoXHJcblx0XHR0aGlzXHJcblxyXG5zdHlsZVR5cGVGdW5jID1cclxuXHRsaW5lYXI6IChnKSAtPlxyXG5cdFx0Z3JhZGllbnQgPSBnLmNyZWF0ZUxpbmVhckdyYWRpZW50IEB4MCB8fCAwLCBAeTAgfHwgMCwgQHgxIHx8IDAsIEB5MSB8fCAwXHJcblx0XHRmb3IgY29sb3JTdG9wIGluIEBjb2xvclN0b3BzXHJcblx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCBjb2xvclN0b3AucG9zIHx8IDAsIGNvbG9yU3RvcC5jb2xvclxyXG5cdFx0Z3JhZGllbnRcclxuXHJcblx0cmFkaWFsOiAoZykgLT5cclxuXHRcdGdyYWRpZW50ID0gZy5jcmVhdGVSYWRpYWxHcmFkaWVudCBAeDAgfHwgMCwgQHkwIHx8IDAsIEByMCB8fCAwLCBAeDEgfHwgMCwgQHkxIHx8IDAsIEByMSB8fCAwXHJcblx0XHRmb3IgY29sb3JTdG9wIGluIEBjb2xvclN0b3BzXHJcblx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCBjb2xvclN0b3AucG9zIHx8IDAsIGNvbG9yU3RvcC5jb2xvclxyXG5cdFx0Z3JhZGllbnRcclxuXHJcblx0cGF0dGVybjogKGcsIG1vZGVsKSAtPlxyXG5cdFx0aW1hZ2UgPSBtb2RlbC5kYXRhLmltYWdlc1tAaW1hZ2VdXHJcblx0XHRnLmNyZWF0ZVBhdHRlcm4gaW1hZ2UsIEByZXBldGl0aW9uIHx8IFwicmVwZWF0XCJcclxuXHJcbmluaXRTdHlsZSA9IChnLCBtb2RlbCwgc3R5bGUpIC0+XHJcblx0c3R5bGVUeXBlRnVuY1tzdHlsZS50eXBlXT8uY2FsbCBzdHlsZSwgZywgbW9kZWxcclxuXHJcbnNldERyYXdTdHlsZSA9IChnLCBtb2RlbCkgLT5cclxuXHRzdHJva2UgPSBAc3Ryb2tlXHJcblx0aWYgc3Ryb2tlXHJcblx0XHRpZiBzdHJva2UuY29uc3RydWN0b3IgPT0gT2JqZWN0XHJcblx0XHRcdEBzdHJva2UgPSBpbml0U3R5bGUgZywgbW9kZWwsIHN0cm9rZVxyXG5cdFx0Zy5zdHJva2VTdHlsZSA9IEBzdHJva2VcclxuXHRmaWxsID0gQGZpbGxcclxuXHRpZiBmaWxsXHJcblx0XHRpZiBmaWxsLmNvbnN0cnVjdG9yID09IE9iamVjdFxyXG5cdFx0XHRAZmlsbCA9IGluaXRTdHlsZSBnLCBtb2RlbCwgZmlsbFxyXG5cdFx0Zy5maWxsU3R5bGUgPSBAZmlsbFxyXG5cdGlmIEBsaW5lV2lkdGggIT0gbnVsbCB0aGVuIGcubGluZVdpZHRoID0gQGxpbmVXaWR0aFxyXG5cdGlmIEBsaW5lQ2FwICE9IG51bGwgdGhlbiBnLmxpbmVDYXAgPSBAbGluZUNhcFxyXG5cdGlmIEBsaW5lSm9pbiB0aGVuIGcubGluZUpvaW4gPSBAbGluZUpvaW5cclxuXHRpZiBAbGluZURhc2hPZmZzZXQgIT0gbnVsbCB0aGVuIGcubGluZURhc2hPZmZzZXQgPSBAbGluZURhc2hPZmZzZXRcclxuXHR0aGlzXHJcblxyXG5kcmF3Tm9kZSA9IChnLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRnLnNhdmUoKVxyXG5cdG1vZGVsLmFuaW1hdGlvbi5hbmltYXRlIHRoaXNcclxuXHRnLnRyYW5zZm9ybSBAc2NhbGVYIHx8IDEsIEBza2V3WSB8fCAwLCBAc2tld1ggfHwgMCwgQHNjYWxlWSB8fCAxLCBAb3JpZ1ggfHwgMCwgQG9yaWdZIHx8IDBcclxuXHRpZiBAYW5nbGUgdGhlbiBnLnJvdGF0ZSBAYW5nbGUgKiBNYXRoLlBJIC8gMTgwXHJcblx0c2V0RHJhd1N0eWxlLmNhbGwgdGhpcywgZywgbW9kZWxcclxuXHQjIFNoYWRvd3NcclxuXHRpZiBAbm9TaGFkb3dcclxuXHRcdGcuc2hhZG93Qmx1ciA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WCA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WSA9IDBcclxuXHRpZiBAc2hhZG93Qmx1ciAhPSBudWxsIHRoZW4gZy5zaGFkb3dCbHVyID0gQHNoYWRvd0JsdXJcclxuXHRpZiBAc2hhZG93Q29sb3IgIT0gbnVsbCB0aGVuIGcuc2hhZG93Q29sb3IgPSBAc2hhZG93Q29sb3JcclxuXHRpZiBAc2hhZG93T2Zmc2V0WCAhPSBudWxsIHRoZW4gZy5zaGFkb3dPZmZzZXRYID0gQHNoYWRvd09mZnNldFhcclxuXHRpZiBAc2hhZG93T2Zmc2V0WSAhPSBudWxsIHRoZW4gZy5zaGFkb3dPZmZzZXRZID0gQHNoYWRvd09mZnNldFlcclxuXHRnLmdsb2JhbEFscGhhID0gb3BhY2l0eSAqIChpZiBAb3BhY2l0eSA9PSBudWxsIHRoZW4gMSBlbHNlIEBvcGFjaXR5KVxyXG5cclxuXHRpZiBAYmVmb3JlXHJcblx0XHRtb2RlbC5hbmltYXRpb24ucmVjaXZlUHJvcHMgdGhpc1xyXG5cdFx0I1xyXG5cdFx0Zm9yIGtleSwgbm9kZSBvZiBAYmVmb3JlXHJcblx0XHRcdGlmICFub2RlLmhpZGVcclxuXHRcdFx0XHRkcmF3Tm9kZS5jYWxsIG5vZGUsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHQjXHJcblx0XHRtb2RlbC5hbmltYXRpb24uYW5pbWF0ZSB0aGlzXHJcblxyXG5cdGcuYmVnaW5QYXRoKClcclxuXHRkcmF3VHlwZU9ialtAdHlwZV0/LmNhbGwgdGhpcywgZywgbW9kZWwsIG9wYWNpdHlcclxuXHRpZiAhQG5vQ2xvc2UgdGhlbiBnLmNsb3NlUGF0aCgpXHJcblxyXG5cdGRyYXcgPSBAZHJhdyB8fCAnZiZzJ1xyXG5cdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdGcuZmlsbCgpXHJcblx0aWYgZHJhdyA9PSAncycgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0Zy5zdHJva2UoKVxyXG5cclxuXHRpZiBAY2xpcFxyXG5cdFx0Zy5jbGlwKClcclxuXHJcblx0bW9kZWwuYW5pbWF0aW9uLnJlY2l2ZVByb3BzIHRoaXNcclxuXHJcblx0aWYgQGFmdGVyXHJcblx0XHRmb3Iga2V5LCBub2RlIG9mIEBhZnRlclxyXG5cdFx0XHRpZiAhbm9kZS5oaWRlXHJcblx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cclxuXHRpZiBNb2RlbC5kcmF3T3JpZ2luXHJcblx0XHRnLmZpbGxTdHlsZSA9ICcjZjAwJ1xyXG5cdFx0Zy5zaGFkb3dCbHVyID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRYID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRZID0gMFxyXG5cdFx0Zy5maWxsUmVjdCAtMiwgLTIsIDQsIDRcclxuXHJcblx0Zy5yZXN0b3JlKClcclxuXHR0aGlzXHJcblxyXG5cclxuZHJhd1BhcnRUeXBlID1cclxuXHRwb2x5OiAoZywgdmVydHMsIGNhbWVyYSwgbW9kZWwpIC0+XHJcblx0XHR2ID0gdmVydHNbQHZlcnRzWzBdXVxyXG5cdFx0eGMgPSBjYW1lcmEueFxyXG5cdFx0eWMgPSBjYW1lcmEueVxyXG5cdFx0enQgPSBaX09SSUdJTiArIGNhbWVyYS56XHJcblx0XHR6ID0gKCh2LnogfHwgMCkgKyB6dCkgKiBaX1RSQU5TRk9STVxyXG5cdFx0eCA9ICgodi54IHx8IDApICsgeGMpICogelxyXG5cdFx0eSA9ICgodi55IHx8IDApICsgeWMpICogelxyXG5cdFx0Zy5tb3ZlVG8geCwgeVxyXG5cdFx0bCA9IEB2ZXJ0cy5sZW5ndGggLSAxXHJcblx0XHRmb3IgaSBpbiBbMS4ubF1cclxuXHRcdFx0diA9IHZlcnRzW0B2ZXJ0c1tpXV07XHJcblx0XHRcdHogPSAoKHYueiB8fCAwKSArIHp0KSAqIFpfVFJBTlNGT1JNXHJcblx0XHRcdHggPSAoKHYueCB8fCAwKSArIHhjKSAqIHpcclxuXHRcdFx0eSA9ICgodi55IHx8IDApICsgeWMpICogelxyXG5cdFx0XHRnLmxpbmVUbyB4LCB5XHJcblx0XHR0aGlzXHJcblxyXG5cdHBhcnQ6IChnLCB2ZXJ0cywgY2FtZXJhLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjIFNhdmUgbW9kZWwgZGF0YVxyXG5cdFx0dERhdGEgPSBtb2RlbC5kYXRhXHJcblx0XHQjIFNlbGVjdCBtb2RlbFxyXG5cdFx0ZGF0YSA9IHREYXRhLm1vZGVscz9bQG1vZGVsXVxyXG5cdFx0aWYgZGF0YVxyXG5cdFx0XHRtb2RlbC5kYXRhID0gZGF0YVxyXG5cdFx0XHRwYXJ0cyA9IGRhdGEucGFydHNcclxuXHRcdGVsc2VcclxuXHRcdFx0cGFydHMgPSBtb2RlbC5kYXRhLnBhcnRzXHJcblx0XHRpZiBwYXJ0c1xyXG5cdFx0XHR2ID0gdmVydHNbQHZlcnRdXHJcblx0XHRcdGMgPVxyXG5cdFx0XHRcdHg6IGNhbWVyYS54ICsgKHYueCB8fCAwKVxyXG5cdFx0XHRcdHk6IGNhbWVyYS55ICsgKHYueSB8fCAwKVxyXG5cdFx0XHRcdHo6IGNhbWVyYS56ICsgKHYueiB8fCAwKVxyXG5cclxuXHRcdFx0cGFydCA9IHBhcnRzW0BwYXJ0XVxyXG5cdFx0XHRpZiBwYXJ0XHJcblx0XHRcdFx0dFBhcnRzID0gbW9kZWwucGFydHNcclxuXHRcdFx0XHRtb2RlbC5wYXJ0cyA9IHBhcnRzXHJcblx0XHRcdFx0Zm9yIGZhY2UgaW4gcGFydC5mYWNlc1xyXG5cdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCBtb2RlbCwgYywgb3BhY2l0eVxyXG5cdFx0XHRcdG1vZGVsLnBhcnRzID0gdFBhcnRzXHJcblx0XHRtb2RlbC5kYXRhID0gdERhdGFcclxuXHRcdHRoaXNcclxuXHJcblx0bm9kZTogKGcsIHZlcnRzLCBjYW1lcmEsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0dHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydF0sIGNhbWVyYVxyXG5cdFx0XHQuYXBwbHkgZ1xyXG5cdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHR0aGlzXHJcblxyXG5cdGF0dGFjaDogKGcsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0dHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydF0sIGNhbWVyYVxyXG5cdFx0XHQuYXBwbHkgZ1xyXG5cdFx0ZGF0YSA9IG1vZGVsLmF0dGFjaG1lbnRbQGF0dGFjaF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5LCBkYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGVsaXBzZTogKGcsIHZlcnRzLCBjYW1lcmEpIC0+XHJcblx0XHR2ID0gdHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydDFdLCBjYW1lcmFcclxuXHRcdHgxID0gdi54XHJcblx0XHR5MSA9IHYueVxyXG5cdFx0diA9IHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnQyXSwgY2FtZXJhXHJcblx0XHR4MiA9IHYueFxyXG5cdFx0eTIgPSB2LnlcclxuXHRcdHJ4ID0gKHgyIC0geDEpIC8gMlxyXG5cdFx0cnkgPSAoeTIgLSB5MSkgLyAyXHJcblx0XHRnLmVsbGlwc2UoXHJcblx0XHRcdHgxICsgcngsXHJcblx0XHRcdHkxICsgcnksXHJcblx0XHRcdHJ4LFxyXG5cdFx0XHRyeSxcclxuXHRcdFx0KEByb3RhdGlvbiB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAc3RhcnRBbmdsZSB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAZW5kQW5nbGUgfHwgMzYwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdGlmIEBjbG9ja3dpc2UgdGhlbiBmYWxzZSBlbHNlIHRydWUpXHJcblx0XHR0aGlzXHJcblxyXG5cclxuZHJhd1BhcnQgPSAoZywgbW9kZWwsIGNhbWVyYSwgb3BhY2l0eSkgLT5cclxuXHRnLnNhdmUoKVxyXG5cdHN0cm9rZSA9IEBzdHJva2VcclxuXHRzZXREcmF3U3R5bGUuY2FsbCB0aGlzLCBnLCBtb2RlbFxyXG5cdGcuZ2xvYmFsQWxwaGEgPSBvcGFjaXR5ICogKGlmIEBvcGFjaXR5ID09IG51bGwgdGhlbiAxIGVsc2UgQG9wYWNpdHkpXHJcblxyXG5cdGcuYmVnaW5QYXRoKClcclxuXHRkcmF3UGFydFR5cGVbQHR5cGUgfHwgJ3BvbHknXT8uY2FsbCB0aGlzLCBnLCBtb2RlbC5kYXRhLnZlcnRzLCBjYW1lcmEsIG1vZGVsLCBvcGFjaXR5XHJcblx0aWYgIUBub0Nsb3NlIHRoZW4gZy5jbG9zZVBhdGgoKVxyXG5cclxuXHRkcmF3ID0gQGRyYXcgfHwgJ2YmcydcclxuXHRpZiBkcmF3ID09ICdmJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLmZpbGwoKVxyXG5cdGlmIGRyYXcgPT0gJ3MnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdGcuc3Ryb2tlKClcclxuXHJcblx0Zy5yZXN0b3JlKClcclxuXHR0aGlzXHJcblxyXG5aX1RSQU5TRk9STSA9IDAuMDAwMlxyXG5aX09SSUdJTiA9IDEgLyBaX1RSQU5TRk9STVxyXG5cclxudHJzZk9iaiA9XHJcblx0eDogMFxyXG5cdHk6IDBcclxuXHRzY2FsZTogMVxyXG5cdGFwcGx5OiAoZykgLT5cclxuXHRcdGcudHJhbnNmb3JtIEBzY2FsZSwgMCwgMCwgQHNjYWxlLCBAeCwgQHlcclxuXHJcblxyXG5jbGFzcyBNb2RlbFxyXG5cdEB0cmFuc2Zvcm06ICh4LCB5LCB6LCBjYW1lcmEpIC0+XHJcblx0XHR6ID0gKFpfT1JJR0lOICsgeiArIGNhbWVyYS56KSAqIFpfVFJBTlNGT1JNXHJcblx0XHR0cnNmT2JqLnggPSAoeCArIGNhbWVyYS54KSAqIHpcclxuXHRcdHRyc2ZPYmoueSA9ICh5ICsgY2FtZXJhLnkpICogelxyXG5cdFx0dHJzZk9iai5zY2FsZSA9IHpcclxuXHRcdHRyc2ZPYmpcclxuXHJcblx0Y29uc3RydWN0b3I6IChAZGF0YSkgLT5cclxuXHRcdEBhdHRhY2htZW50ID0gW11cclxuXHRcdEBhbmltYXRpb24gPSBuZXcgQW5pbWF0aW9uXHJcblxyXG5cdHNldERhdGE6IChAZGF0YSkgLT5cclxuXHJcblx0ZHJhdzJEOiAoZywgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRmb3Iga2V5LCBub2RlIG9mIGJvbmVzXHJcblx0XHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCB0aGlzLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdOb2RlOiAoZywgbm9kZSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRub2RlID0gYm9uZXNbbm9kZV1cclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgdGhpcywgb3BhY2l0eVxyXG5cclxuXHRkcmF3UGFydDogKGcsIHBhcnQsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRmb3IgZmFjZSBpbiBwYXJ0LmZhY2VzXHJcblx0XHRcdGRyYXdQYXJ0LmNhbGwgZmFjZSwgZywgdGhpcywgY2FtZXJhLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdQYXJ0czogKGcsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBwYXJ0cyA9IEBkYXRhPy5wYXJ0c1xyXG5cdFx0XHRmb3IgXywgcGFydCBvZiBwYXJ0c1xyXG5cdFx0XHRcdGlmICFwYXJ0LmhpZGVcclxuXHRcdFx0XHRcdGZvciBmYWNlIGluIHBhcnQuZmFjZXNcclxuXHRcdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCB0aGlzLCBjYW1lcmEsIG9wYWNpdHlcclxuXHJcbnRyYW5zZm9ybSA9IE1vZGVsLnRyYW5zZm9ybVxyXG5cclxudHJhbnNmb3JtVmVydCA9ICh2LCBjYW1lcmEpIC0+XHJcblx0dHJhbnNmb3JtIHYueCB8fCAwLCB2LnkgfHwgMCwgdi56IHx8IDAsIGNhbWVyYVxyXG5cclxuZXhwb3J0IHsgTW9kZWxEYXRhLCBNb2RlbCB9IiwiY2xhc3MgRXZlbnRFbW1pdGVyXHJcblx0aGFuZGxlcnM6IFtdXHJcblxyXG5cdG9uOiAoZXZlbnQsIGNhbGxiYWNrKSAtPlxyXG5cdFx0aWYgY2FsbGJhY2tcclxuXHRcdFx0aGFuZGxlciA9IEBoYW5kbGVyc1tldmVudF1cclxuXHRcdFx0aWYgIWhhbmRsZXJcclxuXHRcdFx0XHRAaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlciA9IFtdXHJcblx0XHRcdGlmIGhhbmRsZXIuaW5kZXhPZihjYWxsYmFjaykgPCAwXHJcblx0XHRcdFx0aGFuZGxlci5wdXNoIGNhbGxiYWNrXHJcblx0XHR0aGlzXHJcblxyXG5cdG9mZjogKGV2ZW50LCBjYWxsYmFjaykgLT5cclxuXHRcdGlmIGNhbGxiYWNrXHJcblx0XHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRcdGlmIGhhbmRsZXJcclxuXHRcdFx0XHRpbmRleCA9IGhhbmRsZXIuaW5kZXhPZiBjYWxsYmFja1xyXG5cdFx0XHRcdGlmIGluZGV4ID49IDBcclxuXHRcdFx0XHRcdGhhbmRsZXIuc3BsaWNlIGluZGV4LCAxXHJcblx0XHR0aGlzXHJcblxyXG5cdHRyaWdnZXI6IChldmVudCwgYXJncykgLT5cclxuXHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRpZiBoYW5kbGVyXHJcblx0XHRcdGZvciBjYWxsYmFjayBpbiBoYW5kbGVyXHJcblx0XHRcdFx0Y2FsbGJhY2suYXBwbHkgdGhpcywgYXJnc1xyXG5cdFx0dGhpc1xyXG5cclxuXHRyZW1vdmVFdmVudDogKGV2ZW50KSAtPlxyXG5cdFx0ZGVsZXRlIEBoYW5kbGVyc1tldmVudF1cclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IEV2ZW50RW1taXRlciB9IiwiaW1wb3J0IHsgRXZlbnRFbW1pdGVyIH0gZnJvbSAnLi9ldmVudHMnXHJcblxyXG4jIEV2ZW50czpcclxuIyAnY2hhbmdlcGVyY2VudCcgdHJpZ2dlciB3aGVuIHNvbWUgcmVzb3JjZXMgbG9hZGVkXHJcbiMgJ2xvYWQnIHRyaWdnZXIgd2hlbiBhbGwgcmVzb3JjZXMgbG9hZGVkXHJcblxyXG5jbGFzcyBMb2FkZXIgZXh0ZW5kcyBFdmVudEVtbWl0ZXJcclxuXHRsb2FkUmVzTnVtYmVyID0gMFxyXG5cdGFsbFJlc0xvYWRlciA9IDBcclxuXHJcblx0cmVzZXQ6ICgpIC0+XHJcblx0XHRsb2FkUmVzTnVtYmVyID0gYWxsUmVzTG9hZGVyID0gMFxyXG5cclxuXHRnZXRQZXJjZW50OiAtPlxyXG5cdFx0MSAtIGlmIGFsbFJlc0xvYWRlciAhPSAwIHRoZW4gbG9hZFJlc051bWJlciAvIGFsbFJlc0xvYWRlciBlbHNlIDBcclxuXHJcblx0dXBkYXRlUGVyY2VudDogKCkgLT5cclxuXHRcdEB0cmlnZ2VyICdjaGFuZ2VwZXJjZW50JywgWyBAZ2V0UGVyY2VudCgpIF1cclxuXHJcblx0bG9hZDogKGNhbGxiYWNrKSAtPlxyXG5cdFx0X3RoaXMgPSB0aGlzXHJcblx0XHRsb2FkUmVzTnVtYmVyKytcclxuXHRcdGFsbFJlc0xvYWRlcisrXHJcblx0XHQjIEB1cGRhdGVQZXJjZW50KClcclxuXHRcdC0+XHJcblx0XHRcdGNhbGxiYWNrPy5hcHBseSBfdGhpcywgYXJndW1lbnRzXHJcblx0XHRcdGxvYWRSZXNOdW1iZXItLVxyXG5cdFx0XHRpZiBsb2FkUmVzTnVtYmVyIDw9IDBcclxuXHRcdFx0XHRfdGhpcy5yZXNldCgpXHJcblx0XHRcdFx0X3RoaXMudHJpZ2dlciAnbG9hZCdcclxuXHRcdFx0X3RoaXMudXBkYXRlUGVyY2VudCgpXHJcblxyXG5cdGxvYWRKc29uOiAoZmlsZSwgY2FsbGJhY2spIC0+XHJcblx0XHRjYWxsYmFjayA9IEBsb2FkIGNhbGxiYWNrXHJcblx0XHQkLmdldEpTT04gZmlsZSArICcuanNvbidcclxuXHRcdFx0LmRvbmUgY2FsbGJhY2tcclxuXHRcdFx0LmZhaWwgLT5cclxuXHRcdFx0XHRjYWxsYmFjayBudWxsXHJcblxyXG5cdGxvYWRJbWFnZTogKGZpbGUsIGNhbGxiYWNrKSAtPlxyXG5cdFx0Y2FsbGJhY2sgPSBAbG9hZCBjYWxsYmFja1xyXG5cdFx0aW1nID0gbmV3IEltYWdlXHJcblx0XHRpbWcub25sb2FkID0gLT5cclxuXHRcdFx0Y2FsbGJhY2sgaW1nXHJcblx0XHRpbWcuc3JjID0gZmlsZVxyXG5cdFx0aW1nXHJcblxyXG5leHBvcnQgeyBMb2FkZXIgfSIsImltcG9ydCB7IE1vZGVsRGF0YSwgTW9kZWwgfSBmcm9tICcuL21vZGVsJ1xyXG5pbXBvcnQgeyBBbmltYXRpb25EYXRhIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vbG9hZGVyJ1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkgLT5cclxuXHQkY2FudmFzID0gJCAnI2NhbnZhcydcclxuXHRjYW52YXMgPSAkY2FudmFzLmdldCAwXHJcblx0Y29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0ICcyZCcsIGFscGhhOiBmYWxzZVxyXG5cclxuXHRtb2RlbEZpbGUgPSAnbW9kZWxzL2FyZW5hJ1xyXG5cdGxvYWRlciA9IG5ldyBMb2FkZXJcclxuXHRtb2RlbCA9IG5ldyBNb2RlbFxyXG5cdG1vZGVsRGF0YSA9IG5ldyBNb2RlbERhdGFcclxuXHRhbmltYXRpb25GcmFtZSA9IG51bGxcclxuXHRjYW1lcmEgPVxyXG5cdFx0Y2FudmFzOiBjYW52YXNcclxuXHRcdGc6IGNvbnRleHRcclxuXHRcdHg6IDBcclxuXHRcdHk6IDBcclxuXHRcdHo6IDBcclxuXHJcblx0cmVzaXplID0gLT5cclxuXHRcdGNhbnZhcy53aWR0aCA9ICQod2luZG93KS53aWR0aCgpXHJcblx0XHRjYW52YXMuaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnI2NhbnZhcycpLm9mZnNldCgpLnRvcFxyXG5cclxuXHRyZXNpemUoKVxyXG5cclxuXHQkKHdpbmRvdykub24gJ3Jlc2l6ZScsIHJlc2l6ZVxyXG5cclxuXHRtb2RlbFJlZnJlc2ggPSAtPlxyXG4jXHRcdGZvciBrZXksIF8gb2YgbW9kZWxEYXRhXHJcbiNcdFx0XHRkZWxldGUgbW9kZWxEYXRhW2tleV1cclxuXHRcdG1vZGVsRGF0YS5sb2FkIGxvYWRlciwgbW9kZWxGaWxlXHJcblx0XHJcblx0bG9hZGVyLm9uICdsb2FkJywgLT5cclxuXHRcdG1vZGVsLnNldERhdGEgbW9kZWxEYXRhXHJcblx0XHRpZiBtb2RlbC5hbmltYXRpb24uZGF0YVxyXG5cdFx0XHQjIG1vZGVsLmFuaW1hdGlvbi5zZXQgJ3Rlc3QnXHJcblx0XHRcdCNcclxuXHRcdFx0Y29udGFpbmVyID0gJCAnLmpzLWZyYW1lLWNvbnRhaW5lcidcclxuXHRcdFx0Y29udGFpbmVyLmVtcHR5KClcclxuXHRcdFx0Zm9yIGFuaW0sIF8gb2YgbW9kZWwuYW5pbWF0aW9uLmRhdGFcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kIFwiPGEgY2xhc3M9J2Ryb3Bkb3duLWl0ZW0ganMtZnJhbWUtc2VsZWN0JyBocmVmPScjJz4je2FuaW19PC9hPlwiXHJcblx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHRcdFx0JCgnLmpzLWZyYW1lLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRcdFx0YW5pbWF0aW9uRnJhbWUgPSAkKHRoaXMpLnRleHQoKVxyXG5cdFx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHJcblx0Y29uc29sZS5sb2cgbW9kZWxcclxuXHJcblx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblxyXG5cdHJlbmRlciA9IChkZWx0YSkgLT5cclxuXHRcdGNvbnRleHQuc2F2ZSgpXHJcblx0XHR3ID0gY2FudmFzLndpZHRoXHJcblx0XHRoID0gY2FudmFzLmhlaWdodFxyXG5cdFx0Y3ggPSB3IC8gMlxyXG5cdFx0Y3kgPSBoIC8gMlxyXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZidcclxuXHRcdGNvbnRleHQuZmlsbFJlY3QgMCwgMCwgdywgaFxyXG5cdFx0Y29udGV4dC5iZWdpblBhdGgoKVxyXG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSAyXHJcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gJyNmMDAnXHJcblx0XHRjb250ZXh0Lm1vdmVUbyBjeCwgMFxyXG5cdFx0Y29udGV4dC5saW5lVG8gY3gsIGhcclxuXHRcdGNvbnRleHQubW92ZVRvIDAsIGN5XHJcblx0XHRjb250ZXh0LmxpbmVUbyB3LCBjeVxyXG5cdFx0Y29udGV4dC5zdHJva2UoKVxyXG5cclxuXHRcdGNvbnRleHQudHJhbnNsYXRlIGN4LCBjeVxyXG5cclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5wbGF5KClcclxuXHJcblx0XHRtb2RlbC5kcmF3UGFydHMgY29udGV4dCwgY2FtZXJhXHJcblxyXG5cdFx0TW9kZWwudHJhbnNmb3JtKDAsIDAsIDAsIGNhbWVyYSlcclxuXHRcdFx0LmFwcGx5IGNvbnRleHRcclxuXHJcblx0XHRtb2RlbC5kcmF3MkQgY29udGV4dFxyXG5cclxuXHRcdGNvbnRleHQucmVzdG9yZSgpXHJcblx0XHQjIFxyXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcclxuXHJcblx0cmVuZGVyKDApXHJcblxyXG5cdG9sZE1vdXNlWCA9IG9sZE1vdXNlWSA9MFxyXG5cdG1vdmVDYW1lcmEgPSAoZSkgLT5cclxuXHRcdGNhbWVyYS54ICs9IGUuY2xpZW50WCAtIG9sZE1vdXNlWFxyXG5cdFx0Y2FtZXJhLnkgKz0gZS5jbGllbnRZIC0gb2xkTW91c2VZXHJcblx0XHRvbGRNb3VzZVggPSBlLmNsaWVudFhcclxuXHRcdG9sZE1vdXNlWSA9IGUuY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICdtb3VzZWRvd24nLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUuY2xpZW50WFxyXG5cdFx0b2xkTW91c2VZID0gZS5jbGllbnRZXHJcblx0XHQkY2FudmFzLm9uICdtb3VzZW1vdmUnLCBtb3ZlQ2FtZXJhXHJcblxyXG5cdCRjYW52YXMub24gJ3RvdWNoc3RhcnQnLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUudG91Y2hlc1swXS5jbGllbnRYXHJcblx0XHRvbGRNb3VzZVkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICd0b3VjaG1vdmUnLCAoZSkgLT5cclxuXHRcdG1vdmVDYW1lcmEgZS50b3VjaGVzWzBdXHJcblxyXG5cdCRjYW52YXMub24gJ21vdXNldXAnLCAtPlxyXG5cdFx0JGNhbnZhcy5vZmYgJ21vdXNlbW92ZScsIG1vdmVDYW1lcmFcclxuXHJcblx0JCgnLmpzLXotbnVtYmVyJylcclxuXHRcdC52YWwgY2FtZXJhLnpcclxuXHRcdC5vbiAnaW5wdXQgY2hhbmdlJywgLT5cclxuXHRcdFx0Y2FtZXJhLnogPSArICQodGhpcykudmFsKClcclxuXHJcblx0JCgnLmpzLW1vZGVsLXNlbGVjdCcpLmNsaWNrIChlKSAtPlxyXG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKVxyXG5cdFx0bW9kZWxEYXRhID0gbmV3IE1vZGVsRGF0YVxyXG5cdFx0bW9kZWxGaWxlID0gJCh0aGlzKS5kYXRhICdmaWxlJ1xyXG5cclxuXHQkKCcuanMtYW5pbS1zZWxlY3QnKS5jbGljayAoZSkgLT5cclxuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcclxuXHRcdGZpbGUgPSAkKHRoaXMpLmRhdGEgJ2ZpbGUnXHJcblx0XHRtb2RlbC5hbmltYXRpb24uZGF0YSA9IG5ldyBBbmltYXRpb25EYXRhXHJcblx0XHRtb2RlbC5hbmltYXRpb24uZGF0YS5sb2FkIGxvYWRlciwgZmlsZVxyXG5cdFx0JCgnLmpzLWFuaW0tcmVmcmVzaCcpLmRhdGEgJ2ZpbGUnLCBmaWxlXHJcblx0XHQjXHJcblx0XHQkKCcuanMtcmVmcmVzaC1tb2RlbCcpLnByb3AgJ2NoZWNrZWQnLCBmYWxzZVxyXG5cdFx0Y2xlYXJJbnRlcnZhbCBtUmVmcmVzaEludGVydmFsXHJcblxyXG5cdE1vZGVsLmRyYXdPcmlnaW4gPSB0cnVlXHJcblx0JCgnLmpzLWRyYXctb3JpZ2luJykuY2hhbmdlIC0+XHJcblx0XHRNb2RlbC5kcmF3T3JpZ2luID0gJCh0aGlzKS5wcm9wICdjaGVja2VkJ1xyXG5cclxuXHQkKCcuanMtcmVmcmVzaC1tb2RlbCcpLmNoYW5nZSAtPlxyXG5cdFx0aWYgJCh0aGlzKS5wcm9wICdjaGVja2VkJ1xyXG5cdFx0XHRtUmVmcmVzaEludGVydmFsID0gc2V0SW50ZXJ2YWwgbW9kZWxSZWZyZXNoLCA1MDBcclxuXHRcdGVsc2VcclxuXHRcdFx0Y2xlYXJJbnRlcnZhbCBtUmVmcmVzaEludGVydmFsXHJcblxyXG5cdCQoJy5qcy1yZXNldC1wb3MnKS5jbGljayAtPlxyXG5cdFx0Y2FtZXJhLnggPSBjYW1lcmEueSA9IGNhbWVyYS56ID0gMFxyXG5cdFx0JCgnLmpzLXotbnVtYmVyJykudmFsICcwJ1xyXG5cclxuXHRmdWxsc2NyZWVuID0gZmFsc2VcclxuXHQkKCcuanMtZnVsbC1zY3JlZW4nKS5jbGljayAtPlxyXG5cdFx0aWYgZnVsbHNjcmVlblxyXG5cdFx0XHRjYW5jZWxGdWxsc2NyZWVuKClcclxuXHRcdGVsc2VcclxuXHRcdFx0bGF1bmNoRnVsbFNjcmVlbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcclxuXHRcdGZ1bGxzY3JlZW4gPSAhZnVsbHNjcmVlblxyXG5cclxuXHRsYXVuY2hGdWxsU2NyZWVuID0gKGVsZW1lbnQpIC0+XHJcblx0XHRpZiBlbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuXHJcblx0XHRcdGVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuXHJcblx0XHRcdGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuXHJcblx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oKVxyXG5cclxuXHRjYW5jZWxGdWxsc2NyZWVuID0gLT5cclxuXHRcdGlmIGRvY3VtZW50LmNhbmNlbEZ1bGxTY3JlZW5cclxuXHRcdFx0ZG9jdW1lbnQuY2FuY2VsRnVsbFNjcmVlbigpXHJcblx0XHRlbHNlIGlmIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW5cclxuXHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpXHJcblx0XHRlbHNlIGlmIGRvY3VtZW50LndlYmtpdENhbmNlbEZ1bGxTY3JlZW5cclxuXHRcdFx0ZG9jdW1lbnQud2Via2l0Q2FuY2VsRnVsbFNjcmVlbigpIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFBOztBQUFNO0VBQU4sTUFBQSxPQUFBO0lBR1EsT0FBTixJQUFNLENBQUMsTUFBRCxFQUFTLElBQVQ7VUFDTjtNQUFBLE1BQUEsR0FBUyxNQUFNLENBQUMsS0FBTSxDQUFBLElBQUE7TUFDdEIsSUFBQSxDQUFPLE1BQVA7UUFDQyxNQUFBLEdBQVMsSUFBSTtRQUNi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
